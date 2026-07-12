// Foundry — solo-operator agency runtime.
// Whiskey Bar palette + Fraunces/Inter/Plex Mono stack. 3-panel forge layout,
// worker dock, The Wire (activity), The Bell (Cmd+K), Muster (broadcast).

// ---- Load animation libraries via CDN (idempotent) ----
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector('script[src="' + src + '"]')) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}
Promise.all([
  loadScript('https://cdn.jsdelivr.net/npm/@formkit/auto-animate@0.8.4/index.min.js'),
  loadScript('https://cdn.jsdelivr.net/npm/countup.js@2.8.0/dist/countUp.umd.js'),
]).catch(() => {});

// ---- Constants ----
const MODELS = [
  { v: '', label: 'Default' },
  { v: 'opus', label: 'Opus 4.8' },
  { v: 'sonnet', label: 'Sonnet 4.6' },
  { v: 'haiku', label: 'Haiku 4.5' },
];
const EFFORTS = [
  { v: '', label: 'Effort' },
  { v: 'low', label: 'Low' },
  { v: 'medium', label: 'Med' },
  { v: 'high', label: 'High' },
  { v: 'max', label: 'Max' },
];

// Role → initials + accent color (Linear-style agent identity)
function roleInitials(role) {
  const name = (role || '').trim();
  if (!name) return '?';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
// Deterministic worker hue — curated, medium-dark so it reads on the cream canvas.
const ROLE_HUES = ['#1F5C4A', '#B0553A', '#2A6F7D', '#3F5A8C', '#8A6A2E', '#5E7A3C', '#8A4E6A', '#9E4530'];
function roleColor(meta) {
  const key = (meta && (meta.role || meta.name)) || '';
  let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return ROLE_HUES[h % ROLE_HUES.length];
}
// Paint an avatar element with its role's colour (director keeps the hero forest).
function paintAvatar(elm, meta) {
  const col = isDirector(meta) ? '#1F5C4A' : roleColor(meta);
  elm.style.color = col;
  elm.style.background = 'color-mix(in srgb, ' + col + ' 18%, transparent)';
  elm.style.borderColor = 'color-mix(in srgb, ' + col + ' 42%, transparent)';
}

// ---- State ----
let S = { projects: [], templates: [], agents: [], activeProjectId: null };
const cards = new Map();
let editingAgentId = null;
let editingTemplate = null;
let focusedAgentId = null;
let currentView = 'chat';       // chat | log | diagram | reel
let currentLayout = 'focus';    // focus | grid
const missionLogEntries = [];
const activityFeed = [];
let activityFilter = 'all';
let costHistory = [];           // per-turn cost samples for sparkline

const $ = (id) => document.getElementById(id);
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function fmt(n) { return (n || 0).toLocaleString('en-US'); }
function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
// Persist unsent chat drafts per agent — surviving re-render, window switches, and reloads.
function getDraft(id) { try { return localStorage.getItem('foundry-draft-' + id) || ''; } catch { return ''; } }
function saveDraft(id, v) { try { if (v) localStorage.setItem('foundry-draft-' + id, v); else localStorage.removeItem('foundry-draft-' + id); } catch {} }
function wireDraft(ta, id) { ta.value = getDraft(id); ta.addEventListener('input', () => saveDraft(id, ta.value)); }

// ---- Icon set: clean inline SVG (currentColor, stroke) — replaces generic emoji ----
const ICON_PATHS = {
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  attach: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9l-.81-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  loop: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  chart: '<path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="7"/><rect x="12" y="6" width="3" height="11"/><rect x="17" y="13" width="3" height="4"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  spark: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z"/>',
};
function icon(name, size) {
  const s = size || 16;
  return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" '
    + 'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0">'
    + (ICON_PATHS[name] || '') + '</svg>';
}
function activeProject() { return S.projects.find((p) => p.id === S.activeProjectId); }
function projectAgents() { return S.agents.filter((a) => a.projectId === S.activeProjectId); }
function findAgent(id) { return S.agents.find((a) => a.id === id); }
function isDirector(meta) { return !meta.reportsTo && /director|lead|manager|chief|founder|owner|editor|ceo|cmo|pm/i.test(meta.role || meta.name); }

async function api(path, method, body) {
  const opt = { method: method || 'GET' };
  if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body); }
  const res = await fetch(path, opt);
  return res.json();
}

async function refresh() {
  S = await api('/api/state');
  // Preserve focused agent if it still exists
  if (focusedAgentId && !findAgent(focusedAgentId)) focusedAgentId = null;
  const list = projectAgents();
  if (!focusedAgentId && list.length) focusedAgentId = list[0].id;
  render();
}

// ---- Render ----
function render() {
  renderProjectSelect();
  renderProjectBar();
  renderRail();
  renderCenter();
  updateStats();
  renderActivity();
}

function renderProjectSelect() {
  const sel = $('projSelect');
  sel.innerHTML = '';
  if (!S.projects.length) {
    const o = el('option', null, 'No projects');
    o.value = ''; sel.appendChild(o);
    return;
  }
  S.projects.forEach((p) => {
    const o = el('option', null, p.name);
    o.value = p.id;
    if (p.id === S.activeProjectId) o.selected = true;
    sel.appendChild(o);
  });
}

function renderProjectBar() {
  const proj = activeProject();
  $('pName').textContent = proj ? proj.name : 'No project';
  $('pCwd').textContent = proj ? proj.cwd : '';
  const pf = $('pFiles'); pf.innerHTML = '';
  if (proj) (proj.contextFiles || []).forEach((f) => {
    const chip = el('div', 'chip');
    chip.append(Object.assign(el('span'), { innerHTML: icon('file', 13) + ' ' + esc(f.name) }));
    const rm = el('span', 'rm', '✕');
    rm.onclick = () => removeSharedFile(f.path);
    chip.append(rm); pf.appendChild(chip);
  });
}

// ---- Left rail (Discord-style agent dock) ----
function renderRail() {
  const rail = $('rail'); rail.innerHTML = '';
  const list = projectAgents();
  if (!list.length) {
    const add = el('button', 'rail-add', '+');
    add.title = 'Add first worker';
    add.onclick = () => openWorker(null);
    const slot = el('div', 'rail-slot');
    slot.append(add);
    rail.append(slot);
    return;
  }

  list.forEach((meta) => {
    const slot = el('div', 'rail-slot');
    const icon = el('button', 'agent-icon');
    if (isDirector(meta)) icon.classList.add('director');
    if (meta.id === focusedAgentId) icon.classList.add('active');
    if (meta.hasSession) icon.classList.add('active-session');
    if (meta.busy) icon.classList.add('working');
    icon.textContent = roleInitials(meta.role || meta.name);
    paintAvatar(icon, meta);
    icon.title = (meta.role || meta.name) + ' — #' + meta.num;
    icon.onclick = () => focusAgent(meta.id);
    slot.append(icon);
    // tooltip element
    const tip = el('div', 'rail-tooltip', (meta.role || meta.name) + ' · #' + meta.num);
    slot.append(tip);
    rail.append(slot);
  });

  const divider = el('div', 'rail-divider');
  rail.append(divider);

  const add = el('button', 'rail-add', '+');
  add.title = 'Add worker';
  add.onclick = () => openWorker(null);
  const addSlot = el('div', 'rail-slot');
  addSlot.append(add);
  rail.append(addSlot);
}

// ---- Center — router between focus / grid / log / diagram ----
function renderCenter() {
  const ws = $('workspace');
  const grid = $('gridView');
  const log = $('missionLog');
  const diag = $('diagram');
  const reel = $('reelView');

  ws.classList.add('hidden');
  grid.classList.add('hidden');
  log.classList.add('hidden');
  diag.classList.add('hidden');
  reel.classList.add('hidden');

  if (currentView === 'log') { renderMissionLog(); log.classList.remove('hidden'); return; }
  if (currentView === 'diagram') { renderDiagram(); diag.classList.remove('hidden'); return; }
  if (currentView === 'reel') { window.ReelUI && window.ReelUI.render(reel); reel.classList.remove('hidden'); return; }

  // chat view
  if (currentLayout === 'grid') {
    grid.classList.remove('hidden');
    renderGrid();
  } else {
    ws.classList.remove('hidden');
    renderFocus();
  }
}

