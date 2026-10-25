const STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were', 'what', 'when', 'where',
  'which', 'into', 'about', 'against', 'check', 'please', 'does', 'did', 'how', 'why', 'who', 'whom',
  'is', 'of', 'to', 'in', 'on', 'a', 'an', 'or', 'not', 'any', 'can', 'you', 'me', 'tell',
  'что', 'как', 'для', 'это', 'или', 'при', 'нет', 'какое', 'какой', 'какая', 'какие', 'каков', 'какова',
  'указан', 'указано', 'указана', 'на', 'по', 'из', 'от', 'до', 'не', 'ли', 'же', 'бы', 'в', 'и', 'о',
  'және', 'ғана', 'бар', 'қандай', 'қалай', 'не', 'ма', 'ме'
]);

const CONCEPTS = [
  ['pressure', 'press', 'давлен', 'қысым', 'bar', 'psi', 'мпа'],
  ['maximum', 'max', 'максимальн', 'наибольш', 'ең жоғары'],
  ['operating', 'operat', 'рабоч', 'эксплуатац', 'жұмыс'],
  ['permitted', 'permit', 'allowable', 'разреш', 'допустим', 'рұқсат'],
  ['flow', 'расход', 'ағын', 'м³', 'm3'],
  ['temperature', 'temp', 'температур', 'температура'],
  ['pump', 'насос', 'сорғы'],
  ['motor', 'двигател', 'электродвигател', 'қозғалтқыш'],
  ['valve', 'клапан', 'вентиль'],
  ['fluid', 'жидкост', 'вода', 'су'],
  ['torque', 'момент', 'крутящ'],
  ['maintenance', 'обслуживан', 'қызмет']
];

const TESTER_SECTION = /контрольные данные для тестирования|ожидаемый результат|тест на галлюцинац/i;

export function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/n·m/g, 'nm')
    .replace(/[^a-z0-9\u0400-\u04ff.°+%³]+/gi, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP.has(token));
}

function fold(value) {
  return String(value || '').toLowerCase().replace(/ё/g, 'е');
}

function conceptsIn(text) {
  const value = fold(text);
  const found = new Set();
  CONCEPTS.forEach((group, index) => {
    if (group.some((term) => value.includes(term))) found.add(index);
  });
  return found;
}

function identifiers(text) {
  return [...new Set(String(text || '').match(/\b[A-Za-z]{1,4}-\d{2,4}\b/g) || [])];
}

function isTesterChunk(chunk) {
  return TESTER_SECTION.test(`${chunk.section || ''}\n${String(chunk.text || '').slice(0, 500)}`);
}

function wantsTesterSection(query) {
  return /контрол|тест|галлюцинац|expected result|test harness/i.test(query);
}

export function searchChunks(query, chunks, limit = 4) {
  const pool = chunks.filter((chunk) => wantsTesterSection(query) || !isTesterChunk(chunk));
  if (!pool.length) return [];

  const docs = pool.map((chunk) => tokenize(`${chunk.text} ${chunk.filename} ${chunk.title} ${chunk.section}`));
  const avgdl = docs.reduce((sum, tokens) => sum + tokens.length, 0) / docs.length || 1;
  const df = new Map();
  for (const tokens of docs) {
    for (const token of new Set(tokens)) df.set(token, (df.get(token) || 0) + 1);
  }
  const qTokens = tokenize(query);
  const qConcepts = conceptsIn(query);
  const qIds = identifiers(query).map(fold);
  const k1 = 1.2;
  const b = 0.75;

  const ranked = pool.map((chunk, index) => {
    const tf = new Map();
    for (const token of docs[index]) tf.set(token, (tf.get(token) || 0) + 1);
    let lexical = 0;
    for (const token of qTokens) {
      const n = df.get(token) || 0;
      if (!n) continue;
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      const freq = tf.get(token) || 0;
      const dl = docs[index].length || 1;
      lexical += idf * ((freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (dl / avgdl))));
    }
    const text = fold(`${chunk.text} ${chunk.section}`);
    const overlap = [...qConcepts].filter((id) => conceptsIn(text).has(id)).length;
    const idHits = qIds.filter((id) => text.includes(id)).length;
    const specific = qConcepts.size > 0 || qIds.length > 0;
    if (specific && overlap === 0 && idHits === 0) return { chunk, score: 0, overlap, idHits };
    if (!specific && lexical <= 0) return { chunk, score: 0, overlap, idHits };
    return { chunk, score: overlap * 6 + idHits * 10 + lexical, overlap, idHits };
  }).filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.overlap - left.overlap);

  if (!ranked.length) return [];
  const best = ranked[0];
  const floor = Math.max(best.score * 0.35, 0.01);
  return ranked.filter((item) => item.score >= floor).slice(0, limit);
}

export function retrievalQuery(query, history = []) {
  const short = tokenize(query).length < 5;
  const pronoun = /^(it|that|this|those|them|same|also|and|what about|how about|why|он|она|это|осы|сол)\b/i.test(query.trim());
  if (!short && !pronoun) return query;
  const prior = history
    .filter((item) => item.role === 'user')
    .slice(-2)
    .map((item) => item.text)
    .join(' ');
  return `${prior} ${query}`.trim();
}
