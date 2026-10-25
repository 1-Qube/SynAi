import { allChunks, clauseFromChunk, markConflictDocs } from './corpus.js';
import { detectConflicts } from './conflicts.js';
import { GeminiError, generateGroundedAnswer, hasGeminiKey } from './gemini.js';
import { copyFor } from './i18n.js';
import { retrievalQuery, searchChunks } from './retrieve.js';

function numbersIn(text) {
  return [...String(text || '').matchAll(/\d+(?:\.\d+)?/g)].map((match) => match[0]);
}

function numbersAreGrounded(text, sources) {
  const allowed = new Set(sources.flatMap((source) => numbersIn(source)));
  return numbersIn(text).every((value) => allowed.has(value));
}

function abstain(query, reason, language = 'en', latency = '0ms') {
  const copy = copyFor(language);
  return {
    message: {
      role: 'assistant',
      latency,
      status: copy.notFound,
      statusType: 'warning',
      summary: reason || copy.notFoundSummary(query),
      findings: [],
      recommendation: ''
    },
    clauses: [],
    conflicts: detectConflicts(allChunks(), language),
    traces: []
  };
}

const EXCERPT_GROUPS = [
  ['pressure', 'press', 'давлен', 'қысым'],
  ['maximum', 'max', 'максимальн'],
  ['operating', 'operat', 'рабоч'],
  ['permitted', 'permit', 'allow', 'разреш', 'допустим'],
  ['flow', 'расход', 'ағын'],
  ['pump', 'насос', 'сорғы'],
  ['motor', 'двигател']
];

function supportingExcerpt(chunk, query) {
  const lines = String(chunk.text || '')
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 8 && !/^synai\s·/i.test(line) && !/^страница\s+\d/i.test(line));
  if (!lines.length) return '';
  const foldedQuery = String(query || '').toLowerCase();
  const tokens = foldedQuery.split(/[^a-z0-9\u0400-\u04ff]+/i).filter((token) => token.length > 3);
  const active = EXCERPT_GROUPS
    .filter((group) => group.some((stem) => foldedQuery.includes(stem)))
    .flat();
  const score = (line) => {
    const folded = line.toLowerCase();
    return tokens.reduce((sum, token) => sum + (folded.includes(token) ? 2 : 0), 0)
      + active.reduce((sum, stem) => sum + (folded.includes(stem) ? 3 : 0), 0);
  };
  let bestIndex = 0;
  let bestScore = -1;
  lines.forEach((line, index) => {
    const value = score(line);
    if (value > bestScore) {
      bestScore = value;
      bestIndex = index;
    }
  });
  const picked = [lines[bestIndex]];
  const next = lines[bestIndex + 1];
  if (next && (lines[bestIndex].endsWith('?') || /^(о:|a:)/i.test(next))) picked.push(next);
  let text = picked.join(' ');
  if (text.length > 220) text = `${text.slice(0, 217).trim()}…`;
  return text;
}