// ---- Focus mode (single active agent, full workspace) ----
function renderFocus() {
  const ws = $('workspace');
  ws.innerHTML = '';
  cards.clear();

  if (!activeProject()) {
    const b = el('div', 'empty');
    b.innerHTML = '<h2>The Foundry is quiet</h2><p>Start a project to open the forge. Pick a Blueprint to spawn a full team, or start empty.</p>';
    ws.append(b); return;
  }

  const list = projectAgents();
  if (!list.length) {
    const b = el('div', 'empty');
    b.innerHTML = '<h2>No workers yet</h2><p>Click <b>+ Worker</b> or open <b>Blueprints</b> to assemble a team.</p>';
    ws.append(b); return;
  }

  const meta = findAgent(focusedAgentId) || list[0];
  focusedAgentId = meta.id;

  // Header
  const head = el('div', 'focus-head');
  const avatar = el('div', 'focus-avatar');
  avatar.textContent = roleInitials(meta.role || meta.name);
  paintAvatar(avatar, meta);
  head.append(avatar);

  const info = el('div', 'focus-info');
  const title = el('div', 'focus-title');
  title.append(el('span', 'role', meta.role || meta.name));
  const numTag = el('span', 'num-tag', '#' + meta.num);
  title.append(numTag);
  info.append(title);

  const sub = el('div', 'focus-sub');
  const working = meta.busy || (meta.loop && meta.loop.active);
  const dot = el('span', 'dot-inline' + (working ? ' working' : (meta.hasSession ? ' active' : '')));
  sub.append(dot);
  const statusEl = el('span', 'focus-status', (meta.loop && meta.loop.active) ? 'Looping…' : (meta.busy ? 'Working…' : (meta.hasSession ? 'Ready' : 'Idle')));
  sub.append(statusEl);
  if (meta.reportsTo) sub.append(el('span', null, ' · Reports to ' + meta.reportsTo));
  info.append(sub);
  head.append(info);

  // Meta tags (engine / model)
  const meta_ = el('div', 'focus-meta');
  if (meta.engine === 'openclaw') {
    meta_.append(makeMetaTag('OC ' + (meta.ocProvider ? meta.ocProvider + '/' : '') + (meta.ocModel || '?'), 'oc'));
  } else if (meta.engine === 'api') {
    meta_.append(makeMetaTag('API ' + (meta.apiModel || '?'), 'api'));
  } else if (meta.engine === 'codex') {
    meta_.append(makeMetaTag('CODEX ' + (meta.codexModel || 'default'), 'oc'));
  } else if (meta.engine === 'hermes') {
    meta_.append(makeMetaTag('HERMES ' + (meta.hermesProvider ? meta.hermesProvider + '/' : '') + (meta.hermesModel || '?'), 'oc'));
  } else {
    // model + effort selectors inline
    const modelSel = el('select', null); modelSel.style.cssText = 'background:var(--input);color:var(--text);border:1px solid var(--line);border-radius:4px;padding:3px 6px;font-size:11px;';
    MODELS.forEach((m) => { const o = el('option', null, m.label); o.value = m.v; if (m.v === (meta.model || '')) o.selected = true; modelSel.appendChild(o); });
    modelSel.onchange = async () => { await api('/api/agents/' + meta.id + '/model', 'POST', { model: modelSel.value }); refresh(); };
    meta_.append(modelSel);

    const effortSel = el('select', null); effortSel.style.cssText = modelSel.style.cssText;
    EFFORTS.forEach((e) => { const o = el('option', null, e.label); o.value = e.v; if (e.v === (meta.effort || '')) o.selected = true; effortSel.appendChild(o); });
    effortSel.onchange = async () => { await api('/api/agents/' + meta.id + '/edit', 'POST', { effort: effortSel.value }); refresh(); };
    meta_.append(effortSel);

    if (meta.ccModel || meta.ccBaseUrl) meta_.append(makeMetaTag('⇄ ' + (meta.ccModel || 'proxy'), null));
  }
  meta_.append(makeAccountChip(meta));
  head.append(meta_);

  const actions = el('div', 'focus-actions');
  const saveB = mkIcon(icon('save'), 'Save session', () => saveSession(meta.id));
  const editB = mkIcon(icon('edit'), 'Edit', () => openWorker(meta.id));
  const delB = mkIcon(icon('close'), 'Remove', () => removeWorker(meta.id));
  delB.classList.add('x');
  actions.append(saveB, editB, delB);
  head.append(actions);

  ws.append(head);

  // Token summary strip
  const t = meta.totals || {};
  const toks = el('div', 'focus-tokens');
  toks.innerHTML = `
    <span>in <b>${fmt(t.input)}</b></span>
    <span class="tok-sep">·</span>
    <span>out <b>${fmt(t.output)}</b></span>
    <span class="tok-sep">·</span>
    <span>cache <b>${fmt(t.cache)}</b></span>
    <span class="tok-sep">·</span>
    <span>turns <b>${t.turns || 0}</b></span>
    <span class="tok-sep">·</span>
    <span style="color:var(--accent);font-weight:700">$${(t.cost || 0).toFixed(4)}</span>
  `;
  ws.append(toks);

  // "Load earlier" bar (only the recent window loads by default, for speed)
  const earlierBtn = el('button', 'load-earlier', '↑ Load earlier messages');
  earlierBtn.style.display = 'none';
  ws.append(earlierBtn);

  // Transcript (scroll area)
  const transcript = el('div', 'transcript');
  transcript.id = 'transcript-' + meta.id;
  ws.append(transcript);

  // Drag-drop
  ws.addEventListener('dragover', (e) => { e.preventDefault(); ws.classList.add('dragover'); });
  ws.addEventListener('dragleave', () => ws.classList.remove('dragover'));
  ws.addEventListener('drop', (e) => {
    e.preventDefault(); ws.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleAgentFiles(meta.id, e.dataTransfer.files);
  });

  // Attachments strip
  const attach = el('div', 'attachments-strip');
  attach.id = 'attach-' + meta.id;
  ws.append(attach);

  // Composer
  const composer = el('div', 'composer');
  const fileInput = el('input'); fileInput.type = 'file'; fileInput.multiple = true; fileInput.style.display = 'none';
  const attachBtn = el('button', 'attach'); attachBtn.innerHTML = icon('attach'); attachBtn.title = 'Attach file'; attachBtn.onclick = () => fileInput.click();
  const ta = el('textarea'); ta.rows = 2; ta.placeholder = 'Message ' + (meta.role || meta.name) + '…    (Enter to send · Shift+Enter for newline · / for commands)';
  wireDraft(ta, meta.id);
  const sendBtn = el('button', 'send-btn');
  sendBtn.innerHTML = 'Send <span class="send-kbd">⏎</span>';
  sendBtn.onclick = () => doSend(meta.id);
  const stopBtn = el('button', 'stop-btn', '■ Stop'); stopBtn.style.display = 'none';
  stopBtn.onclick = () => stopRun(meta.id);
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(meta.id); }
    if (e.key === '/' && ta.value === '') { e.preventDefault(); openCmdk('/'); }
  });
  fileInput.onchange = () => handleAgentFiles(meta.id, fileInput.files);
  composer.append(attachBtn, ta, sendBtn, stopBtn, fileInput);
  ws.append(composer);

  const c = { meta, card: ws, transcript, ta, dot, statusEl, earlierBtn, send: sendBtn, stop: stopBtn, fileInput, attachments: attach, pending: [] };
  cards.set(meta.id, c);
  earlierBtn.onclick = () => loadEarlier(c);

  // Load the persisted chat history from the server (survives leaving the window /
  // refresh) and keep polling so a running turn streams into the chat — even one
  // you started, left, and came back to. setBusyUI shows Stop whenever it's working.
  loadTranscript(c);
  ensurePoll();

  // Jump-to-latest chip — appears when scrolled up during streaming.
  ws.style.position = 'relative';
  const jump = el('div', 'jump-latest'); jump.textContent = '↓ Latest';
  jump.onclick = () => { transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' }); jump.classList.remove('show'); };
  ws.append(jump);
  c.jumpBtn = jump;
  transcript.addEventListener('scroll', () => {
    const dist = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight;
    if (dist < 60) jump.classList.remove('show');
  });

  // Autofocus composer
  setTimeout(() => ta.focus(), 40);
  transcript.scrollTop = transcript.scrollHeight;

  // AutoAnimate on transcript
  if (window.autoAnimate) window.autoAnimate(transcript, { duration: 220 });
}

function makeMetaTag(label, cls) {
  const t = el('span', 'meta-tag' + (cls ? ' ' + cls : ''), label);
  return t;
}
function mkIcon(glyph, title, onclick) {
  const b = el('button', 'ic'); b.innerHTML = glyph; b.title = title; b.onclick = onclick; return b;
}

// Cache msg DOM per agent so switching focus preserves transcript
const cardCache = new Map(); // agentId -> Array<Node>
function cacheTranscript(agentId) {
  const c = cards.get(agentId);
  if (!c) return;
  finalizeTypewritersIn(c.transcript);   // never cache a half-typed (empty) bubble
  const nodes = [];
  c.transcript.childNodes.forEach((n) => nodes.push(n.cloneNode(true)));
  cardCache.set(agentId, nodes);
}

// Focus an agent (switch center pane to it)
function focusAgent(id) {
  if (focusedAgentId && focusedAgentId !== id) cacheTranscript(focusedAgentId);
  focusedAgentId = id;
  currentView = 'chat';
  currentLayout = 'focus';
  applyLayoutButtons();
  applyViewButtons();
  render();
}

// ---- Grid mode (all agents at once) ----
function renderGrid() {
  const grid = $('gridView');
  grid.innerHTML = '';
  cards.clear();
  const list = projectAgents();
  if (!list.length) {
    const b = el('div', 'empty');
    b.innerHTML = '<h2>No workers yet</h2><p>Click <b>+ Worker</b> to add one.</p>';
    grid.append(b); return;
  }
  list.forEach((meta) => grid.append(makeCard(meta)));
}

function makeCard(meta) {
  const isDir = isDirector(meta);
  const card = el('div', 'card' + (isDir ? ' director' : ''));
  if (meta.busy) card.classList.add('active-breath');

  const head = el('div', 'card-head');
  const avatar = el('div', 'card-avatar' + (isDir ? ' director' : ''));
  avatar.textContent = roleInitials(meta.role || meta.name);
  paintAvatar(avatar, meta);
  head.append(avatar);

  const title = el('div', 'card-title');
  const roleRow = el('div', 'card-role');
  roleRow.append(el('span', null, meta.role || meta.name));
  roleRow.append(el('span', 'num-tag', '#' + meta.num));
  title.append(roleRow);
  const subRow = el('div', 'card-sub');
  const dot = el('span', 'status-dot' + ((meta.busy || (meta.loop && meta.loop.active)) ? ' working' : (meta.hasSession ? ' active' : '')));
  subRow.append(dot);
  subRow.append(el('span', null, (meta.loop && meta.loop.active) ? 'Looping' : (meta.busy ? 'Working' : (meta.hasSession ? 'Ready' : 'Idle'))));
  if (meta.reportsTo) subRow.append(el('span', null, ' · ↳ ' + meta.reportsTo));
  if (meta.loop && meta.loop.active) {
    const lp = meta.loop;
    const cap = lp.maxIterations ? '/' + lp.maxIterations : '';
    subRow.append(Object.assign(el('span', 'loop-badge'), { innerHTML: icon('loop', 11) + ' loop ' + (lp.iterations || 0) + esc(cap) }));
  }
  title.append(subRow);
  head.append(title);

  const ctrl = el('div', 'card-controls');
  const modelSel = el('select');
  MODELS.forEach((m) => { const o = el('option', null, m.label); o.value = m.v; if (m.v === (meta.model || '')) o.selected = true; modelSel.appendChild(o); });
  modelSel.onchange = async () => { await api('/api/agents/' + meta.id + '/model', 'POST', { model: modelSel.value }); };
  if (meta.engine === 'api' || meta.engine === 'openclaw' || meta.engine === 'codex' || meta.engine === 'hermes') modelSel.style.display = 'none';
  ctrl.append(modelSel);

  if (meta.engine === 'openclaw') ctrl.append(makeMetaTag('OC ' + (meta.ocProvider ? meta.ocProvider + '/' : '') + (meta.ocModel || '?'), 'oc'));
  else if (meta.engine === 'api') ctrl.append(makeMetaTag('API ' + (meta.apiModel || '?'), 'api'));
  else if (meta.engine === 'codex') ctrl.append(makeMetaTag('CODEX ' + (meta.codexModel || 'default'), 'oc'));
  else if (meta.engine === 'hermes') ctrl.append(makeMetaTag('HERMES ' + (meta.hermesProvider ? meta.hermesProvider + '/' : '') + (meta.hermesModel || '?'), 'oc'));

  const loopBtn = mkIcon(icon('loop'), 'Loop — run autonomously until stopped', () => openLoopModal(meta.id));
  if (meta.loop && meta.loop.active) loopBtn.classList.add('loop-on');
  ctrl.append(loopBtn);
  ctrl.append(mkIcon(icon('save'), 'Save', () => saveSession(meta.id)));
  ctrl.append(mkIcon(icon('edit'), 'Edit', () => openWorker(meta.id)));
  const del = mkIcon(icon('close'), 'Remove', () => removeWorker(meta.id)); del.classList.add('x');
  ctrl.append(del);
  head.append(ctrl);

  // Tokens row + inline sparkline
  const toks = el('div', 'card-tokens');
  const t = meta.totals || {};
  const left = el('div');
  left.innerHTML = `in <b style="color:var(--text)">${fmt(t.input)}</b> · out <b style="color:var(--text)">${fmt(t.output)}</b> · <b class="cost-inline">$${(t.cost || 0).toFixed(3)}</b>`;
  toks.append(left);
  const spark = drawSparkline((t.history || []).map((h) => h.cost || 0), 60, 16);
  spark.classList.add('card-spark');
  toks.append(spark);

  // Transcript
  const transcript = el('div', 'transcript');

  // Drop zone
  const drop = el('div', 'drop-zone', 'Drop files here');

  // Attachments strip
  const attach = el('div', 'attachments');

  // Composer
  const composer = el('div', 'composer');
  const fileInput = el('input'); fileInput.type = 'file'; fileInput.multiple = true; fileInput.style.display = 'none';
  const attachBtn = el('button', 'attach'); attachBtn.innerHTML = icon('attach'); attachBtn.onclick = () => fileInput.click();
  const ta = el('textarea'); ta.rows = 2; ta.placeholder = 'Message ' + (meta.role || meta.name) + '…';
  wireDraft(ta, meta.id);
  const sendBtn = el('button', 'send-btn'); sendBtn.innerHTML = 'Send'; sendBtn.onclick = () => doSend(meta.id);
  const stopBtn = el('button', 'stop-btn', '■ Stop'); stopBtn.style.display = 'none';
  stopBtn.onclick = () => stopRun(meta.id);
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(meta.id); } });
  fileInput.onchange = () => handleAgentFiles(meta.id, fileInput.files);
  composer.append(attachBtn, ta, sendBtn, stopBtn, fileInput);

  card.append(head, toks, transcript, drop, attach, composer);

  card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('dragover'); });
  card.addEventListener('dragleave', (e) => { if (!card.contains(e.relatedTarget)) card.classList.remove('dragover'); });
  card.addEventListener('drop', (e) => { e.preventDefault(); card.classList.remove('dragover'); if (e.dataTransfer.files.length) handleAgentFiles(meta.id, e.dataTransfer.files); });

  const c = { meta, card, transcript, ta, dot, send: sendBtn, stop: stopBtn, fileInput, attachments: attach, pending: [] };
  cards.set(meta.id, c);

  // Load persisted history from the server; setBusyUI (inside) shows Stop if working.
  loadTranscript(c);

  if (window.autoAnimate) window.autoAnimate(transcript, { duration: 220 });

  return card;
}

