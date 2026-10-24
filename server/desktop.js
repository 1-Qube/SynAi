import { spawn, exec } from 'child_process';
import './gemini.js';

const port = Number(process.env.PORT || 8791);
const url = `http://127.0.0.1:${port}/`;
const healthUrl = `http://127.0.0.1:${port}/api/health`;

async function isRunning() {
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(700) });
    return response.ok;
  } catch {
    return false;
  }
}

if (!(await isRunning())) {
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
    env: process.env
  });
  child.unref();

  let started = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await isRunning()) {
      started = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!started) {
    console.error('SynAI server did not start. Try: npm start');
    process.exit(1);
  }
}

exec(`start "" "${url}"`);
