import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || line.trim().startsWith('#')) continue;
    if (!process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

loadEnvFile();

const MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash'
].filter(Boolean);

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

function apiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    const error = new Error('GEMINI_API_KEY is not set. Add it to the .env file.');
    error.status = 500;
    throw error;
  }
  return key;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model did not return JSON');
  return JSON.parse(raw.slice(start, end + 1));
}

export async function expandSearchQuery(query) {
  const prompt = `List technical search keywords for this question. Include the original words and English equivalents of any Russian or Kazakh terms. One line only, no sentences.\n${query}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey()
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 120 }
        }),
        signal: controller.signal
      }
    );
    const payload = await response.json();
    if (!response.ok) return '';
    return payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join(' ') || '';
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

export async function generateGroundedAnswer({ query, evidence, history, languageName = 'English' }) {
  const evidenceBlocks = evidence.map((item, index) => (
    `[${index}] document=${item.chunk.filename} docId=${item.chunk.docId} page=${item.chunk.page} section=${item.chunk.section} clauseKey=${item.chunk.clauseKey}\n${item.chunk.text.slice(0, 1400)}`
  )).join('\n\n');

  const conversation = (history || [])
    .slice(-6)
    .map((item) => `${item.role.toUpperCase()}: ${item.text}`)
    .join('\n');

  const prompt = `You are SynAI, a document-grounded technical assistant for Kazphosphate.
Answer only from the EVIDENCE blocks. Conversation history may clarify a follow-up, but it is not a source.
If the evidence does not contain the answer, set found to false and do not guess.
Do not invent numbers, page numbers, limits, tags, or document names.
Each finding must set evidenceIndex to the integer of the block it uses. Use evidenceIndex2 only when a second block is required.
If two blocks state different values for the same parameter, set conflict to true and cite both.
Numbers you write must appear in the cited evidence.
Write summary, labels, finding text, textCont, and recommendation in ${languageName}.
Do not translate document names, tags, units, or numbers.
If you quote a source sentence, keep that quote in its original language.

QUESTION:
${query}

CONVERSATION:
${conversation || '(none)'}

EVIDENCE:
${evidenceBlocks}

Return JSON with keys: found (boolean), conflict (boolean), summary (string), recommendation (string), findings (array of {label, text, evidenceIndex, textCont, evidenceIndex2}).
textCont may be an empty string. evidenceIndex2 may be omitted.`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json'
    }
  };

  let lastError = null;
  for (const model of [...new Set(MODELS)]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey()
          },
          body: JSON.stringify(body),
          signal: controller.signal
        }
      ).finally(() => clearTimeout(timer));
      const payload = await response.json();
      if (!response.ok) {
        lastError = new Error(payload.error?.message || `Gemini request failed (${response.status})`);
        if (response.status === 404 || response.status === 429 || response.status === 503) continue;
        throw lastError;
      }
      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
      if (!text) {
        const reason = payload.candidates?.[0]?.finishReason || payload.promptFeedback?.blockReason || 'empty response';
        throw new Error(`Gemini returned no text (${reason})`);
      }
      return { model, answer: extractJson(text) };
    } catch (error) {
      lastError = error;
      if (error.name === 'AbortError') break;
      if (error.message?.includes('not return JSON') || error instanceof SyntaxError) throw error;
    }
  }
  throw lastError || new Error('Gemini request failed');
}