// ---- Message / dispatch ----
function addMsg(c, cls, text) {
  const m = el('div', 'msg ' + cls);
  c.transcript.appendChild(m);
  if (cls === 'assistant') {
    m.classList.add('md');
    m.innerHTML = renderMarkdown(text || '');   // instant + reliable; CSS msgFade gives a smooth reveal
    wireCopyButtons(m);
  } else {
    m.textContent = text || '';
  }
  maybeScroll(c);
  return m;
}

// Reveal the message progressively (typewriter feel) while rendering markdown of the
// growing text each frame. CRITICAL: the full text is always recoverable via
// node._twFinish() so a cache/refresh mid-animation can never leave an empty bubble.
function typewriterMarkdown(node, text, c) {
  node._twText = text;
  const finish = () => {
    if (node._twDone) return;
    node._twDone = true;
    clearTimeout(node._twTimer); node._twTimer = null;
    node.innerHTML = renderMarkdown(text);   // full, final content — always present
    wireCopyButtons(node);
    if (c && c._twPending > 0) {
      c._twPending--;
      if (c._twPending === 0 && c._onIdle) { const f = c._onIdle; c._onIdle = null; f(); }
    }
  };
  node._twFinish = finish;
  const total = text.length;
  if (!total) { node.innerHTML = ''; node._twDone = true; return; }
  if (c) c._twPending = (c._twPending || 0) + 1;
  const steps = Math.min(total, 200);
  const chunk = Math.max(1, Math.ceil(total / steps));
  const stepMs = total > 500 ? 8 : 14;
  let i = 0;
  const tick = () => {
    if (node._twDone) return;
    i = Math.min(total, i + chunk);
    node.innerHTML = renderMarkdown(text.slice(0, i)) + (i < total ? '<span class="caret"></span>' : '');
    maybeScroll(c);
    if (i < total) node._twTimer = setTimeout(tick, stepMs);
    else finish();
  };
  tick();
}

// Force any still-animating typewriters in a container to their full final content.
function finalizeTypewritersIn(container) {
  if (!container) return;
  container.querySelectorAll('.msg.assistant.md').forEach((n) => { if (n._twFinish && !n._twDone) n._twFinish(); });
}

// Only auto-scroll if the user is already near the bottom; otherwise surface the
// "jump to latest" chip so we never yank them away from what they're reading.
function maybeScroll(c) {
  const t = c.transcript; if (!t) return;
  const dist = t.scrollHeight - t.scrollTop - t.clientHeight;
  if (dist < 120) t.scrollTop = t.scrollHeight;
  else if (c.jumpBtn) c.jumpBtn.classList.add('show');
}

function wireCopyButtons(root) {
  root.querySelectorAll('.code-copy').forEach((btn) => {
    btn.onclick = () => {
      const code = btn.parentElement.querySelector('code');
      const txt = code ? code.textContent : '';
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => {
        btn.textContent = 'Copied'; btn.classList.add('done');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1400);
      }).catch(() => { btn.textContent = 'Copy failed'; setTimeout(() => { btn.textContent = 'Copy'; }, 1400); });
    };
  });
}