function citation(chunk, query) {
  return {
    docId: chunk.docId,
    clauseKey: chunk.clauseKey,
    filename: chunk.filename,
    page: chunk.page,
    section: chunk.section,
    excerpt: supportingExcerpt(chunk, query),
    label: `${chunk.filename} · p.${chunk.page}`
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

function claimsNotFound(answer) {
  if (!answer || answer.found === false) return true;
  const text = `${answer.summary || ''} ${(answer.findings || []).map((item) => item.text || '').join(' ')}`;
  return /not (specified|stated|found|contain)|does not (specify|state|contain)|cannot be found|не (указан|содержит|найден)|не найден|құжатта жоқ|көрсетілмеген/i.test(text)
    && !numbersIn(text).length;
}

function sourcesFrom(findings, hits, clauses, query) {
  const sources = [];
  for (const finding of findings || []) {
    for (const index of [finding.evidenceIndex, finding.evidenceIndex2]) {
      if (!Number.isInteger(index)) continue;
      const hit = hits[index];
      if (!hit) continue;
      mergeClause(clauses, hit.chunk);
      if (sources.some((item) => item.docId === hit.chunk.docId && item.clauseKey === hit.chunk.clauseKey)) continue;
      sources.push(citation(hit.chunk, query));
    }
  }
  return sources;
}

export async function answerQuestion({ query, documentIds, history, language = 'en' }) {
  const started = Date.now();
  const copy = copyFor(language);
  const scoped = allChunks(documentIds);
  if (!scoped.length) {
    return abstain(query, copy.noDocs, language);
  }

  const expanded = retrievalQuery(query, history);
  const hits = searchChunks(expanded, scoped, 4);
  if (!hits.length) {
    return abstain(query, copy.notFoundSummary(query), language, `${Date.now() - started}ms`);
  }

  const conflicts = detectConflicts(scoped, language);
  if (conflicts.length) {
    markConflictDocs(conflicts.flatMap((item) => [item.leftDocId, item.rightDocId]));
  }

  if (!hasGeminiKey()) {
    throw new GeminiError(
      'GEMINI_API_KEY is not set. Add it to the server .env file. The key is never sent to the browser.',
      'missing_key',
      500
    );
  }

  const generated = await generateGroundedAnswer({
    query,
    evidence: hits,
    history,
    languageName: copy.name
  });
  const modelAnswer = generated.answer;
  const sources = hits.map((hit) => hit.chunk.text);
  const latency = `${Date.now() - started}ms`;

  if (claimsNotFound(modelAnswer)) {
    const clauses = [];
    const cited = sourcesFrom(modelAnswer?.findings, hits, clauses, query);
    const summary = modelAnswer?.summary && (numbersAreGrounded(modelAnswer.summary, sources) || !numbersIn(modelAnswer.summary).length)
      ? modelAnswer.summary
      : copy.notFoundSummary(query);
    return {
      message: {
        role: 'assistant',
        latency,
        status: copy.notFound,
        statusType: 'warning',
        summary,
        findings: [],
        sources: cited,
        recommendation: ''
      },
      clauses,
      conflicts,
      traces: []
    };
  }

  const clauses = [];
  const findings = [];
  (modelAnswer.findings || []).slice(0, 4).forEach((finding) => {
    const first = hits[finding.evidenceIndex];
    if (!first) return;
    const second = Number.isInteger(finding.evidenceIndex2) ? hits[finding.evidenceIndex2] : null;
    const claimSources = [first.chunk.text, second?.chunk.text].filter(Boolean);
    const claim = `${finding.text || ''} ${finding.textCont || ''}`;
    if (!numbersAreGrounded(claim, claimSources)) return;
    mergeClause(clauses, first.chunk);
    if (second) mergeClause(clauses, second.chunk);
    findings.push({
      label: finding.label || '',
      text: finding.text || '',
      citation1: citation(first.chunk, query),
      textCont: '',
      citation2: second ? citation(second.chunk, query) : null
    });
  });

  const summary = modelAnswer.summary && numbersAreGrounded(modelAnswer.summary, sources)
    ? modelAnswer.summary
    : findings.length
      ? copy.answeredFromDocs
      : '';

  if (!findings.length || !summary) {
    const result = abstain(query, copy.notFoundSummary(query), language, latency);
    result.conflicts = conflicts;
    return result;
  }

  const conflict = Boolean(modelAnswer.conflict) || conflicts.length > 0;
  const cited = sourcesFrom(modelAnswer.findings, hits, clauses, query);
  const recommendation = modelAnswer.recommendation && numbersAreGrounded(modelAnswer.recommendation, sources)
    ? modelAnswer.recommendation
    : conflict
      ? copy.action
      : '';
  const sameAsSummary = recommendation && recommendation.replace(/\s+/g, ' ').trim().toLowerCase() === summary.replace(/\s+/g, ' ').trim().toLowerCase();

  return {
    message: {
      role: 'assistant',
      latency,
      status: conflict ? copy.conflict : '',
      statusType: conflict ? 'warning' : 'verified',
      summary,
      findings: [],
      sources: cited,
      recommendation: sameAsSummary ? '' : recommendation
    },
    clauses,
    conflicts,
    traces: []
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
