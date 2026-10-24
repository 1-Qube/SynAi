import { allChunks, clauseFromChunk, markConflictDocs } from './corpus.js';
import { detectConflicts } from './conflicts.js';
import { generateGroundedAnswer, hasGeminiKey } from './gemini.js';
import { retrievalQuery, searchChunks } from './retrieve.js';

function numbersIn(text) {
  return [...String(text || '').matchAll(/\d+(?:\.\d+)?/g)].map((match) => match[0]);
}

function numbersAreGrounded(text, sources) {
  const allowed = new Set(sources.flatMap((source) => numbersIn(source)));
  return numbersIn(text).every((value) => allowed.has(value));
}

function abstain(query, reason) {
  return {
    message: {
      role: 'assistant',
      latency: '0ms',
      status: 'NOT FOUND IN CORPUS',
      statusType: 'warning',
      summary: reason || `No indexed passage in the selected documents answers: "${query}".`,
      findings: [],
      recommendation: 'ABSTAINED: SynAI will not infer a technical limit that is not present in the selected documents. Upload the governing manual or widen the corpus scope.'
    },
    clauses: [],
    conflicts: detectConflicts(allChunks()),
    traces: []
  };
}

function citation(chunk) {
  return {
    docId: chunk.docId,
    clauseKey: chunk.clauseKey,
    label: `${chunk.docId} · ${chunk.clauseKey}`
  };
}

function mergeClause(list, chunk) {
  if (list.some((item) => item.docId === chunk.docId && item.clauseKey === chunk.clauseKey)) return;
  list.push({
    docId: chunk.docId,
    clauseKey: chunk.clauseKey,
    clause: clauseFromChunk(chunk)
  });
}

export async function answerQuestion({ query, documentIds, history }) {
  const started = Date.now();
  const scoped = allChunks(documentIds);
  if (!scoped.length) {
    return abstain(query, 'No documents are in scope. Include at least one indexed document before executing a query.');
  }

  const expanded = retrievalQuery(query, history);
  const hits = searchChunks(expanded, scoped, 8);
  if (!hits.length) {
    return abstain(query, `The selected documents do not contain indexed text matching "${query}".`);
  }

  const conflicts = detectConflicts(scoped);
  if (conflicts.length) {
    markConflictDocs(conflicts.flatMap((item) => [item.leftDocId, item.rightDocId]));
  }

  let modelAnswer = null;
  let modelError = null;
  if (hasGeminiKey()) {
    try {
      const generated = await generateGroundedAnswer({ query, evidence: hits, history });
      modelAnswer = generated.answer;
    } catch (error) {
      modelError = error.message;
    }
  } else {
    modelError = 'GEMINI_API_KEY is not configured';
  }

  const clauses = [];
  const traces = [];
  const findings = [];

  if (modelAnswer && modelAnswer.found === false) {
    const result = abstain(query, modelAnswer.summary || undefined);
    result.message.latency = `${Date.now() - started}ms`;
    result.conflicts = conflicts;
    return result;
  }

  if (modelAnswer?.findings?.length) {
    modelAnswer.findings.slice(0, 4).forEach((finding, index) => {
      const first = hits[finding.evidenceIndex];
      if (!first) return;
      const second = Number.isInteger(finding.evidenceIndex2) ? hits[finding.evidenceIndex2] : null;
      const sources = [first.chunk.text, second?.chunk.text].filter(Boolean);
      const claim = `${finding.text || ''} ${finding.textCont || ''}`;
      if (!numbersAreGrounded(claim, sources)) return;
      mergeClause(clauses, first.chunk);
      if (second) mergeClause(clauses, second.chunk);
      findings.push({
        label: finding.label || `${String(index + 1).padStart(2, '0')} / EVIDENCE`,
        text: finding.text || 'The cited passage states:',
        citation1: citation(first.chunk),
        textCont: finding.textCont || '',
        citation2: second ? citation(second.chunk) : null
      });
      traces.push({
        id: `CLM-${String(traces.length + 1).padStart(2, '0')}`,
        claim: (finding.text || claim).slice(0, 280),
        sourceDoc: first.chunk.filename,
        location: `Page ${first.chunk.page} · ${first.chunk.section}`,
        bbox: first.chunk.bbox,
        rawExcerpt: `"${first.chunk.excerpt.slice(0, 360)}"`,
        status: 'VERIFIED · EXCERPT MATCH'
      });
    });
  }

  if (!findings.length) {
    hits.slice(0, 3).forEach((hit, index) => {
      mergeClause(clauses, hit.chunk);
      findings.push({
        label: modelError
          ? `${String(index + 1).padStart(2, '0')} / EXTRACTED EVIDENCE (MODEL UNAVAILABLE)`
          : `${String(index + 1).padStart(2, '0')} / RETRIEVED PASSAGE`,
        text: `Retrieved from ${hit.chunk.filename}, page ${hit.chunk.page}. No generated number was added:`,
        citation1: citation(hit.chunk),
        textCont: hit.chunk.excerpt.slice(0, 420),
        citation2: null
      });
      traces.push({
        id: `CLM-${String(index + 1).padStart(2, '0')}`,
        claim: `Passage retrieved for "${query}"`,
        sourceDoc: hit.chunk.filename,
        location: `Page ${hit.chunk.page} · ${hit.chunk.section}`,
        bbox: hit.chunk.bbox,
        rawExcerpt: `"${hit.chunk.excerpt.slice(0, 360)}"`,
        status: modelError ? 'EXTRACTIVE · MODEL UNAVAILABLE' : 'VERIFIED · EXCERPT MATCH'
      });
    });
  }

  const conflict = Boolean(modelAnswer?.conflict) || conflicts.length > 0;
  const recommendation = modelAnswer?.recommendation && numbersAreGrounded(modelAnswer.recommendation, hits.map((hit) => hit.chunk.text))
    ? modelAnswer.recommendation
    : conflict
      ? 'ACTION REQUIRED: Conflicting values were found across the selected documents. Open each citation and reconcile the governing setpoint before use.'
      : modelError
        ? `MODEL NOTE: ${modelError}. Showing retrieved excerpts only.`
        : 'VERIFICATION TRACE: Open the citation badges to inspect the verbatim page excerpt. No value was added beyond those excerpts.';

  return {
    message: {
      role: 'assistant',
      latency: `${Date.now() - started}ms`,
      status: conflict ? 'PARAMETER CONFLICT DETECTED' : modelError ? 'EXTRACTIVE EVIDENCE ONLY' : 'EVIDENCE BOUND',
      statusType: conflict || modelError ? 'warning' : 'verified',
      summary: modelAnswer?.summary && numbersAreGrounded(modelAnswer.summary, hits.map((hit) => hit.chunk.text))
        ? modelAnswer.summary
        : `Retrieved ${findings.length} passage(s) from the selected documents for "${query}".`,
      findings,
      recommendation
    },
    clauses,
    conflicts,
    traces,
    inspection: clauses[0] ? { docId: clauses[0].docId, clauseKey: clauses[0].clauseKey } : null
  };
}

export function compareDocuments(documentIds) {
  const chunks = allChunks(documentIds);
  const conflicts = detectConflicts(chunks);
  if (conflicts.length) {
    markConflictDocs(conflicts.flatMap((item) => [item.leftDocId, item.rightDocId]));
  }
  return conflicts;
}