// ---- Lightweight, XSS-safe Markdown → HTML (everything is escaped first) ----
const _mdCache = new Map();   // memoize markdown parsing (speed on re-render)
function renderMarkdown(src) {
  const text = String(src == null ? '' : src);
  if (_mdCache.has(text)) return _mdCache.get(text);
  const out = renderMarkdownRaw(text);
  if (_mdCache.size > 500) _mdCache.clear();
  _mdCache.set(text, out);
  return out;
}
function renderMarkdownRaw(src) {
  const text = String(src == null ? '' : src);
  const parts = text.split('```');   // odd indices are fenced code blocks
  let html = '';
  parts.forEach((part, idx) => {
    if (idx % 2 === 1) {
      const nl = part.indexOf('\n');
      let lang = '', code = part;
      if (nl >= 0) {
        const first = part.slice(0, nl).trim();
        if (/^[\w+.-]{1,20}$/.test(first)) { lang = first; code = part.slice(nl + 1); }
      }
      code = code.replace(/\n$/, '');
      html += '<div class="code-wrap">'
        + (lang ? '<span class="code-lang">' + esc(lang) + '</span>' : '')
        + '<button class="code-copy" type="button">Copy</button>'
        + '<pre><code>' + esc(code) + '</code></pre></div>';
    } else {
      html += mdBlocks(part);
    }
  });
  return html;
}
function mdBlocks(block) {
  let out = '', para = [], listBuf = [], listOrdered = false;
  const flushList = () => { if (listBuf.length) { const tag = listOrdered ? 'ol' : 'ul'; out += '<' + tag + '>' + listBuf.map((li) => '<li>' + mdSpan(li) + '</li>').join('') + '</' + tag + '>'; listBuf = []; } };
  const flushPara = () => { if (para.length) { out += '<p>' + para.map(mdSpan).join('<br>') + '</p>'; para = []; } };
  block.split('\n').forEach((line) => {
    let mm;
    if ((mm = line.match(/^\s*(#{1,3})\s+(.+)$/))) { flushList(); flushPara(); const lv = mm[1].length; out += '<h' + lv + '>' + mdSpan(mm[2]) + '</h' + lv + '>'; }
    else if ((mm = line.match(/^\s*[-*]\s+(.+)$/))) { flushPara(); if (listOrdered) flushList(); listOrdered = false; listBuf.push(mm[1]); }
    else if ((mm = line.match(/^\s*\d+\.\s+(.+)$/))) { flushPara(); if (!listOrdered) flushList(); listOrdered = true; listBuf.push(mm[1]); }
    else if (line.trim() === '') { flushList(); flushPara(); }
    else { flushList(); para.push(line); }
  });
  flushList(); flushPara();
  return out;
}
function mdSpan(s) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, (m, c) => '<code>' + c + '</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return t;
}

function parseAssignments(text) {
  const out = [];
  text.split('\n').forEach((line) => {
    const m = line.match(/^\s*@([^:]+):\s*(.+)$/);
    if (m) {
      const name = m[1].trim(), task = m[2].trim();
      if (norm(name) !== 'none') out.push({ name, task });
    }
  });
  return out;
}
function findAgentByName(name) {
  const list = projectAgents();
  return list.find((a) => norm(a.role) === norm(name) || norm(a.name) === norm(name))
      || list.find((a) => norm(a.role).includes(norm(name)) || norm(name).includes(norm(a.role)));
}
function renderDispatch(c, assignments) {
  const box = el('div', 'dispatch');
  box.append(el('div', 'dh', 'The Anvil — forge each task to a worker'));
  assignments.forEach((a) => {
    const target = findAgentByName(a.name);
    const row = el('div', 'row');
    row.append(el('span', 'to', '@' + a.name));
    row.append(el('span', 'task', a.task));
    const btn = el('button', 'sm', target ? 'Forge ▶' : 'No match');
    btn.disabled = !target;
    btn.onclick = () => {
      doSend(target.id, a.task);
      btn.textContent = 'Sent ✓';
      btn.classList.add('done');
      btn.disabled = true;
    };
    row.append(btn);
    box.append(row);
  });
  c.transcript.appendChild(box);
  c.transcript.scrollTop = c.transcript.scrollHeight;
}

async function doSend(id, overrideText) {
  const c = cards.get(id);
  if (!c) return;
  let text = (overrideText != null ? overrideText : c.ta.value).trim();
  if (!text && !c.pending.length) return;
  if (c.pending.length) {
    text = `[Files attached for you on disk — read with your tools:\n${c.pending.map((p) => '- ' + p).join('\n')}]\n\n` + text;
    c.pending = []; c.attachments.innerHTML = '';
  }
  if (overrideText == null) { c.ta.value = ''; saveDraft(id, ''); }
  setBusyUI(c, true);
  logEvent(id, 'user', text.slice(0, 200));
  try {
    // The turn runs server-side and records EVERY message to the persisted transcript.
    // We don't render from the stream — the poller renders from the server (the single
    // source of truth), so the chat survives leaving the window, refresh, and shows a
    // turn started from anywhere. This is what makes it behave like Claude's chat.
    const res = await fetch('/api/agents/' + id + '/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    await pollTranscript(c);     // surface the user message immediately
    ensurePoll();
    const reader = res.body.getReader();     // drain to detect turn completion
    while (true) { const { done } = await reader.read(); if (done) break; }
  } catch (e) {
    addMsg(c, 'err', 'Connection error: ' + e.message); logEvent(id, 'error', e.message);
  } finally {
    await pollTranscript(c);     // final render of the completed turn
    // Update header stats WITHOUT a full render() — rebuilding the chat here would
    // interrupt the typewriter mid-animation. The poller keeps the transcript current.
    try { S = await api('/api/state'); updateStats(); } catch {}
    maybeContinueLoop(id);
  }
}

// ---- Server-persisted transcript: render + live poll (source of truth) ----
// In-memory transcript cache → instant agent switching (paint from cache, then catch up).
const tCache = new Map(); // agentId -> { html, firstIndex, nextIndex }
function saveTCache(c) {
  if (!c || !c.transcript) return;
  tCache.set(c.meta.id, { html: c.transcript.innerHTML, firstIndex: c.firstIndex || 0, nextIndex: c.nextIndex || 0 });
}
function setBusyUI(c, working, activity) {
  if (!c) return;
  if (c.send) c.send.style.display = working ? 'none' : '';
  if (c.stop) { c.stop.style.display = working ? '' : 'none'; c.stop.disabled = false; c.stop.textContent = '■ Stop'; }
  if (c.dot) { const base = c.dot.className.split(' ')[0]; c.dot.className = base + (working ? ' working' : (c.meta && c.meta.hasSession ? ' active' : '')); }
  if (c.statusEl) {
    const looping = c.meta && c.meta.loop && c.meta.loop.active;
    c.statusEl.textContent = working ? (activity || (looping ? 'Looping…' : 'Working…')) : (c.meta && c.meta.hasSession ? 'Ready' : 'Idle');
  }
}
// Signature "bar tab" line for a completed turn: hairline + right-aligned receipt.
function addLedger(c, m) {
  const line = el('div', 'ledger-line');
  const t = m.duration ? (m.duration / 1000).toFixed(1) + 's' : '';
  line.innerHTML = (t ? '<span class="lg-t">' + t + '</span><span class="lg-sep">··</span>' : '')
    + '<span class="lg-cost">$' + (m.cost || 0).toFixed(4) + '</span>';
  c.transcript.appendChild(line);
  maybeScroll(c);
}
// Brand-voice error card with a one-click retry of your last message.
function addErrorCard(c, text) {
  const card = el('div', 'err-card');
  card.append(el('div', 'ec-title', 'The forge went cold.'));
  const sub = el('div'); sub.style.cssText = 'font-size:13px;color:var(--muted)';
  sub.textContent = 'That turn hit an error and stopped.';
  card.append(sub);
  const det = el('details');
  const sm = el('summary', null, 'Details'); sm.style.cssText = 'cursor:pointer;font-size:11px;color:var(--dim);margin-top:6px';
  det.append(sm);
  det.append(Object.assign(el('div', 'ec-detail'), { textContent: text || 'Unknown error' }));
  card.append(det);
  if (c._lastUserText) {
    const retry = el('button', 'ec-retry', 'Retry last message');
    retry.onclick = () => doSend(c.meta.id, c._lastUserText);
    card.append(retry);
  }
  c.transcript.appendChild(card);
  maybeScroll(c);
}
// Is this a low-value "waiting/still working" status message (fold these together)?
function isStatusMsg(t) {
  const s = (t || '').trim();
  if (!s || s.length > 140) return false;
  return /\b(wait|still|render|check|generat|queu|download|compress|pull|process|hold on|one moment|standby|on it\b|working on|let me (check|wait|pull|grab|see|look|run))/i.test(s);
}
// Fold consecutive status messages into ONE quiet, expandable "working" line.
function addStatus(c, text) {
  let g = c._statusGroup;
  if (!g) {
    g = el('details', 'status-collapse');
    g.innerHTML = '<summary><span class="sc-dot"></span><span class="sc-latest"></span><span class="sc-count"></span><span class="sc-caret">▸</span></summary><div class="sc-body"></div>';
    c.transcript.appendChild(g);
    c._statusGroup = g; g._n = 0;
  }
  g._n = (g._n || 0) + 1;
  g.querySelector('.sc-latest').textContent = text;
  g.querySelector('.sc-count').textContent = g._n > 1 ? ('· ' + g._n) : '';
  g.querySelector('.sc-body').appendChild(Object.assign(el('div', 'sc-item'), { textContent: text }));
  maybeScroll(c);
}
// live=true → also mirror into The Wire (only for fresh deltas, not history loads).
function renderServerMsg(c, m, live) {
  switch (m.role) {
    case 'user': c._statusGroup = null; addMsg(c, 'user', m.text); c._lastUserText = m.text; break;
    case 'assistant': {
      if (isStatusMsg(m.text)) { addStatus(c, m.text); break; }
      c._statusGroup = null;
      addMsg(c, 'assistant', m.text);
      if (live) logEvent(c.meta.id, 'assistant', (m.text || '').slice(0, 200));
      const asg = parseAssignments(m.text || ''); if (asg.length) renderDispatch(c, asg);
      break;
    }
    case 'thinking': c._statusGroup = null; addThinking(c, m.text); break;
    case 'tool': {
      c._statusGroup = null;
      const i = m.input || {};
      const target = i.command || i.file_path || i.pattern || i.url || i.path || '';
      addToolCard(c, m.name, target, i);
      if (live) logEvent(c.meta.id, 'tool', (m.name || '') + (target ? ': ' + target : ''));
      break;
    }
    case 'result': break;   // per-turn cost lives in the header total now (no clutter lines)
    case 'stopped': c._statusGroup = null; addMsg(c, 'system', '■ Stopped by you'); break;
    case 'error': c._statusGroup = null; addErrorCard(c, m.text); break;
  }
}
function updateEarlierBtn(c) {
  if (c && c.earlierBtn) c.earlierBtn.style.display = (c.firstIndex > 0) ? '' : 'none';
}
// Pin to the bottom INSTANTLY (no smooth), and again next frame after layout settles.
function pinBottom(c) {
  if (!c || !c.transcript) return;
  const t = c.transcript;
  t.scrollTop = t.scrollHeight;
  requestAnimationFrame(() => { t.scrollTop = t.scrollHeight; });
}
// Initial load: paint instantly from cache if we have it, else fetch only recent msgs.
async function loadTranscript(c) {
  if (!c) return;
  c._statusGroup = null;   // start a fresh status-collapse run
  const cached = tCache.get(c.meta.id);
  if (cached) {
    c.transcript.innerHTML = cached.html;
    wireCopyButtons(c.transcript);
    c.firstIndex = cached.firstIndex; c.nextIndex = cached.nextIndex;
    updateEarlierBtn(c);
    pinBottom(c);
    pollTranscript(c);   // catch up with anything new since we cached
    return;
  }
  if (c._polling) return;
  c._polling = true;
  try {
    const r = await api('/api/agents/' + c.meta.id + '/transcript');   // recent window only
    c.transcript.innerHTML = '';
    c._statusGroup = null;
    (r.msgs || []).forEach((m) => renderServerMsg(c, m, false));
    c.firstIndex = r.offset || 0;
    c.nextIndex = r.total || 0;
    updateEarlierBtn(c);
    setBusyUI(c, r.busy || r.loopActive, r.activity);
    pinBottom(c);
    saveTCache(c);
  } catch {} finally { c._polling = false; }
}
// Poll: fetch ONLY messages after nextIndex (small payload), append them.
async function pollTranscript(c) {
  if (!c || c._polling) return;
  c._polling = true;
  try {
    const r = await api('/api/agents/' + c.meta.id + '/transcript?since=' + (c.nextIndex || 0));
    const msgs = r.msgs || [];
    msgs.forEach((m) => renderServerMsg(c, m, true));
    c.nextIndex = (r.total != null) ? r.total : ((c.nextIndex || 0) + msgs.length);
    if (c.firstIndex == null) c.firstIndex = r.offset || 0;
    setBusyUI(c, r.busy || r.loopActive, r.activity);
    if (msgs.length) saveTCache(c);
  } catch {} finally { c._polling = false; }
}
// Lazy "load earlier": fetch the window before the oldest rendered msg and prepend it.
async function loadEarlier(c) {
  if (!c || !(c.firstIndex > 0) || c._loadingEarlier) return;
  c._loadingEarlier = true;
  try {
    const r = await api('/api/agents/' + c.meta.id + '/transcript?before=' + c.firstIndex + '&limit=40');
    const msgs = r.msgs || [];
    if (!msgs.length) { c.firstIndex = 0; updateEarlierBtn(c); return; }
    const frag = document.createElement('div');
    const tmp = { meta: c.meta, transcript: frag };
    msgs.forEach((m) => renderServerMsg(tmp, m, false));
    const prevH = c.transcript.scrollHeight, prevTop = c.transcript.scrollTop;
    while (frag.lastChild) c.transcript.insertBefore(frag.lastChild, c.transcript.firstChild);
    wireCopyButtons(c.transcript);
    c.firstIndex = r.offset || 0;
    updateEarlierBtn(c);
    c.transcript.scrollTop = prevTop + (c.transcript.scrollHeight - prevH);   // keep view stable
    saveTCache(c);
  } catch {} finally { c._loadingEarlier = false; }
}
let _pollTimer = null;
function ensurePoll() {
  if (_pollTimer) return;
  _pollTimer = setInterval(() => {
    if (currentView !== 'chat' || currentLayout !== 'focus') return;
    const c = cards.get(focusedAgentId);
    if (c) pollTranscript(c);
  }, 1200);
}

async function stopRun(id) {
  const c = cards.get(id);
  if (c) { c.stop.disabled = true; c.stop.textContent = 'stopping…'; }
  try { await api('/api/agents/' + id + '/stop', 'POST'); } catch {}
  // Pull fresh server state so busy clears and the Send button returns.
  await refresh();
}

function renderEvent(c, evt) {
  switch (evt.type) {
    case 'system':
      if (evt.stopped) { addMsg(c, 'system', '■ Stopped by you'); logEvent(c.meta.id, 'system', 'Stopped'); break; }
      c.meta.hasSession = true;
      logEvent(c.meta.id, 'system', 'Session init' + (evt.model ? ' — ' + evt.model : ''));
      break;
    case 'thinking': {
      addThinking(c, evt.text);
      logEvent(c.meta.id, 'thinking', (evt.text || '').slice(0, 120));
      break;
    }
    case 'text': {
      addMsg(c, 'assistant', evt.text);
      logEvent(c.meta.id, 'assistant', evt.text.slice(0, 200));
      const assignments = parseAssignments(evt.text);
      if (assignments.length) renderDispatch(c, assignments);
      break;
    }
    case 'tool': {
      const i = evt.input || {};
      const target = i.command || i.file_path || i.pattern || i.url || i.path || '';
      addToolCard(c, evt.name, target, i);
      logEvent(c.meta.id, 'tool', evt.name + (target ? ': ' + target : ''));
      break;
    }
    case 'result':
      if (evt.totals) { c.meta.totals = evt.totals; updateStats(); }
      if (typeof evt.cost === 'number') {
        const s = evt.duration ? (evt.duration / 1000).toFixed(1) + 's · ' : '';
        addMsg(c, 'system', s + '$' + evt.cost.toFixed(4));
        logEvent(c.meta.id, 'system', 'Turn done — $' + evt.cost.toFixed(4));
      }
      break;
    case 'error':
      addMsg(c, 'err', evt.error);
      logEvent(c.meta.id, 'error', evt.error);
      break;
  }
}

// Collapsible "reasoning" block — dim, collapsed by default (the model's thinking).
function addThinking(c, text) {
  const card = el('details', 'think-card');
  const sum = el('summary');
  sum.innerHTML = '<span class="th-ico">✳</span><span>Reasoning</span><span class="th-caret">▸</span>';
  card.append(sum);
  const body = el('div', 'th-body'); body.textContent = text || '';
  card.append(body);
  c.transcript.appendChild(card);
  maybeScroll(c);
  return card;
}

// Collapsible tool-call card (click the summary to expand the full input).
function addToolCard(c, name, target, input) {
  const card = el('details', 'tool-card');
  const sum = el('summary');
  sum.innerHTML = '<span class="tc-icon">◆</span>'
    + '<span class="tc-name">' + esc(name || 'tool') + '</span>'
    + '<span class="tc-target">' + esc(target || '') + '</span>'
    + '<span class="tc-caret">▸</span>';
  card.append(sum);
  const body = el('div', 'tc-body');
  let detail = ''; try { detail = JSON.stringify(input || {}, null, 2); } catch { detail = String(target || ''); }
  body.textContent = detail || '(no input)';
  card.append(body);
  c.transcript.appendChild(card);
  maybeScroll(c);
  return card;
}

// ---- Autonomous loop ----
let loopAgentId = null;
function openLoopModal(id) {
  const a = findAgent(id); if (!a) return;
  loopAgentId = id;
  $('loopAgentName').textContent = '· ' + (a.role || a.name);
  const lp = a.loop || {};
  $('loopPrompt').value = lp.prompt || '';
  $('loopMinutes').value = lp.maxMs ? Math.round(lp.maxMs / 60000) : '';
  $('loopIterations').value = lp.maxIterations || '';
  $('loopBudget').value = lp.maxCostUsd || '';
  openModal('loopModal');
}
async function startLoop() {
  const id = loopAgentId; if (!id) return;
  const prompt = $('loopPrompt').value.trim();
  if (!prompt) { $('loopPrompt').focus(); return; }
  const body = {
    action: 'start', prompt,
    maxMinutes: parseFloat($('loopMinutes').value) || 0,
    maxIterations: parseInt($('loopIterations').value, 10) || 0,
    maxCostUsd: parseFloat($('loopBudget').value) || 0,
  };
  try {
    await api('/api/agents/' + id + '/loop', 'POST', body);
    closeModals();
    await refresh();               // repaint card with the loop badge
    doSend(id, prompt);            // fire the first turn; finally{} chains the rest
  } catch (e) { alert('Could not start loop: ' + e.message); }
}
// Called from doSend's finally after each turn. Asks the server whether to run again.
async function maybeContinueLoop(id) {
  const c = cards.get(id);
  if (!c || !c.meta || !c.meta.loop || !c.meta.loop.active) return;
  let r;
  try { r = await api('/api/agents/' + id + '/loop', 'POST', { action: 'tick' }); }
  catch { return; }
  if (r && r.continue) {
    setTimeout(() => { const cc = cards.get(id); if (cc && !cc.meta.busy) doSend(id, r.prompt || c.meta.loop.prompt); }, 1500);
  } else {
    const cc = cards.get(id);
    if (cc) addMsg(cc, 'system', 'Loop ended — ' + ((r && r.reason) || 'stopped'));
    refresh();
  }
}

// ---- Accounts (Track C) ----
function accountFor(agent) { return (S.accounts || []).find((x) => x.id === agent.accountId); }
function accountKey(agent) { return agent.accountId || 'machine'; }
function makeAccountChip(agent) {
  const acc = accountFor(agent);
  const chip = el('div', 'acct-chip');
  const sw = el('span', 'acct-swatch'); sw.style.background = acc ? (acc.color || '#1F5C4A') : '#6b6b6b';
  chip.append(sw);
  chip.append(el('span', null, acc ? acc.name : 'Machine login'));
  // Collision guard: two RUNNING workers on the same account corrupt Claude's
  // Projects/Chat/Cowork sync (see Multi-Claude bug report). Warn loudly.
  const busySame = projectAgents().filter((a) => a.busy && accountKey(a) === accountKey(agent));
  if (busySame.length > 1) {
    chip.classList.add('warn');
    chip.append(el('span', null, ' ⚠'));
    chip.title = '⚠ ' + busySame.length + ' running workers share this account. Claude\'s Projects/Chat sync can break — give them separate accounts.';
  } else {
    chip.title = acc ? ('Runs on account: ' + acc.name) : "Runs on this machine's Claude login";
  }
  return chip;
}
function fillAccountOptions(sel, currentVal) {
  sel.innerHTML = '';
  const def = el('option', null, 'Machine login (default)'); def.value = ''; sel.appendChild(def);
  (S.accounts || []).forEach((acc) => {
    const o = el('option', null, acc.name + (acc.provider && acc.provider !== 'claude' ? ' (' + acc.provider + ')' : ''));
    o.value = acc.id; if (acc.id === (currentVal || '')) o.selected = true; sel.appendChild(o);
  });
}

// ---- Files ----
function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = rej;
    r.readAsDataURL(file);
  });
}
async function handleAgentFiles(id, fileList) {
  const c = cards.get(id);
  for (const file of fileList) {
    try {
      const dataBase64 = await readAsDataURL(file);
      const out = await api('/api/agents/' + id + '/upload', 'POST', { filename: file.name, dataBase64 });
      if (out.path) {
        c.pending.push(out.path);
        const chip = el('div', 'chip');
        chip.append(Object.assign(el('span'), { innerHTML: icon('attach', 13) + ' ' + esc(file.name) }));
        c.attachments.appendChild(chip);
      }
    } catch (e) { addMsg(c, 'err', 'Upload failed: ' + e.message); }
  }
  if (c.fileInput) c.fileInput.value = '';
}
async function addSharedFiles(fileList) {
  const proj = activeProject(); if (!proj) return;
  for (const file of fileList) {
    const dataBase64 = await readAsDataURL(file);
    S = await api('/api/projects/' + proj.id + '/files', 'POST', { filename: file.name, dataBase64 });
  }
  render();
}
async function removeSharedFile(p) {
  const proj = activeProject(); if (!proj) return;
  S = await api('/api/projects/' + proj.id + '/files', 'POST', { removePath: p });
  render();
}

// ---- Workers CRUD ----
function fillReportsOptions(sel, currentVal, excludeRole) {
  sel.innerHTML = '';
  sel.appendChild(Object.assign(el('option', null, '— Top level (no manager) —'), { value: '' }));
  projectAgents().forEach((a) => {
    const label = a.role || a.name;
    if (label === excludeRole) return;
    const o = el('option', null, label);
    o.value = label;
    if (label === currentVal) o.selected = true;
    sel.appendChild(o);
  });
}
function fillModelOptions(sel, currentVal) {
  sel.innerHTML = '';
  MODELS.forEach((m) => { const o = el('option', null, m.label); o.value = m.v; if (m.v === (currentVal || '')) o.selected = true; sel.appendChild(o); });
}
function syncEngineFields() {
  const eng = $('wmEngine').value;
  $('wmApiFields').classList.toggle('hidden', eng !== 'api');
  $('wmCcFields').classList.toggle('hidden', eng !== 'claude-code');
  $('wmOcFields').classList.toggle('hidden', eng !== 'openclaw');
  $('wmCodexFields').classList.toggle('hidden', eng !== 'codex');
  $('wmHermesFields').classList.toggle('hidden', eng !== 'hermes');
}
function openWorker(id, presetReports) {
  editingAgentId = id || null;
  const a = id ? findAgent(id) : null;
  $('wmTitle').textContent = id ? 'Edit Worker' : 'Add Worker';
  $('wmName').value = a ? (a.role || a.name) : '';
  fillReportsOptions($('wmReports'), a ? a.reportsTo : (presetReports || ''), a ? (a.role || a.name) : '');
  fillAccountOptions($('wmAccount'), a ? a.accountId : '');
  $('wmAccountManage').onclick = () => { closeModals(); openAccountModal(); };
  fillModelOptions($('wmModel'), a ? a.model : '');
  $('wmEffort').value = a ? (a.effort || '') : '';
  $('wmEngine').value = a ? (a.engine || 'claude-code') : 'claude-code';
  $('wmApiBase').value = a ? (a.apiBaseUrl || '') : '';
  $('wmApiKey').value = a ? (a.apiKey || '') : '';
  $('wmApiModel').value = a ? (a.apiModel || '') : '';
  $('wmCcBase').value = a ? (a.ccBaseUrl || '') : '';
  $('wmCcToken').value = a ? (a.ccAuthToken || '') : '';
  $('wmCcModel').value = a ? (a.ccModel || '') : '';
  $('wmCcOauth').value = a ? (a.ccOauthToken || '') : '';
  $('wmOcProvider').value = a ? (a.ocProvider || '') : '';
  $('wmOcModel').value = a ? (a.ocModel || '') : '';
  $('wmOcApiKey').value = a ? (a.ocApiKey || '') : '';
  $('wmCodexModel').value = a ? (a.codexModel || '') : '';
  $('wmCodexApiKey').value = a ? (a.codexApiKey || '') : '';
  $('wmHermesProvider').value = a ? (a.hermesProvider || '') : '';
  $('wmHermesModel').value = a ? (a.hermesModel || '') : '';
  $('wmHermesApiKey').value = a ? (a.hermesApiKey || '') : '';
  $('wmSoul').value = a ? a.soul : '';
  $('wmCcOauthGet').onclick = async () => {
    const btn = $('wmCcOauthGet');
    btn.disabled = true; btn.textContent = 'Authorize in browser…';
    try {
      const r = await api('/api/account/setup-token', 'POST');
      if (r.token) {
        $('wmCcOauth').value = r.token;
        btn.textContent = 'Token captured ✓';
        setTimeout(() => { btn.textContent = 'Get token'; btn.disabled = false; }, 2000);
      } else {
        alert('No token captured yet.' + (r.url ? '\n\nOpen this URL, click Authorize, then press Get token again:\n' + r.url : '\n\nMake sure you click Authorize in the browser, then try again.'));
        btn.textContent = 'Get token'; btn.disabled = false;
      }
    } catch (e) {
      alert('Failed: ' + (e.message || e)); btn.textContent = 'Get token'; btn.disabled = false;
    }
  };
  syncEngineFields();
  openModal('workerModal');
}
async function saveWorker() {
  const proj = activeProject(); if (!proj) return;
  const body = {
    name: $('wmName').value.trim(), role: $('wmName').value.trim(),
    reportsTo: $('wmReports').value, model: $('wmModel').value, accountId: $('wmAccount').value,
    effort: $('wmEffort').value, soul: $('wmSoul').value, engine: $('wmEngine').value,
    apiBaseUrl: $('wmApiBase').value.trim(), apiKey: $('wmApiKey').value.trim(), apiModel: $('wmApiModel').value.trim(),
    ccBaseUrl: $('wmCcBase').value.trim(), ccAuthToken: $('wmCcToken').value.trim(), ccModel: $('wmCcModel').value.trim(), ccOauthToken: $('wmCcOauth').value.trim(),
    ocProvider: $('wmOcProvider').value.trim(), ocModel: $('wmOcModel').value.trim(), ocApiKey: $('wmOcApiKey').value.trim(),
    codexModel: $('wmCodexModel').value.trim(), codexApiKey: $('wmCodexApiKey').value.trim(),
    hermesProvider: $('wmHermesProvider').value.trim(), hermesModel: $('wmHermesModel').value.trim(), hermesApiKey: $('wmHermesApiKey').value.trim(),
  };
  if (editingAgentId) await api('/api/agents/' + editingAgentId + '/edit', 'POST', body);
  else await api('/api/agents', 'POST', { ...body, projectId: proj.id });
  closeModals(); refresh();
}
async function removeWorker(id) {
  if (!confirm('Remove this worker?')) return;
  await api('/api/agents/' + id, 'DELETE');
  if (focusedAgentId === id) focusedAgentId = null;
  refresh();
}

// ---- Sparkline (self-contained SVG) ----
function drawSparkline(values, w, h) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.width = w + 'px'; svg.style.height = h + 'px';
  if (!values.length) return svg;

  const n = values.length;
  const max = Math.max(...values, 0.0001);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 0.0001);
  const pts = values.map((v, i) => {
    const x = n === 1 ? w / 2 : (i / (n - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const areaPath = `M0,${h} L${pts.split(' ').join(' L')} L${w},${h} Z`;
  const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  area.setAttribute('d', areaPath);
  area.setAttribute('fill', 'rgba(232,163,61,.12)');
  svg.appendChild(area);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  path.setAttribute('points', pts);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#1F5C4A');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);

  return svg;
}

function renderCostSpark() {
  const svg = $('costSpark');
  if (!svg) return;
  svg.innerHTML = '';
  // Collect last 7 days of daily cost totals from all agents' history
  const buckets = {};
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * dayMs).toDateString();
    buckets[d] = 0;
  }
  S.agents.forEach((a) => {
    ((a.totals && a.totals.history) || []).forEach((h) => {
      const d = new Date(h.ts).toDateString();
      if (d in buckets) buckets[d] += h.cost || 0;
    });
  });
  const values = Object.values(buckets);
  const drawn = drawSparkline(values, 80, 32);
  drawn.childNodes.forEach((n) => svg.appendChild(n.cloneNode(true)));
}

// ---- Stats bar + cost hero ----
let lastCost = 0;
function updateStats() {
  let tokens = 0, cost = 0, planCost = 0, apiCost = 0, turns = 0, active = 0;
  S.agents.forEach((a) => {
    const t = a.totals || {};
    tokens += (t.input || 0) + (t.output || 0) + (t.cache || 0);
    cost += t.cost || 0;
    turns += t.turns || 0;
    if (a.busy) active++;
    if (a.engine === 'claude-code' && !a.ccBaseUrl) planCost += t.cost || 0;
    else apiCost += t.cost || 0;
  });
  const projList = projectAgents();
  $('sAgents').textContent = projList.length;
  $('sAgentsSub').textContent = active + ' active';
  $('sTokens').textContent = fmt(tokens);
  $('sTurns').textContent = turns + ' turns';

  // Cost hero — animate on change if CountUp is available
  const hero = $('sCostHero');
  if (window.countUp && window.countUp.CountUp && Math.abs(cost - lastCost) > 0.001) {
    try {
      const c = new window.countUp.CountUp('sCostHero', cost, { prefix: '$', decimalPlaces: 2, duration: 0.8, startVal: lastCost });
      if (!c.error) c.start(); else hero.textContent = '$' + cost.toFixed(2);
    } catch { hero.textContent = '$' + cost.toFixed(2); }
  } else {
    hero.textContent = '$' + cost.toFixed(2);
  }
  lastCost = cost;

  $('sCostPlan').textContent = 'plan $' + planCost.toFixed(2);
  $('sCostApi').textContent = 'api $' + apiCost.toFixed(2);

  const budget = parseFloat($('budgetInput').value);
  $('sLeft').textContent = budget > 0 ? Math.max(0, budget - cost).toFixed(2) : '—';

  renderCostSpark();
}

// ---- Views + layout ----
function applyViewButtons() {
  $('viewChat').classList.toggle('on', currentView === 'chat');
  $('viewLog').classList.toggle('on', currentView === 'log');
  $('viewDiagram').classList.toggle('on', currentView === 'diagram');
  $('viewReel').classList.toggle('on', currentView === 'reel');
}
function applyLayoutButtons() {
  document.querySelectorAll('#layoutBar button').forEach((b) => b.classList.toggle('on', b.dataset.layout === currentLayout));
}
function setView(v) { currentView = v; applyViewButtons(); render(); }
function setLayout(l) { currentLayout = l; applyLayoutButtons(); render(); }

// ---- Diagram ----
function renderDiagram() {
  const d = $('diagram'); d.innerHTML = '';
  const list = projectAgents();
  if (!activeProject()) { d.innerHTML = '<div class="empty"><p>Create a project to see its team diagram.</p></div>'; return; }
  if (!list.length) {
    d.innerHTML = '<div class="empty"><p>No team yet.</p></div>';
    const a = el('div', 'diag-actions');
    const b = el('button', 'icon-btn', '+ Add first worker');
    b.onclick = () => openWorker(null); a.appendChild(b); d.appendChild(a);
    return;
  }
  d.appendChild(el('div', 'dhint', 'Click a name to focus · use "Reports to" to connect/disconnect · ＋ adds a worker under that role'));

  const byRole = (r) => list.filter((a) => norm(a.reportsTo) === norm(r));
  const roots = list.filter((a) => !a.reportsTo || !list.some((b) => norm(b.role || b.name) === norm(a.reportsTo)));

  function nodeHtml(a) {
    const role = a.role || a.name;
    const children = byRole(role);
    const node = el('li');
    const box = el('div', 'node' + (isDirector(a) ? ' director' : ''));
    const title = el('div', 'nr', role); title.title = 'Click to focus'; title.onclick = () => focusAgent(a.id);
    box.append(title);
    const eng = a.engine === 'api' ? 'API:' + (a.apiModel || '?') : a.engine === 'openclaw' ? 'OC:' + (a.ocProvider ? a.ocProvider + '/' : '') + (a.ocModel || '?') : a.engine === 'codex' ? 'CODEX:' + (a.codexModel || 'default') : a.engine === 'hermes' ? 'HERMES:' + (a.hermesProvider ? a.hermesProvider + '/' : '') + (a.hermesModel || '?') : (a.ccModel ? '⇄' + a.ccModel : (MODELS.find((m) => m.v === a.model) || {}).label || 'Default');
    box.append(el('div', 'nn', '#' + a.num + ' · ' + eng));
    const t = a.totals || {};
    box.append(el('div', 'nt', '$' + (t.cost || 0).toFixed(3) + ' · ' + fmt((t.input || 0) + (t.output || 0)) + ' tok'));

    const tools = el('div', 'ntools');
    const chat = el('button'); chat.innerHTML = icon('chat', 15); chat.title = 'Open chat'; chat.onclick = () => focusAgent(a.id);
    const edit = el('button'); edit.innerHTML = icon('edit', 15); edit.title = 'Edit'; edit.onclick = () => openWorker(a.id);
    const add = el('button', null, '＋'); add.onclick = () => openWorker(null, role);
    const del = el('button'); del.innerHTML = icon('close', 15); del.title = 'Remove'; del.onclick = () => removeWorker(a.id);
    tools.append(chat, edit, add, del); box.append(tools);

    const rsel = el('select', 'rsel');
    rsel.appendChild(Object.assign(el('option', null, '↑ Top level (disconnect)'), { value: '' }));
    list.forEach((b) => { const lbl = b.role || b.name; if (lbl === role) return; const o = el('option', null, '↳ ' + lbl); o.value = lbl; if (norm(lbl) === norm(a.reportsTo)) o.selected = true; rsel.appendChild(o); });
    rsel.onchange = () => setReports(a.id, rsel.value);
    box.append(rsel);

    node.append(box);
    if (children.length) { const ul = el('ul'); children.forEach((ch) => ul.append(nodeHtml(ch))); node.append(ul); }
    return node;
  }
  const tree = el('div', 'tree'); const ul = el('ul');
  roots.forEach((r) => ul.append(nodeHtml(r))); tree.append(ul); d.append(tree);
  const acts = el('div', 'diag-actions');
  const b = el('button', 'icon-btn', '+ Add worker'); b.onclick = () => openWorker(null);
  acts.appendChild(b); d.appendChild(acts);
}

async function setReports(id, value) {
  await api('/api/agents/' + id + '/edit', 'POST', { reportsTo: value });
  await refresh();
  setView('diagram');
}

// ---- Activity feed (right panel) ----
function logEvent(agentId, type, detail) {
  const a = findAgent(agentId);
  const name = a ? (a.role || a.name) : agentId;
  const entry = { ts: Date.now(), agentId, agentName: name, type, detail };
  activityFeed.unshift(entry);
  missionLogEntries.push(entry);
  if (activityFeed.length > 200) activityFeed.pop();
  if (missionLogEntries.length > 1000) missionLogEntries.shift();
  renderActivity();
}

function renderActivity() {
  const body = $('activityBody');
  if (!body) return;
  const items = activityFeed.filter((e) => activityFilter === 'all' ? true : e.type === activityFilter);
  body.innerHTML = '';
  if (!items.length) {
    body.innerHTML = '<div class="activity-empty">The fire is warm.<br>Every hammer stroke will show here.</div>';
    return;
  }
  items.slice(0, 80).forEach((e) => {
    const row = el('div', 'activity-entry ' + e.type);
    const d = new Date(e.ts);
    const ts = el('span', 'ae-ts', d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const agent = el('span', 'ae-agent', e.agentName);
    agent.onclick = () => focusAgent(e.agentId);
    agent.style.cursor = 'pointer';
    const detail = el('span', 'ae-detail', e.detail);
    row.append(ts, agent, detail);
    body.appendChild(row);
  });
}

// ---- Mission Log (full view) ----
function renderMissionLog() {
  const wrap = $('missionLog');
  wrap.innerHTML = '';
  if (!missionLogEntries.length) {
    const b = el('div', 'empty');
    b.innerHTML = '<h2>The Ledger</h2><p>Every mark the Foundry makes will be recorded here. Send the first task to start the ledger.</p>';
    wrap.append(b);
    return;
  }
  wrap.appendChild(el('h2', null, 'The Ledger · ' + missionLogEntries.length + ' entries'));
  [...missionLogEntries].reverse().slice(0, 400).forEach((e) => {
    const row = el('div', 'log-row');
    const d = new Date(e.ts);
    row.append(el('span', 'lr-ts', d.toLocaleTimeString('en-US', { hour12: false })));
    row.append(el('span', 'lr-agent', e.agentName));
    row.append(el('span', 'lr-type ' + e.type, e.type));
    row.append(el('span', 'lr-detail', e.detail));
    wrap.appendChild(row);
  });
}

// ---- Save session ----
async function saveSession(id) {
  const c = cards.get(id);
  if (!c) return;
  const msgs = c.transcript.querySelectorAll('.msg, .dispatch');
  if (!msgs.length) { alert('No messages to save.'); return; }
  const meta = c.meta;
  const lines = [
    `# Session — ${meta.role || meta.name}`,
    `**Agent #${meta.num}** | Engine: ${meta.engine || 'claude-code'}`,
    `**Date:** ${new Date().toISOString().slice(0, 10)}`,
    '',
  ];
  msgs.forEach((m) => {
    if (m.classList.contains('user')) lines.push('## You', m.textContent, '');
    else if (m.classList.contains('assistant')) lines.push('## Assistant', m.textContent, '');
    else if (m.classList.contains('tool')) lines.push('> ' + m.textContent, '');
    else if (m.classList.contains('err')) lines.push('**ERROR:** ' + m.textContent, '');
    else if (m.classList.contains('system')) lines.push('*' + m.textContent + '*', '');
    else if (m.classList.contains('dispatch')) lines.push('### Dispatch', m.textContent, '');
  });
  const t = meta.totals || {};
  lines.push('---', `Tokens in: ${fmt(t.input)} | out: ${fmt(t.output)} | cache: ${fmt(t.cache)} | turns: ${t.turns || 0} | cost: $${(t.cost || 0).toFixed(4)}`);
  const md = lines.join('\n');
  try {
    const r = await api('/api/agents/' + id + '/save', 'POST', { markdown: md });
    if (r.ok) addMsg(c, 'system', 'Session saved: ' + r.filename);
    else addMsg(c, 'err', 'Save failed: ' + (r.error || 'unknown'));
  } catch (e) { addMsg(c, 'err', 'Save error: ' + e.message); }
}

// ---- Broadcast ----
function broadcast() {
  const input = $('bcInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  projectAgents().forEach((a) => doSend(a.id, text));
}

// ---- Folder browser ----
let browseTargetInput = null;
let browseCurrentPath = '';
async function openBrowser(targetInputId, startPath) {
  browseTargetInput = targetInputId;
  openModal('browseModal');
  await browseTo(startPath || $(targetInputId).value || '');
}
async function browseTo(p) {
  try {
    const q = p ? '?path=' + encodeURIComponent(p) : '';
    const r = await fetch('/api/browse' + q);
    const d = await r.json();
    if (d.error) { alert(d.error); return; }
    browseCurrentPath = d.path || '';
    $('browseCurrent').value = browseCurrentPath || '(select a drive/root)';
    const list = $('browseList');
    list.innerHTML = '';
    if (!d.dirs || !d.dirs.length) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">(empty folder — you can still pick it)</div>';
      return;
    }
    d.dirs.forEach((entry) => {
      const row = el('div');
      row.style.cssText = 'padding:8px 12px;cursor:pointer;border-radius:6px;font-size:13px;display:flex;align-items:center;gap:8px;transition:background .1s';
      row.innerHTML = '<span style="color:var(--accent)">' + icon('folder', 15) + '</span><span>' + esc(entry.name) + '</span>';
      row.onmouseenter = () => row.style.background = 'var(--panel2)';
      row.onmouseleave = () => row.style.background = 'transparent';
      row.onclick = () => browseTo(entry.path);
      list.appendChild(row);
    });
  } catch (e) { alert('Browse failed: ' + e.message); }
}
function pickCurrentFolder() {
  if (!browseCurrentPath) { alert('Navigate into a folder first.'); return; }
  if (browseTargetInput) $(browseTargetInput).value = browseCurrentPath;
  closeModals();
}

// ---- Modals ----
function openModal(id) { $(id).classList.add('open'); }
function closeModals() { document.querySelectorAll('.modal').forEach((m) => m.classList.remove('open')); }

function openNewProject() {
  $('npName').value = '';
  $('npCwd').value = (S.projects[0] && S.projects[0].cwd) || '';
  const sel = $('npTemplate'); sel.innerHTML = '';
  sel.appendChild(Object.assign(el('option', null, 'Blank (no team)'), { value: '' }));
  S.templates.forEach((t) => { const o = el('option', null, t.name + ' (' + t.roles.length + ')'); o.value = t.name; sel.appendChild(o); });
  syncTemplateParamsVis();
  openModal('projModal');
}
function syncTemplateParamsVis() {
  const on = !!$('npTemplate').value;
  $('tplParamsWrap').style.display = on ? '' : 'none';
  $('tplGoalWrap').style.display = on ? '' : 'none';
}
async function createProject() {
  const hadTemplate = !!$('npTemplate').value;
  await api('/api/projects', 'POST', {
    name: $('npName').value.trim() || 'Untitled Project',
    cwd: $('npCwd').value.trim(),
    templateName: $('npTemplate').value,
    size: $('npSize').value,
    goal: $('npGoal').value,
  });
  closeModals();
  await refresh();
  if (hadTemplate) setView('diagram');
}

// Templates manager
function openTemplates() {
  const list = $('tplList'); list.innerHTML = '';
  S.templates.forEach((t) => {
    const row = el('div', 'tpl-row');
    row.append(el('span', 'tn', t.name));
    row.append(el('span', 'td', (t.roles || []).map((r) => r.role).join(', ')));
    const edit = el('button', 'icon-btn', 'Edit'); edit.onclick = () => openTemplateEditor(t);
    const del = el('button', 'icon-btn', 'Delete'); del.onclick = async () => { await api('/api/templates/' + encodeURIComponent(t.name), 'DELETE'); await refresh(); openTemplates(); };
    row.append(edit, del); list.appendChild(row);
  });
  openModal('tplModal');
}
function openTemplateEditor(t) {
  editingTemplate = t ? JSON.parse(JSON.stringify(t)) : { name: '', description: '', roles: [] };
  $('teTitle').textContent = t ? 'Edit Template' : 'New Template';
  $('teName').value = editingTemplate.name;
  $('teDesc').value = editingTemplate.description;
  renderTemplateRoles();
  closeModals();
  openModal('tplEditModal');
}
function renderTemplateRoles() {
  const wrap = $('teRoles'); wrap.innerHTML = '';
  editingTemplate.roles.forEach((r, i) => {
    const box = el('div', 'role-edit');
    const top = el('div', 'top');
    const roleIn = el('input'); roleIn.placeholder = 'Role title'; roleIn.value = r.role || ''; roleIn.oninput = () => (r.role = roleIn.value);
    const reportsIn = el('input'); reportsIn.placeholder = 'Reports to (role, blank = top)'; reportsIn.value = r.reportsTo || ''; reportsIn.oninput = () => (r.reportsTo = reportsIn.value);
    const modelSel = el('select');
    MODELS.forEach((m) => { const o = el('option', null, m.label); o.value = m.v; if (m.v === (r.model || '')) o.selected = true; modelSel.appendChild(o); });
    modelSel.onchange = () => (r.model = modelSel.value);
    const del = Object.assign(el('button', 'icon-btn'), { innerHTML: icon('close', 14) }); del.onclick = () => { editingTemplate.roles.splice(i, 1); renderTemplateRoles(); };
    top.append(roleIn, reportsIn, modelSel, del);
    const soul = el('textarea'); soul.placeholder = 'Soul / persona (.md)'; soul.value = r.soul || ''; soul.style.width = '100%'; soul.style.minHeight = '90px'; soul.oninput = () => (r.soul = soul.value);
    box.append(top, soul); wrap.appendChild(box);
  });
}
async function saveTemplate() {
  editingTemplate.name = $('teName').value.trim();
  editingTemplate.description = $('teDesc').value.trim();
  if (!editingTemplate.name) { alert('Template needs a name'); return; }
  await api('/api/templates', 'POST', editingTemplate);
  closeModals(); await refresh(); openTemplates();
}
async function saveProjectAsTemplate() {
  const proj = activeProject(); if (!proj) return;
  const name = prompt('Template name:', proj.name + ' Team'); if (!name) return;
  await api('/api/save-template-from-project/' + proj.id, 'POST', { name });
  await refresh(); alert('Saved as template: ' + name);
}

// ---- Usage modal ----
let usagePeriod = 'today';
async function openUsageModal() { openModal('usageModal'); await renderUsage(); }
async function renderUsage() {
  const r = await api('/api/usage');
  const all = r.usage || [];
  const now = Date.now();
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(startOfDay); startOfMonth.setDate(1);
  let cutoff = 0;
  if (usagePeriod === 'today') cutoff = startOfDay.getTime();
  else if (usagePeriod === 'week') cutoff = startOfWeek.getTime();
  else if (usagePeriod === 'month') cutoff = startOfMonth.getTime();
  const filtered = all.filter((e) => e.ts >= cutoff);

  let totalInput = 0, totalOutput = 0, totalCache = 0, totalCost = 0, totalTurns = 0;
  const byAgent = {}, byDay = {};
  filtered.forEach((e) => {
    totalInput += e.input || 0; totalOutput += e.output || 0; totalCache += e.cache || 0;
    totalCost += e.cost || 0; totalTurns++;
    const key = e.agentRole || e.agentName || e.agentId;
    if (!byAgent[key]) byAgent[key] = { input: 0, output: 0, cache: 0, cost: 0, turns: 0, engine: e.engine };
    byAgent[key].input += e.input || 0; byAgent[key].output += e.output || 0;
    byAgent[key].cache += e.cache || 0; byAgent[key].cost += e.cost || 0; byAgent[key].turns++;
    const day = new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!byDay[day]) byDay[day] = { input: 0, output: 0, cost: 0, turns: 0 };
    byDay[day].input += e.input || 0; byDay[day].output += e.output || 0;
    byDay[day].cost += e.cost || 0; byDay[day].turns++;
  });

  const planCost = filtered.filter((e) => e.engine === 'claude-code').reduce((s, e) => s + (e.cost || 0), 0);
  const apiCostVal = totalCost - planCost;
  $('usageSummary').innerHTML = '<div class="usage-summary">'
    + '<div class="us-card"><div class="us-val">' + fmt(totalInput + totalOutput) + '</div><div class="us-label">Tokens</div></div>'
    + '<div class="us-card"><div class="us-val">$' + totalCost.toFixed(2) + '</div><div class="us-label">Total Cost</div></div>'
    + '<div class="us-card"><div class="us-val" style="color:var(--accent2)">$' + planCost.toFixed(2) + '</div><div class="us-label">Plan Included</div></div>'
    + '<div class="us-card"><div class="us-val" style="color:var(--accent)">$' + apiCostVal.toFixed(2) + '</div><div class="us-label">API Billed</div></div>'
    + '<div class="us-card"><div class="us-val">' + totalTurns + '</div><div class="us-label">Turns</div></div>'
    + '</div>';

  let html = '<table class="usage-grid"><thead><tr><th>Agent</th><th>Engine</th><th>Turns</th><th>Input</th><th>Output</th><th>Cache</th><th>Cost</th></tr></thead><tbody>';
  for (const [name, d] of Object.entries(byAgent).sort((a, b) => b[1].cost - a[1].cost)) {
    html += '<tr><td class="uname">' + esc(name) + '</td><td>' + esc(d.engine || '—') + '</td><td>' + d.turns + '</td><td>' + fmt(d.input) + '</td><td>' + fmt(d.output) + '</td><td>' + fmt(d.cache) + '</td><td>$' + d.cost.toFixed(4) + '</td></tr>';
  }
  html += '</tbody></table>';
  if (Object.keys(byDay).length > 1) {
    html += '<h4 style="margin:18px 0 8px;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.14em">Daily Breakdown</h4>';
    html += '<table class="usage-grid"><thead><tr><th>Day</th><th>Turns</th><th>Input</th><th>Output</th><th>Cost</th></tr></thead><tbody>';
    for (const [day, d] of Object.entries(byDay).reverse()) {
      html += '<tr><td class="uname">' + day + '</td><td>' + d.turns + '</td><td>' + fmt(d.input) + '</td><td>' + fmt(d.output) + '</td><td>$' + d.cost.toFixed(4) + '</td></tr>';
    }
    html += '</tbody></table>';
  }
  $('usageTable').innerHTML = html;
}

// ---- Account ----
let lastAccount = null;
async function fetchAccount() {
  // Header no longer shows a single "logged in as" (misleading with multiple accounts).
  // We just fetch the machine login for the Account Management modal.
  const badge = $('accountBadge');
  try {
    lastAccount = await api('/api/account');
    if (badge) badge.classList.toggle('ok', !!lastAccount.logged_in);
  } catch { lastAccount = null; }
}
async function openAccountModal() {
  $('accountModal').classList.add('open');
  await fetchAccount();
  const info = $('acctInfo');
  if (lastAccount && lastAccount.logged_in) {
    info.innerHTML = '<div style="display:flex;flex-direction:column;gap:4px">'
      + '<div style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.12em">Logged in as</div>'
      + '<div style="font-size:16px;font-weight:700;color:var(--accent2)">' + esc(lastAccount.email || '—') + '</div>'
      + (lastAccount.org ? '<div style="font-size:12px;color:var(--muted)">Org: ' + esc(lastAccount.org) + '</div>' : '')
      + '<div style="font-size:12px;color:var(--muted)">Plan: ' + esc(lastAccount.plan || '—') + '</div>'
      + '</div>';
    $('acctLogout').style.display = '';
  } else {
    info.innerHTML = '<div style="color:var(--err)">Not logged in</div>';
    $('acctLogout').style.display = 'none';
  }
  loadBackups();
  renderVault();
}
async function loadBackups() {
  const r = await api('/api/account/backups');
  const wrap = $('acctBackups');
  if (!r.backups || !r.backups.length) { wrap.innerHTML = '<div style="color:var(--muted);font-size:12px">No saved account backups yet</div>'; return; }
  wrap.innerHTML = '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.12em">Saved accounts (click to restore)</div>';
  r.backups.forEach((b) => {
    const row = el('div', 'tpl-row'); row.style.cursor = 'pointer';
    row.append(el('span', 'tn', b.email));
    row.append(el('span', 'td', b.date));
    const btn = el('button', 'icon-btn', 'Restore');
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Restore account ' + b.email + '? This will overwrite current credentials.')) return;
      btn.disabled = true; btn.textContent = 'Restoring…';
      const res = await api('/api/account/restore', 'POST', { file: b.file });
      if (res.ok) { await fetchAccount(); openAccountModal(); }
      else { btn.textContent = 'Failed'; setTimeout(() => { btn.textContent = 'Restore'; btn.disabled = false; }, 2000); }
    };
    row.appendChild(btn); wrap.appendChild(row);
  });
}

