import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { answerQuestion, compareDocuments } from './answer.js';
import { geminiHealth } from './gemini.js';
import {
  addDocument,
  documentDigest,
  findByDigest,
  getDocument,
  listDocuments,
  nextDocumentId,
  removeDocument,
  shortHash,
  toClientDocument,
  uploadDir
} from './corpus.js';
import { chunksFromPages, clausesFromChunks, extractUpload } from './extract.js';

const app = express();
const port = Number(process.env.PORT || 8791);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir()),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^A-Za-z0-9._-]+/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.get('/api/health', async (_req, res) => {
  const gemini = await geminiHealth();
  res.json({
    ok: true,
    documents: listDocuments().length,
    geminiConfigured: gemini.configured,
    geminiReady: gemini.ready,
    geminiModel: gemini.model || null,
    geminiError: gemini.ready ? null : (gemini.message || null)
  });
});

app.get('/api/documents', (_req, res) => {
  const conflicts = compareDocuments();
  res.json({
    documents: listDocuments().map(toClientDocument),
    conflicts
  });
});

app.post('/api/documents', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file was uploaded.' });
    return;
  }
  try {
    const pages = await extractUpload(req.file.path, req.file.originalname);
    const text = pages.map((page) => page.text).join('\n').trim();
    if (!text) {
      res.status(422).json({ error: 'No extractable text was found in that file.' });
      return;
    }
    const buffer = fs.readFileSync(req.file.path);
    const digest = documentDigest(buffer);
    const existing = findByDigest(digest);
    if (existing) {
      fs.unlinkSync(req.file.path);
      res.json({
        document: toClientDocument(existing),
        duplicate: true,
        conflicts: compareDocuments()
      });
      return;
    }
    const id = nextDocumentId();
    const filename = req.file.originalname.toUpperCase().replace(/\s+/g, '-');
    const draft = {
      id,
      code: filename.replace(/\.[A-Z0-9]+$/, '').slice(0, 22),
      filename,
      title: `Ingested specification: ${req.file.originalname}`,
      pages: pages.length,
      rev: 'REV.01.0',
      hash: shortHash(buffer),
      digest,
      date: new Date().toISOString().slice(0, 10),
      type: 'INGESTED SPEC',
      included: true,
      status: 'INDEXED',
      filePath: req.file.path
    };
    const chunks = chunksFromPages(draft, pages);
    const document = addDocument({
      ...draft,
      clauses: clausesFromChunks(chunks),
      chunks
    });
    const conflicts = compareDocuments();
    res.json({
      document: toClientDocument(getDocument(document.id)),
      conflicts,
      notification: `INGESTED ${filename} (${pages.length} PAGES · HASH ${document.hash})`
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(error.status || 500).json({ error: error.message || 'Upload failed' });
  }
});

app.post('/api/query', async (req, res) => {
  const query = String(req.body?.query || '').trim();
  if (!query) {
    res.status(400).json({ error: 'Query is empty.' });
    return;
  }
  try {
    const documentIds = Array.isArray(req.body.documentIds) ? req.body.documentIds : [];
    const history = Array.isArray(req.body.history) ? req.body.history : [];
    const language = ['en', 'ru', 'kk'].includes(req.body?.language) ? req.body.language : 'en';
    const result = await answerQuestion({ query, documentIds, history, language });
    res.json(result);
  } catch (error) {
    const message = error.message || 'Query failed';
    res.status(error.status || 500).json({
      error: message,
      code: error.code || 'query_failed'
    });
  }
});

app.post('/api/compare', (req, res) => {
  const documentIds = Array.isArray(req.body?.documentIds) ? req.body.documentIds : [];
  res.json({ conflicts: compareDocuments(documentIds) });
});

app.delete('/api/documents/:id', (req, res) => {
  const removed = removeDocument(req.params.id);
  if (!removed) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }
  res.json({
    id: removed.id,
    documents: listDocuments().map(toClientDocument),
    conflicts: compareDocuments()
  });
});

app.get('/api/documents/:id/file', (req, res) => {
  const document = getDocument(req.params.id);
  if (!document?.filePath) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }
  const resolved = path.resolve(document.filePath);
  const root = path.resolve(uploadDir());
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(resolved)) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
  fs.createReadStream(resolved).pipe(res);
});

app.use('/vendor/pdfjs', express.static(path.resolve('node_modules/pdfjs-dist/build'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.mjs')) res.setHeader('Content-Type', 'text/javascript');
  }
}));

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: error.message || 'Server error' });
});

const webDir = path.resolve('web');
app.use(express.static(webDir));
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
  res.sendFile(path.join(webDir, 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
  console.log(`SynAI listening on http://127.0.0.1:${port}`);
});
