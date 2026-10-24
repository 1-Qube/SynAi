import { allChunks, clauseFromChunk, markConflictDocs } from './corpus.js';
import { detectConflicts } from './conflicts.js';
import { expandSearchQuery, generateGroundedAnswer, hasGeminiKey } from './gemini.js';
import { copyFor } from './i18n.js';
import { retrievalQuery, searchChunks } from './retrieve.js';

function numbersIn(text) {
  return [...String(text || '').matchAll(/\d+(?:\.\d+)?/g)].map((match) => match[0]);
}

function numbersAreGrounded(text, sources) {
  const allowed = new Set(sources.flatMap((source) => numbersIn(source)));
  return numbersIn(text).every((value) => allowed.has(value));
}

function abstain(query, reason, language = 'en') {
  const copy = copyFor(language);
  return {
    message: {
      role: 'assistant',
      latency: '0ms',
      status: copy.notFound,
      statusType: 'warning',
      summary: reason || copy.notFoundSummary(query),
      findings: [],
      recommendation: copy.abstain
    },
    clauses: [],
    conflicts: detectConflicts(allChunks(), language),
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

export async function answerQuestion({ query, documentIds, history, language = 'en' }) {
  const started = Date.now();
  const copy = copyFor(language);
  const scoped = allChunks(documentIds);
  if (!scoped.length) {
    return abstain(query, copy.noDocs, language);
  }

  let expanded = retrievalQuery(query, history);
  if (/[\u0400-\u04FF]/.test(expanded)) {
    const extra = await expandSearchQuery(expanded);
    if (extra) expanded = `${expanded} ${extra}`;
  }
  const hits = searchChunks(expanded, scoped, 8);
  if (!hits.length) {
    return abstain(query, copy.noMatch(query), language);
  }

  const conflicts = detectConflicts(scoped, language);
  if (conflicts.length) {
    markConflictDocs(conflicts.flatMap((item) => [item.leftDocId, item.rightDocId]));
  }

  let modelAnswer = null;
  let modelError = null;
  if (hasGeminiKey()) {
    try {
      const generated = await generateGroundedAnswer({ query, evidence: hits, history, languageName: copy.name });
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
    const result = abstain(query, modelAnswer.summary || undefined, language);
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
        text: `${copy.retrievedLead} ${hit.chunk.filename}, ${copy.page} ${hit.chunk.page}. ${copy.noAdded}`,
        citation1: citation(hit.chunk),
        textCont: hit.chunk.excerpt.slice(0, 420),
        citation2: null
      });
      traces.push({
        id: `CLM-${String(index + 1).padStart(2, '0')}`,
        claim: `${copy.passage} "${query}"`,
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
      ? copy.action
      : modelError
        ? copy.modelNote(modelError)
        : copy.trace;

  return {
    message: {
      role: 'assistant',
      latency: `${Date.now() - started}ms`,
      status: conflict ? copy.conflict : modelError ? copy.extractive : copy.evidence,
      statusType: conflict || modelError ? 'warning' : 'verified',
      summary: modelAnswer?.summary && numbersAreGrounded(modelAnswer.summary, hits.map((hit) => hit.chunk.text))
        ? modelAnswer.summary
        : copy.retrieved(findings.length, query),
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
