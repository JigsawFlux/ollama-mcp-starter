const API_URL = 'http://localhost:3001';

const conversation = document.getElementById('conversation');
const emptyState   = document.getElementById('emptyState');
const promptInput  = document.getElementById('promptInput');
const sendBtn      = document.getElementById('sendBtn');
const statusDot    = document.getElementById('statusDot');
const statusText   = document.getElementById('statusText');

// ── Auto-resize textarea ────────────────────────────────────────────────────
promptInput.addEventListener('input', () => {
  promptInput.style.height = 'auto';
  promptInput.style.height = Math.min(promptInput.scrollHeight, 180) + 'px';
});

// ── Send on Enter (Shift+Enter = newline) ───────────────────────────────────
promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// ── Send button ─────────────────────────────────────────────────────────────
sendBtn.addEventListener('click', async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  emptyState.remove();

  appendMessage('user', prompt);
  promptInput.value = '';
  promptInput.style.height = 'auto';

  const loadingEl = appendLoading();
  const hintEl = appendHint('Waiting for model… first response may take up to a minute if the model is cold.');
  sendBtn.disabled = true;
  sendBtn.textContent = '…';

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    loadingEl.remove();
    hintEl.remove();

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      appendError(err.error || `HTTP ${res.status}`);
      return;
    }

    const data = await res.json();
    appendMessage('assistant', data.response, data.model, data.durationMs);
  } catch (err) {
    loadingEl.remove();
    hintEl.remove();
    appendError('Request failed — the model may have timed out. Try again; it should be faster once loaded.');
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send';
    promptInput.focus();
  }
});

// ── DOM helpers ──────────────────────────────────────────────────────────────
function appendMessage(role, text, model, durationMs) {
  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  wrap.appendChild(bubble);

  if (model) {
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${model} · ${durationMs}ms`;
    wrap.appendChild(meta);
  }

  conversation.appendChild(wrap);
  conversation.scrollTop = conversation.scrollHeight;
  return wrap;
}

function appendLoading() {
  const wrap = document.createElement('div');
  wrap.className = 'message assistant';

  const bubble = document.createElement('div');
  bubble.className = 'bubble loading';
  bubble.innerHTML = '<span></span><span></span><span></span>';

  wrap.appendChild(bubble);
  conversation.appendChild(wrap);
  conversation.scrollTop = conversation.scrollHeight;
  return wrap;
}

function appendHint(message) {
  const el = document.createElement('div');
  el.className = 'hint-msg';
  el.textContent = message;
  conversation.appendChild(el);
  conversation.scrollTop = conversation.scrollHeight;
  return el;
}

function appendError(message) {
  const el = document.createElement('div');
  el.className = 'error-msg';
  el.textContent = message;
  conversation.appendChild(el);
  conversation.scrollTop = conversation.scrollHeight;
}

// ── Health check ─────────────────────────────────────────────────────────────
async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    const ollama = data.ollama?.status;

    statusDot.className = 'status-dot ' + (ollama === 'healthy' ? 'healthy' : 'unhealthy');
    statusText.textContent = ollama === 'healthy'
      ? `${data.ollama.model} · ready`
      : 'Ollama not reachable';
  } catch {
    statusDot.className = 'status-dot unhealthy';
    statusText.textContent = 'Backend offline';
  }
}

checkHealth();
setInterval(checkHealth, 15000);
promptInput.focus();
