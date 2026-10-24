import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
const DATA_DIR = path.resolve('data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const CORPUS_PATH = path.join(DATA_DIR, 'corpus.json');

function ensureDirs() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function chunksFromClauses(doc) {
  return Object.entries(doc.clauses || {}).map(([clauseKey, clause]) => ({
    id: `${doc.id}:${clauseKey}`,
    docId: doc.id,
    filename: doc.filename,
    title: doc.title,
    page: clause.page,
    section: clause.section,
    clauseKey,
    text: [clause.section, clause.verbatim, ...(clause.tableData || []).map((row) => `${row.param}: ${row.spec} (${row.tolerance})`)].join('\n'),
    excerpt: clause.verbatim,
    bbox: clause.bbox,
    schematicType: clause.schematicType || 'SEAL_PLAN_53B',
    tableData: clause.tableData || []
  }));
}

function load() {
  ensureDirs();
  if (!fs.existsSync(CORPUS_PATH)) return [];
  const parsed = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'));
  return (parsed.documents || []).filter((doc) => !doc.seeded && Array.isArray(doc.chunks) && doc.chunks.length);
}

function save(documents) {
  ensureDirs();
  fs.writeFileSync(CORPUS_PATH, JSON.stringify({ documents }, null, 2));
}

let documents = load();

export function listDocuments() {
  return documents;
}

export function getDocument(id) {
  return documents.find((doc) => doc.id === id) || null;
}

export function toClientDocument(doc) {
  const { chunks, filePath, rawText, ...client } = doc;
  return client;
}

export function nextDocumentId() {
  const nums = documents.map((doc) => {
    const match = String(doc.id).match(/(\d+)$/);
    return match ? Number(match[1]) : 0;
  });
  const next = Math.max(0, ...nums) + 1;
  return `DOC-${String(next).padStart(2, '0')}`;
}

export function addDocument(doc) {
  documents = [doc, ...documents.filter((existing) => existing.id !== doc.id)];
  save(documents);
  return doc;
}

export function updateDocument(id, patch) {
  documents = documents.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc));
  save(documents);
  return getDocument(id);
}

export function markConflictDocs(docIds) {
  const flagged = new Set(docIds);
  documents = documents.map((doc) => {
    if (!flagged.has(doc.id)) {
      if (doc.status === 'CONFLICT DETECTED') return { ...doc, status: 'INDEXED' };
      return doc;
    }
    return { ...doc, status: 'CONFLICT DETECTED' };
  });
  save(documents);
}

export function allChunks(documentIds) {
  const allow = documentIds?.length ? new Set(documentIds) : null;
  return documents
    .filter((doc) => !allow || allow.has(doc.id))
    .flatMap((doc) => doc.chunks || chunksFromClauses(doc));
}

export function shortHash(bufferOrText) {
  const hash = crypto.createHash('sha256').update(bufferOrText).digest('hex').toUpperCase();
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function uploadDir() {
  ensureDirs();
  return UPLOAD_DIR;
}

export function clauseFromChunk(chunk) {
  return {
    section: chunk.section,
    page: chunk.page,
    bbox: chunk.bbox,
    verbatim: chunk.excerpt || chunk.text,
    tableData: chunk.tableData || [],
    schematicType: chunk.schematicType || 'SEAL_PLAN_53B'
  };
}
