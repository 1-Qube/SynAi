const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were', 'what', 'when', 'where', 'which', 'into', 'about', 'against', 'check', 'please']);

export function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/n·m/g, 'nm')
    .replace(/[^a-z0-9.°+%]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP.has(token));
}

export function searchChunks(query, chunks, limit = 8) {
  if (!chunks.length) return [];
  const docs = chunks.map((chunk) => tokenize(`${chunk.text} ${chunk.filename} ${chunk.title} ${chunk.section}`));
  const avgdl = docs.reduce((sum, tokens) => sum + tokens.length, 0) / docs.length || 1;
  const df = new Map();
  for (const tokens of docs) {
    for (const token of new Set(tokens)) df.set(token, (df.get(token) || 0) + 1);
  }
  const qTokens = tokenize(query);
  const k1 = 1.2;
  const b = 0.75;
  const ranked = chunks.map((chunk, index) => {
    const tf = new Map();
    for (const token of docs[index]) tf.set(token, (tf.get(token) || 0) + 1);
    let score = 0;
    for (const token of qTokens) {
      const n = df.get(token) || 0;
      if (!n) continue;
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      const freq = tf.get(token) || 0;
      const dl = docs[index].length || 1;
      score += idf * ((freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (dl / avgdl))));
    }
    return { chunk, score };
  }).sort((a, b) => b.score - a.score);

  const positive = ranked.filter((item) => item.score > 0);
  const picked = [];
  const seenDocs = new Set();
  for (const item of positive) {
    if (seenDocs.has(item.chunk.docId)) continue;
    picked.push(item);
    seenDocs.add(item.chunk.docId);
  }
  for (const item of positive) {
    if (picked.length >= limit) break;
    if (!picked.includes(item)) picked.push(item);
  }
  return picked.slice(0, limit);
}

export function retrievalQuery(query, history = []) {
  const short = tokenize(query).length < 7;
  const pronoun = /^(it|that|this|those|them|same|also|and|what about|how about|why)\b/i.test(query.trim());
  if (!short && !pronoun) return query;
  const prior = history
    .filter((item) => item.role === 'user')
    .slice(-2)
    .map((item) => item.text)
    .join(' ');
  return `${prior} ${query}`.trim();
}
