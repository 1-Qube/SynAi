import { tokenize } from './retrieve.js';

const UNIT_RE = /(?<![\w.])(\d+(?:\.\d+)?)\s*(°C|°F|\bC\b|\bF\b|bar\(a\)|bar|psi|N·m|Nm|mm|Ω|ohms?|ms|%)/gi;

const FAMILIES = [
  { id: 'temperature', test: /temp|thermal|trip|lahh|lah\b|°c|°f/i },
  { id: 'pressure', test: /press|barrier|diff|pdsll|bar|psi/i },
  { id: 'torque', test: /torque|stud|bolt|n·m|nm\b/i },
  { id: 'resistance', test: /resist|ohm|ω|loop/i },
  { id: 'time', test: /pulse|duration|\bms\b|millisecond/i }
];

function canonicalUnit(unit) {
  const value = unit.toLowerCase().replace('ω', 'Ω');
  if (value === '°c' || value === '°f' || value === 'c' || value === 'f') return 'temperature';
  if (value === 'bar' || value === 'bar(a)' || value === 'psi') return 'pressure';
  if (value === 'n·m' || value === 'nm') return 'torque';
  if (value.includes('ohm') || value === 'ω') return 'resistance';
  if (value === 'ms') return 'time';
  return value;
}

function toCanonical(value, unit) {
  const u = unit.toLowerCase();
  if (u === '°f' || u === 'f') return ((value - 32) * 5) / 9;
  if (u === 'psi') return value * 0.0689476;
  if (u === 'nm') return value;
  return value;
}

function familyFor(context, unit) {
  const byUnit = canonicalUnit(unit);
  if (FAMILIES.some((family) => family.id === byUnit)) return byUnit;
  const hit = FAMILIES.find((family) => family.test.test(context));
  return hit ? hit.id : byUnit;
}

export function extractMeasurements(chunks) {
  const measurements = [];
  for (const chunk of chunks) {
    const text = chunk.text || '';
    for (const match of text.matchAll(UNIT_RE)) {
      const value = Number(match[1]);
      const unit = match[2];
      const start = Math.max(0, match.index - 90);
      const context = text.slice(start, match.index + match[0].length + 30).replace(/\s+/g, ' ');
      measurements.push({
        value,
        unit,
        canonical: toCanonical(value, unit),
        family: familyFor(context, unit),
        context,
        tokens: new Set(tokenize(context)),
        chunk
      });
    }
  }
  return measurements;
}

function jaccard(a, b) {
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union ? intersection / union : 0;
}

export function detectConflicts(chunks) {
  const measurements = extractMeasurements(chunks);
  const conflicts = [];
  const used = new Set();

  for (let i = 0; i < measurements.length; i += 1) {
    for (let j = i + 1; j < measurements.length; j += 1) {
      const left = measurements[i];
      const right = measurements[j];
      if (left.chunk.docId === right.chunk.docId) continue;
      if (left.family !== right.family) continue;
      const similarity = jaccard(left.tokens, right.tokens);
      if (similarity < 0.18) continue;
      const delta = Math.abs(left.canonical - right.canonical);
      const base = Math.max(Math.abs(left.canonical), Math.abs(right.canonical), 0.001);
      if (delta / base < 0.03) continue;
      const key = [left.family, left.chunk.docId, right.chunk.docId, left.value, right.value].sort().join('|');
      if (used.has(key)) continue;
      used.add(key);
      const sign = right.canonical - left.canonical;
      conflicts.push({
        id: `DIFF-${String(conflicts.length + 1).padStart(2, '0')}`,
        parameter: `${left.family[0].toUpperCase()}${left.family.slice(1)} setpoint mismatch`,
        unit: left.unit,
        oemDoc: `${left.chunk.filename} (P.${left.chunk.page})`,
        oemValue: `${left.value} ${left.unit}`,
        siteDoc: `${right.chunk.filename} (P.${right.chunk.page})`,
        siteValue: `${right.value} ${right.unit}`,
        delta: `${sign > 0 ? '+' : ''}${sign.toFixed(2)} ${left.family.toUpperCase()}`,
        severity: delta / base > 0.08 ? 'CRITICAL SAFETY DRIFT' : 'CONTAINMENT RISK',
        resolution: `Values for related ${left.family} parameters disagree. Confirm the governing document before applying either setpoint. Left excerpt: "${left.context.trim()}". Right excerpt: "${right.context.trim()}".`,
        leftDocId: left.chunk.docId,
        rightDocId: right.chunk.docId,
        leftClauseKey: left.chunk.clauseKey,
        rightClauseKey: right.chunk.clauseKey
      });
      if (conflicts.length >= 8) return conflicts;
    }
  }
  return conflicts;
}