// ---- Account Vault: named, reusable per-worker logins ----
function renderVault() {
  const wrap = $('acctVault'); if (!wrap) return;
  wrap.innerHTML = '';
  const head = el('div'); head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px';
  const h = el('div'); h.style.cssText = 'font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.12em';
  h.textContent = 'Account Vault — reusable per-worker logins';
  const add = el('button', 'icon-btn', '+ Add account'); add.onclick = () => openAccountEditor(null);
  head.append(h, add); wrap.append(head);

  const accts = S.accounts || [];
  if (!accts.length) {
    const e = el('div'); e.style.cssText = 'color:var(--muted);font-size:12px';
    e.textContent = 'No saved accounts yet. Add one to run workers on different Claude logins in parallel.';
    wrap.append(e); return;
  }
  accts.forEach((acc) => {
    const row = el('div', 'vault-row');
    const sw = el('div', 'v-swatch'); sw.style.background = acc.color || '#1F5C4A'; row.append(sw);
    const col = el('div'); col.style.cssText = 'display:flex;flex-direction:column;gap:3px';
    col.append(el('div', 'v-name', acc.name));
    const status = el('div', 'v-tok', 'checking login…'); col.append(status);
    // Foundry-tracked usage for this account (sum of its workers' token/cost totals).
    const mine = (S.agents || []).filter((a) => a.accountId === acc.id);
    const cost = mine.reduce((s, a) => s + ((a.totals && a.totals.cost) || 0), 0);
    const toks = mine.reduce((s, a) => s + ((a.totals && ((a.totals.input || 0) + (a.totals.output || 0) + (a.totals.cache || 0))) || 0), 0);
    const use = el('div', 'v-tok');
    use.textContent = mine.length ? (fmt(toks) + ' tokens · $' + cost.toFixed(2) + ' · ' + mine.length + ' worker' + (mine.length > 1 ? 's' : '')) : 'no workers assigned yet';
    col.append(use); row.append(col);
    // Ask the server whether this account's config dir holds a valid login.
    api('/api/account/status-dir?id=' + acc.id).then((r) => {
      status.textContent = r && r.loggedIn ? ('✓ ' + (r.email || 'logged in')) : 'not logged in';
      status.style.color = r && r.loggedIn ? 'var(--accent2)' : 'var(--muted)';
    }).catch(() => { status.textContent = 'status unknown'; });
    const act = el('div', 'v-actions');
    const login = el('button', 'icon-btn', 'Log in'); login.title = 'Sign this account into its own isolated profile';
    login.onclick = async () => {
      await api('/api/account/login-dir', 'POST', { id: acc.id });
      alert('A terminal opened for "' + acc.name + '".\n\nA browser will open — sign in / Authorize the account you want for this profile.\nWhen done, come back and click Re-check.');
      login.textContent = 'Re-check';
      login.onclick = () => renderVault();
    };
    const usg = el('button', 'icon-btn', 'Plan usage');
    usg.title = "Open this account's Claude to see its subscription limits (type /usage there)";
    usg.onclick = async () => {
      await api('/api/account/open-usage', 'POST', { id: acc.id });
      alert('Opened "' + acc.name + '" in a terminal.\n\nType /usage there to see this account\'s Claude subscription limits (5-hour & weekly).');
    };
    const ed = el('button', 'icon-btn', 'Edit'); ed.onclick = () => openAccountEditor(acc);
    const del = el('button', 'icon-btn', 'Delete');
    del.onclick = async () => {
      if (!confirm('Delete account "' + acc.name + '"? Workers using it fall back to the machine login.')) return;
      await api('/api/accounts/' + acc.id, 'DELETE'); await refresh(); renderVault();
    };
    act.append(login, usg, ed, del); row.append(act);
    wrap.append(row);
  });
}
function openAccountEditor(acc) {
  const wrap = $('acctVault'); if (!wrap) return;
  const iStyle = 'padding:8px 10px;background:var(--input);border:1px solid var(--line);border-radius:6px;color:var(--text);width:100%';
  wrap.innerHTML = '';
  const form = el('div', 'vault-row'); form.style.cssText = 'flex-direction:column;align-items:stretch;gap:8px';
  form.innerHTML =
      '<div style="font-weight:600">' + (acc ? 'Edit account' : 'New account') + '</div>'
    + '<input id="vfName" placeholder="Name (e.g. Work, Personal, Barak)" style="' + iStyle + '" value="' + esc(acc ? acc.name : '') + '" />'
    + '<div style="display:flex;gap:10px;align-items:center">'
    +   '<label style="font-size:12px;color:var(--muted)">Colour</label>'
    +   '<input id="vfColor" type="color" value="' + (acc && acc.color ? acc.color : '#1F5C4A') + '" style="width:44px;height:30px;padding:0;border:0;background:none;cursor:pointer" />'
    + '</div>'
    + '<div style="font-size:11px;color:var(--muted)">After saving, click <b>Log in</b> on the account to sign it into its own isolated profile.</div>'
    + '<div style="display:flex;gap:8px;justify-content:flex-end">'
    +   '<button id="vfCancel" class="ghost" type="button">Cancel</button>'
    +   '<button id="vfSave" class="icon-btn" type="button">Save</button>'
    + '</div>';
  wrap.append(form);
  $('vfCancel').onclick = () => renderVault();
  $('vfSave').onclick = async () => {
    const name = $('vfName').value.trim(); if (!name) { alert('Name is required'); return; }
    const body = { name, color: $('vfColor').value, provider: 'claude' };
    if (acc) body.id = acc.id;
    await api('/api/accounts', 'POST', body); await refresh(); renderVault();
  };
}

