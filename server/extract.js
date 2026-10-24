import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

const UNIT_RE = /(\d+(?:\.\d+)?)\s*(°C|°F|bar|psi|N·m|Nm|mm|Ω|ohm|ms|%)/gi;

export function schematicFor(text) {
  const value = text.toLowerCase();
  if (/torque|flange|stud|bolt/.test(value)) return 'FLANGE_TORQUE';
  if (/plc|relay|ladder|f-dq|siemens|safety/.test(value)) return 'PLC_LADDER_K4';
  return 'SEAL_PLAN_53B';
}

function headingFrom(text, page) {
  const line = text
    .split(/\n/)
    .map((item) => item.trim())
    .find((item) => item.length > 8 && item.length < 110 && (/^(\d+(\.\d+)*|§|table|section)/i.test(item) || item === item.toUpperCase()));
  return line || `Extracted text · page ${page}`;
}

function tableRows(text) {
  const rows = [];
  const seen = new Set();
  for (const match of text.matchAll(/([A-Za-z][A-Za-z0-9 .\/\-]{2,42}?)(?:\s*[:=]\s*|\s+)(\d+(?:\.\d+)?)\s*(°C|°F|bar|psi|N·m|Nm|mm|Ω|ms|%)/g)) {
    const param = match[1].replace(/\s+/g, ' ').trim();
    const spec = `${match[2]} ${match[3]}`;
    const key = `${param}|${spec}`.toLowerCase();
    if (seen.has(key) || param.length < 4) continue;
    seen.add(key);
    rows.push({ param, spec, tolerance: 'Extracted' });
    if (rows.length >= 6) break;
  }
  if (!rows.length) {
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 80);
    if (preview) rows.push({ param: 'Page excerpt', spec: preview, tolerance: 'Verbatim' });
  }
  return rows;
}

export function chunksFromPages(doc, pages) {
  const chunks = [];
  pages.forEach((page) => {
    const clean = page.text.replace(/\u0000/g, '').replace(/[ \t]+\n/g, '\n').trim();
    if (!clean) return;
    const parts = splitText(clean, 1400, 180);
    parts.forEach((part, index) => {
      const section = headingFrom(part, page.page);
      const suffix = parts.length > 1 ? ` · C${index + 1}` : '';
      const clauseKey = `P.${page.page} · ${sectionTag(section)}${suffix}`;
      chunks.push({
        id: `${doc.id}:${clauseKey}`,
        docId: doc.id,
        filename: doc.filename,
        title: doc.title,
        page: page.page,
        section,
        clauseKey,
        text: part,
        excerpt: part.slice(0, 700),
        bbox: page.bbox || '[0.0, 0.0, 0.0, 0.0]',
        schematicType: schematicFor(part),
        tableData: tableRows(part)
      });
    });
  });
  return chunks;
}

function sectionTag(section) {
  const numbered = section.match(/§?\s*\d+(?:\.\d+)*/);
  if (numbered) return `§${numbered[0].replace(/§/g, '').trim()}`;
  const words = section.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).slice(0, 3).join('-');
  return (words || 'EXTRACT').toUpperCase().slice(0, 24);
}

function splitText(text, size, overlap) {
  if (text.length <= size) return [text];
  const parts = [];
  let cursor = 0;
  while (cursor < text.length) {
    let end = Math.min(text.length, cursor + size);
    if (end < text.length) {
      const breakAt = text.lastIndexOf('\n', end);
      if (breakAt > cursor + size * 0.5) end = breakAt;
    }
    parts.push(text.slice(cursor, end).trim());
    if (end >= text.length) break;
    cursor = Math.max(end - overlap, cursor + 1);
  }
  return parts.filter(Boolean);
}

export function clausesFromChunks(chunks, limit = 18) {
  const clauses = {};
  const picked = [];
  const seenPages = new Set();
  for (const chunk of chunks) {
    if (seenPages.has(chunk.page)) continue;
    seenPages.add(chunk.page);
    picked.push(chunk);
    if (picked.length >= limit) break;
  }
  for (const chunk of picked.length ? picked : chunks.slice(0, limit)) {
    clauses[chunk.clauseKey] = {
      section: chunk.section,
      page: chunk.page,
      bbox: chunk.bbox,
      verbatim: chunk.excerpt,
      tableData: chunk.tableData,
      schematicType: chunk.schematicType
    };
  }
  return clauses;
}

function bboxFromItems(items) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const item of items) {
    const x = item.transform?.[4];
    const y = item.transform?.[5];
    if (typeof x !== 'number' || typeof y !== 'number') continue;
    const width = item.width || 0;
    const height = item.height || 8;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }
  if (!Number.isFinite(minX)) return '[0.0, 0.0, 0.0, 0.0]';
  return `[${minX.toFixed(1)}, ${minY.toFixed(1)}, ${maxX.toFixed(1)}, ${maxY.toFixed(1)}]`;
}

function textFromItems(items) {
  let line = '';
  const lines = [];
  for (const item of items) {
    line += item.str || '';
    if (item.hasEOL) {
      lines.push(line.trim());
      line = '';
    } else {
      line += ' ';
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join('\n');
}

export async function extractPdf(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: true
  });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push({
      page: pageNumber,
      text: textFromItems(content.items),
      bbox: bboxFromItems(content.items)
    });
  }
  return pages;
}

function extractDxf(text) {
  const lines = text.split(/\r?\n/);
  const collected = [];
  let entity = '';
  for (let i = 0; i < lines.length - 1; i += 1) {
    const code = lines[i].trim();
    const value = lines[i + 1] ?? '';
    if (code === '0') entity = value.trim();
    if ((code === '1' || code === '3') && /TEXT|MTEXT|ATTRIB|DIMENSION/i.test(entity)) {
      collected.push(value.trim());
    }
  }
  const body = collected.filter(Boolean).join('\n');
  return body || text.slice(0, 20000);
}

export async function extractUpload(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const buffer = fs.readFileSync(filePath);
  if (ext === '.pdf') return extractPdf(buffer);
  if (ext === '.txt' || ext === '.xml' || ext === '.csv') {
    return [{ page: 1, text: buffer.toString('utf8'), bbox: '[0.0, 0.0, 0.0, 0.0]' }];
  }
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return [{ page: 1, text: result.value || '', bbox: '[0.0, 0.0, 0.0, 0.0]' }];
  }
  if (ext === '.dxf') {
    return [{ page: 1, text: extractDxf(buffer.toString('utf8')), bbox: '[0.0, 0.0, 0.0, 0.0]' }];
  }
  if (ext === '.doc' || ext === '.dwg') {
    const error = new Error(
      ext === '.dwg'
        ? 'DWG is a binary CAD file. Export a PDF or DXF to extract searchable text.'
        : 'Legacy .doc is not extractable. Save the file as PDF or DOCX.'
    );
    error.status = 415;
    throw error;
  }
  const error = new Error(`Unsupported file type: ${ext || 'unknown'}`);
  error.status = 415;
  throw error;
}

export function measurementMentions(text) {
  return [...text.matchAll(UNIT_RE)].map((match) => match[0]);
}
