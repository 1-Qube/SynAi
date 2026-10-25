# SynAI backend

The existing workbench UI is unchanged. The corpus starts empty. Answers, citations, and conflict rows come only from files you upload — there is no seeded or synthetic document text.

## Run

Double-click `Start SynAI.bat`, or the desktop shortcut **SYNA Start**. It starts the local server in the background only when needed, then opens http://127.0.0.1:8791. There is no server window to keep open.

For frontend development:

```bash
npm install
npm run dev
```

## Configuration

Copy `.env.example` to `.env` and set `GEMINI_API_KEY`. The key stays on the server and is never sent to the browser. `GET /api/health` reports whether that key can reach a Gemini model. If Gemini rejects the key, quota, or model, the chat shows that error instead of raw excerpts.

Supported uploads: PDF, DOCX, TXT, XML, CSV, and text-bearing DXF. DWG and legacy DOC must be exported to PDF or DOCX first.