// ---- CMD+K palette ----
function buildCmdkItems(query) {
  const q = norm(query.replace(/^\//, ''));
  const items = [];
  // Actions
  items.push({ group: 'Forge', label: 'Start a new project', kbd: '', icon: '＋', run: () => { closeCmdk(); openNewProject(); } });
  items.push({ group: 'Forge', label: 'Hire a worker', kbd: '', icon: '＋', run: () => { closeCmdk(); openWorker(null); } });
  items.push({ group: 'Forge', label: 'Open Blueprints', kbd: '', icon: 'B', run: () => { closeCmdk(); openTemplates(); } });
  items.push({ group: 'Forge', label: 'The Ledger — usage & billing', kbd: '', icon: '$', run: () => { closeCmdk(); openUsageModal(); } });
  items.push({ group: 'Forge', label: 'Save this shift', kbd: '', icon: icon('save', 14), run: () => { closeCmdk(); if (focusedAgentId) saveSession(focusedAgentId); } });
  items.push({ group: 'Forge', label: 'Muster all workers', kbd: '', icon: '◉', run: () => { closeCmdk(); $('bcInput').focus(); } });
  items.push({ group: 'Views', label: 'The Floor — workers', kbd: '', icon: '□', run: () => { closeCmdk(); setView('chat'); } });
  items.push({ group: 'Views', label: 'The Grid — every worker at once', kbd: '', icon: '⊞', run: () => { closeCmdk(); setView('chat'); setLayout('grid'); } });
  items.push({ group: 'Views', label: 'The Focus — one worker fullscreen', kbd: '', icon: '◧', run: () => { closeCmdk(); setView('chat'); setLayout('focus'); } });
  items.push({ group: 'Views', label: 'The Ledger — full history', kbd: '', icon: '⋮', run: () => { closeCmdk(); setView('log'); } });
  items.push({ group: 'Views', label: 'The Chart — team diagram', kbd: '', icon: '⋔', run: () => { closeCmdk(); setView('diagram'); } });

  // Agents (focus)
  projectAgents().forEach((a) => {
    items.push({ group: 'Workers on the floor', label: (a.role || a.name) + '  #' + a.num, kbd: '', icon: roleInitials(a.role || a.name), run: () => { closeCmdk(); focusAgent(a.id); } });
  });

  // Projects (switch)
  S.projects.forEach((p) => {
    items.push({ group: 'Switch project', label: p.name, kbd: '', icon: 'P', run: async () => { closeCmdk(); await api('/api/projects/' + p.id + '/activate', 'POST'); refresh(); } });
  });

  if (!q) return items;
  return items.filter((it) => norm(it.label).includes(q) || norm(it.group).includes(q));
}

let cmdkSelected = 0;
function openCmdk(prefill) {
  $('cmdkOverlay').classList.add('open');
  const input = $('cmdkInput');
  input.value = prefill || '';
  cmdkSelected = 0;
  renderCmdk();
  setTimeout(() => input.focus(), 30);
}
function closeCmdk() { $('cmdkOverlay').classList.remove('open'); }
function renderCmdk() {
  const q = $('cmdkInput').value;
  const items = buildCmdkItems(q);
  if (cmdkSelected >= items.length) cmdkSelected = 0;
  const list = $('cmdkList'); list.innerHTML = '';
  let curGroup = null;
  items.forEach((it, i) => {
    if (it.group !== curGroup) {
      list.appendChild(el('div', 'cmdk-group', it.group));
      curGroup = it.group;
    }
    const row = el('div', 'cmdk-item' + (i === cmdkSelected ? ' on' : ''));
    const iconEl = el('div', 'cmi-icon'); iconEl.innerHTML = it.icon || '';
    row.append(iconEl);
    row.append(el('div', 'cmi-label', it.label));
    if (it.kbd) { const k = el('span', 'cmi-kbd', it.kbd); row.append(k); }
    row.onclick = () => it.run();
    list.append(row);
  });
  // scroll selected into view
  const on = list.querySelector('.cmdk-item.on'); if (on) on.scrollIntoView({ block: 'nearest' });
}

// ---- Wire up ----
$('projSelect').onchange = async (e) => { if (e.target.value) { await api('/api/projects/' + e.target.value + '/activate', 'POST'); refresh(); } };
$('newProjBtn').onclick = openNewProject;
$('tplBtn').onclick = openTemplates;
$('usageBtn').onclick = openUsageModal;
$('cmdkTrigger').onclick = () => openCmdk('');
$('viewChat').onclick = () => setView('chat');
$('viewLog').onclick = () => setView('log');
$('viewDiagram').onclick = () => setView('diagram');
$('viewReel').onclick = () => setView('reel');
$('addWorkerBtn').onclick = () => openWorker(null);
$('saveTplBtn').onclick = saveProjectAsTemplate;
$('addFileBtn').onclick = () => $('fileInput').click();
$('fileInput').onchange = () => addSharedFiles($('fileInput').files);
// Restore + persist budget across sessions
(function initBudget() {
  const saved = localStorage.getItem('foundry-budget');
  if (saved) $('budgetInput').value = saved;
})();
$('budgetInput').oninput = () => {
  const v = $('budgetInput').value;
  if (v) localStorage.setItem('foundry-budget', v);
  else localStorage.removeItem('foundry-budget');
  updateStats();
};
$('npTemplate').onchange = syncTemplateParamsVis;
$('npBrowse').onclick = () => openBrowser('npCwd', $('npCwd').value);
$('browseUp').onclick = async () => {
  try {
    const q = browseCurrentPath ? '?path=' + encodeURIComponent(browseCurrentPath) : '';
    const r = await fetch('/api/browse' + q);
    const d = await r.json();
    browseTo(d.parent || '');
  } catch {}
};
$('browsePick').onclick = pickCurrentFolder;
document.querySelectorAll('#layoutBar button').forEach((b) => { b.onclick = () => setLayout(b.dataset.layout); });
$('npCreate').onclick = createProject;
$('wmSave').onclick = saveWorker;
$('wmEngine').onchange = syncEngineFields;
$('loopStart').onclick = startLoop;
$('tplNew').onclick = () => openTemplateEditor(null);
$('teSave').onclick = saveTemplate;
$('teAddRole').onclick = () => { editingTemplate.roles.push({ role: '', soul: '', model: '', reportsTo: '' }); renderTemplateRoles(); };
$('bcBtn').onclick = broadcast;
$('bcInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') broadcast(); });
document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = closeModals));
document.querySelectorAll('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) closeModals(); }));
document.querySelectorAll('#usagePeriod button').forEach((b) => {
  b.onclick = () => {
    usagePeriod = b.dataset.period;
    document.querySelectorAll('#usagePeriod button').forEach((x) => x.classList.toggle('on', x === b));
    renderUsage();
  };
});
document.querySelectorAll('.activity-tab').forEach((b) => {
  b.onclick = () => {
    activityFilter = b.dataset.tab;
    document.querySelectorAll('.activity-tab').forEach((x) => x.classList.toggle('on', x === b));
    renderActivity();
  };
});
$('accountBadge').onclick = openAccountModal;
$('acctLogout').onclick = async () => {
  if (!confirm('Log out of ' + (lastAccount?.email || 'current account') + '?\nCredentials will be backed up automatically.')) return;
  $('acctLogout').disabled = true; $('acctLogout').textContent = 'Backing up & logging out...';
  const r = await api('/api/account/logout', 'POST');
  $('acctLogout').disabled = false; $('acctLogout').textContent = 'Log out & backup';
  if (r.ok) { await fetchAccount(); openAccountModal(); }
  else { alert('Logout failed: ' + (r.error || 'unknown')); }
};
$('acctLogin').onclick = async () => {
  $('acctLogin').disabled = true; $('acctLogin').textContent = 'Opening browser login...';
  const r = await api('/api/account/login', 'POST');
  $('acctLogin').disabled = false; $('acctLogin').textContent = 'Log in to new account';
  if (r.ok) { await fetchAccount(); openAccountModal(); }
  else { alert('Login may need manual browser auth. Check your browser.'); await fetchAccount(); openAccountModal(); }
};

// Global keyboard: Cmd+K, Esc
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmdk(''); }
  if (e.key === 'Escape') { closeCmdk(); }
  // ⌘/Ctrl + .  → stop the focused worker (works even when typing)
  if ((e.metaKey || e.ctrlKey) && e.key === '.') { e.preventDefault(); if (focusedAgentId) stopRun(focusedAgentId); return; }
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable);
  if (typing) return;
  // 1–9 → jump to that worker in the active project (keyboard-first navigation)
  if (/^[1-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const list = projectAgents(); const a = list[parseInt(e.key, 10) - 1];
    if (a) { e.preventDefault(); focusAgent(a.id); }
  }
});
$('cmdkInput').addEventListener('input', () => { cmdkSelected = 0; renderCmdk(); });
$('cmdkInput').addEventListener('keydown', (e) => {
  const items = buildCmdkItems($('cmdkInput').value);
  if (e.key === 'ArrowDown') { e.preventDefault(); cmdkSelected = Math.min(cmdkSelected + 1, items.length - 1); renderCmdk(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); cmdkSelected = Math.max(cmdkSelected - 1, 0); renderCmdk(); }
  if (e.key === 'Enter') { e.preventDefault(); const it = items[cmdkSelected]; if (it) it.run(); }
});
$('cmdkOverlay').addEventListener('click', (e) => { if (e.target === $('cmdkOverlay')) closeCmdk(); });

// Refresh state on visibility change
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

// Boot
refresh();
fetchAccount();
