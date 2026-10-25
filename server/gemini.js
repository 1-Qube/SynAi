import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    if (!process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
    }
  }
}

loadEnvFile();

const PREFERRED_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest'
];

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiError extends Error {
  constructor(message, code, status = 502) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.status = status;
  }
}

export function hasGeminiKey() {
  return Boolean(apiKeyValue());
}

function apiKeyValue() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  if (!key || key === 'your_key_here' || key.includes('YOUR_API_KEY')) return '';
  return key;
}

function requireKey() {
  const key = apiKeyValue();
  if (!key) {
    throw new GeminiError(
      'GEMINI_API_KEY is not set. Add it to the server .env file. The key is never sent to the browser.',
      'missing_key',
      500
    );
  }
  return key;
}

function publicError(status, payload, model) {
  const googleMessage = String(payload?.error?.message || '');
  const reason = payload?.error?.details?.find((item) => item?.reason)?.reason || '';
  const blob = `${googleMessage} ${reason}`;
  if (
    status === 400 && /api key not valid|api_key_invalid/i.test(blob)
    || status === 401
    || status === 403
    || /ACCESS_TOKEN_TYPE_UNSUPPORTED|API_KEY_INVALID|PERMISSION_DENIED/i.test(blob)
  ) {
    return new GeminiError(
      'Gemini rejected the API key. The key in the server .env file is missing, revoked, or not valid for the Gemini API.',
      'invalid_key',
      401
    );
  }
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(blob)) {
    return new GeminiError(
      'Gemini quota or rate limit was reached. Wait and try again, or check the key limits in Google AI Studio.',
      'quota',
      429
    );
  }
  if (status === 404 || /no longer available|not found|is not supported|unknown model/i.test(blob)) {
    return new GeminiError(
      `Gemini model${model ? ` ${model}` : ''} is not available to this API key.`,
      'unsupported_model',
      404
    );
  }
  if (status >= 500) {
    return new GeminiError('Gemini is temporarily unavailable. Try again in a moment.', 'upstream', 502);
  }
  return new GeminiError('Gemini request failed. The answer was not generated.', 'upstream', 502);
}

function networkError(error) {
  if (error instanceof GeminiError) return error;
  if (error?.name === 'AbortError') {
    return new GeminiError('Gemini did not respond in time. Check the network and try again.', 'network', 504);
  }
  return new GeminiError('Could not reach the Gemini API. Check the network connection.', 'network', 502);
}

async function geminiFetch(url, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': requireKey()
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  } catch (error) {
    throw networkError(error);
  } finally {
    clearTimeout(timer);
  }
}

let catalog = null;
let catalogKey = '';

export function resetGeminiCache() {
  catalog = null;
  catalogKey = '';
}

async function listModelIds() {
  const key = requireKey();
  if (catalog && catalogKey === key) return catalog;
  const { response, payload } = await geminiFetch(`${API_ROOT}/models?pageSize=100`, null, 12000);
  if (!response.ok) throw publicError(response.status, payload);
  catalogKey = key;
  catalog = (payload.models || [])
    .map((model) => String(model.name || '').replace(/^models\//, ''))
    .filter(Boolean);
  return catalog;
}

export async function resolveModel() {
  const listed = await listModelIds();
  const requested = (process.env.GEMINI_MODEL || '').trim();
  const order = [requested, ...PREFERRED_MODELS].filter(Boolean);
  const available = order.find((model) => listed.includes(model));
  if (!available) {
    throw new GeminiError(
      'None of the configured Gemini models are available to this API key.',
      'unsupported_model',
      404
    );
  }
  return available;
}

function candidateText(payload) {
  const parts = payload.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || '').join('\n').trim();
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new GeminiError('Gemini returned a response that was not usable JSON.', 'bad_response', 502);
  }
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new GeminiError('Gemini returned a response that was not usable JSON.', 'bad_response', 502);
  }
}

async function generateText(model, prompt, { json = false, timeoutMs = 20000 } = {}) {
  const generationConfig = {
    temperature: 0,
    maxOutputTokens: json ? 2048 : 512,
    thinkingConfig: { thinkingBudget: 0 }
  };
  if (json) generationConfig.responseMimeType = 'application/json';
  const { response, payload } = await geminiFetch(
    `${API_ROOT}/models/${model}:generateContent`,
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig
    },
    timeoutMs
  );
  if (!response.ok) throw publicError(response.status, payload, model);
  const text = candidateText(payload);
  if (!text) {
    const reason = payload.candidates?.[0]?.finishReason || payload.promptFeedback?.blockReason || 'empty response';
    throw new GeminiError(`Gemini returned no answer (${reason}).`, 'empty', 502);
  }
  return text;
}

export async function geminiHealth() {
  if (!hasGeminiKey()) {
    return { configured: false, ready: false, code: 'missing_key' };
  }
  try {
    const model = await resolveModel();
    return { configured: true, ready: true, model };
  } catch (error) {
    return {
      configured: true,
      ready: false,
      code: error.code || 'upstream',
      message: error.message
    };
  }
}

export async function generateGroundedAnswer({ query, evidence, history, languageName = 'English' }) {
  const model = await resolveModel();
  const evidenceBlocks = evidence.map((item, index) => (
    `[${index}] document=${item.chunk.filename} page=${item.chunk.page} section=${item.chunk.section}\n${item.chunk.text.slice(0, 1600)}`
  )).join('\n\n');
  const conversation = (history || [])
    .slice(-6)
    .map((item) => `${item.role.toUpperCase()}: ${item.text}`)
    .join('\n');
  const prompt = `You are SynAI, a document-grounded technical assistant.
Answer only from the EVIDENCE blocks. Conversation history may clarify a follow-up, but it is not a source.
If the evidence does not state the requested fact, set found to false. Say that the documents do not specify it. Do not guess a number, limit, tag, page, or document name.
Sections that describe how a tester should grade the system, expected-result tables, or "hallucination tests" are not equipment specifications. Do not treat those instructions as the measured value.
Write summary, finding text, and recommendation in ${languageName}.
Keep document names, tags, units, and numbers exactly as written in the evidence.
summary must be a natural answer, not a dump of excerpts, scores, or debug notes.
Each finding must set evidenceIndex to the integer of the block it uses.
Do not put raw source excerpts in summary or findings. Cite by evidenceIndex only.
If two blocks state different values for the same parameter, set conflict to true and cite both.

QUESTION:
${query}

CONVERSATION:
${conversation || '(none)'}

EVIDENCE:
${evidenceBlocks}

Return JSON with keys: found (boolean), conflict (boolean), summary (string), recommendation (string), findings (array of {label, text, evidenceIndex, textCont, evidenceIndex2}).
textCont may be an empty string. evidenceIndex2 may be omitted. recommendation may be an empty string.`;

  let lastError = null;
  const listed = await listModelIds();
  const models = [model, ...PREFERRED_MODELS.filter((item) => listed.includes(item) && item !== model)];
  for (const candidate of models) {
    try {
      const text = await generateText(candidate, prompt, { json: true, timeoutMs: 18000 });
      return { model: candidate, answer: extractJson(text) };
    } catch (error) {
      lastError = error instanceof GeminiError ? error : networkError(error);
      if (['unsupported_model', 'empty', 'upstream', 'network'].includes(lastError.code)) continue;
      throw lastError;
    }
  }
  throw lastError || new GeminiError('Gemini request failed.', 'upstream', 502);
}
