(function () {
  'use strict';

  const root = document.getElementById('onboardingRoot');
  if (!root) return;

  const state = {
    step: 0,
    outcomes: [],
    outcomeId: 'campaign_review',
    provider: 'codex',
    providers: {},
    projectName: 'My first Foundry outcome',
    cwd: '',
    busy: false,
    error: '',
  };

  async function request(path, method, body) {
    const response = await fetch(path, {
      method: method || 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'Something went wrong'), { data });
    return data;
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function layout(content) {
    const progress = [0, 1, 2].map((n) => `<span class="${n <= state.step ? 'on' : ''}"></span>`).join('');
    root.innerHTML = `
      <div class="ob-shell">
        <aside class="ob-aside">
          <div class="ob-brand"><div class="ob-mark">F</div><div><strong>Foundry</strong><span>Work that leaves the chat</span></div></div>
          <div class="ob-aside-copy">
            <div class="ob-kicker">Your first outcome</div>
            <h1>Give the work a team, a folder, and a finish line.</h1>
            <p>Foundry uses the Claude or ChatGPT plan you already pay for. You stay in control of files, approvals, and what gets published.</p>
          </div>
          <div class="ob-truth">Desktop workers can act inside the folder you choose. Nothing is published or sent without your approval.</div>
        </aside>
        <main class="ob-main"><div class="ob-progress">${progress}</div>${content}</main>
      </div>`;
  }

  function renderProviders() {
    const cards = ['codex', 'claude'].map((id) => {
      const provider = state.providers[id] || { name: id === 'codex' ? 'Codex' : 'Claude', installed: false, connected: false };
      const action = provider.installed ? (provider.connected ? 'Connected' : 'Connect plan') : 'Install first';
      const description = id === 'codex'
        ? 'Uses your official ChatGPT / Codex login. Full file and command tools on desktop.'
        : 'Uses your official Claude Pro or Max login through Claude Code.';
      return `<section class="ob-provider ${state.provider === id ? 'selected' : ''}" data-provider-card="${id}">
        <div class="ob-provider-top"><div class="ob-provider-name">${esc(provider.name)}</div><div class="ob-status ${provider.connected ? 'ok' : ''}">${provider.connected ? 'Ready' : provider.installed ? 'Not connected' : 'Not installed'}</div></div>
        <p>${description}</p>
        <div class="ob-provider-actions">
          <button class="ob-button ${provider.connected ? 'secondary' : ''}" data-connect="${id}" ${provider.connected ? 'disabled' : ''}>${action}</button>
          <label class="ob-primary"><input type="radio" name="primaryProvider" value="${id}" ${state.provider === id ? 'checked' : ''}>Primary</label>
        </div>
      </section>`;
    }).join('');
    layout(`<section class="ob-step">
      <div class="ob-step-label">Step 1 of 3</div>
      <h2>Connect the plans you already use.</h2>
      <p class="ob-lead">Connect one to continue. Connect both and a worker can switch when one plan hits a usage limit, without losing the project or transcript.</p>
      <div class="ob-provider-grid">${cards}</div>
      <div class="ob-note">Foundry never asks you to paste a subscription token. Authentication stays with OpenAI and Anthropic.</div>
      <div class="ob-error">${esc(state.error)}</div>
      <div class="ob-footer"><span></span><button class="ob-button" id="obNext" ${Object.values(state.providers).some((p) => p.connected) ? '' : 'disabled'}>Choose an outcome</button></div>
    </section>`);

    root.querySelectorAll('input[name="primaryProvider"]').forEach((input) => {
      input.addEventListener('change', () => { state.provider = input.value; state.error = ''; renderProviders(); });
    });
    root.querySelectorAll('[data-connect]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.connect;
        const provider = state.providers[id];
        if (!provider.installed) {
          if (window.foundryDesktop) window.foundryDesktop.openExternal(provider.installUrl);
          else window.open(provider.installUrl, '_blank', 'noopener');
          state.error = `Install ${provider.name}, then return here and re-check.`;
          renderProviders();
          return;
        }
        button.disabled = true;
        button.textContent = 'Opening sign-in…';
        try {
          await request(`/api/providers/${id}/login`, 'POST');
          state.error = 'Complete sign-in in the window that opened. Foundry will re-check automatically.';
          renderProviders();
          await pollProviders(24);
        } catch (error) { state.error = error.message; renderProviders(); }
      });
    });
    document.getElementById('obNext').addEventListener('click', () => {
      if (!state.providers[state.provider] || !state.providers[state.provider].connected) {
        const connected = Object.values(state.providers).find((provider) => provider.connected);
        if (connected) state.provider = connected.id;
      }
      state.step = 1;
      state.error = '';
      renderOutcomes();
    });
  }

  async function refreshProviders() {
    const data = await request('/api/system/status');
    state.providers = data.providers || {};
    if (!state.providers[state.provider] || !state.providers[state.provider].connected) {
      const connected = Object.values(state.providers).find((provider) => provider.connected);
      if (connected) state.provider = connected.id;
    }
  }

  async function pollProviders(attempts) {
    for (let i = 0; i < attempts; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await refreshProviders();
      if (Object.values(state.providers).some((provider) => provider.connected)) {
        state.error = '';
        renderProviders();
        return;
      }
    }
    state.error = 'Sign-in is not complete yet. Finish it, then reopen Foundry or try again.';
    renderProviders();
  }

  function renderOutcomes() {
    const cards = state.outcomes.map((outcome) => `<button class="ob-outcome ${state.outcomeId === outcome.id ? 'selected' : ''}" data-outcome="${outcome.id}">
      <strong>${esc(outcome.name)}</strong><p>${esc(outcome.description)}</p><small>${esc(outcome.deliverable)} · ${outcome.workerCount} workers</small>
    </button>`).join('');
    layout(`<section class="ob-step">
      <div class="ob-step-label">Step 2 of 3</div>
      <h2>Start with one result, not a blank chat.</h2>
      <p class="ob-lead">Foundry will hire the smallest useful team and give it one reviewable deliverable. You can change the team after the first result.</p>
      <div class="ob-outcome-grid">${cards}</div>
      <div class="ob-footer"><button class="ob-back" id="obBack">Back</button><button class="ob-button" id="obNext">Choose workspace</button></div>
    </section>`);
    root.querySelectorAll('[data-outcome]').forEach((button) => button.addEventListener('click', () => {
      state.outcomeId = button.dataset.outcome;
      const outcome = state.outcomes.find((item) => item.id === state.outcomeId);
      state.projectName = outcome ? outcome.name : state.projectName;
      renderOutcomes();
    }));
    document.getElementById('obBack').addEventListener('click', () => { state.step = 0; renderProviders(); });
    document.getElementById('obNext').addEventListener('click', () => { state.step = 2; renderWorkspace(); });
  }

  function renderWorkspace() {
    const outcome = state.outcomes.find((item) => item.id === state.outcomeId) || state.outcomes[0];
    layout(`<section class="ob-step">
      <div class="ob-step-label">Step 3 of 3</div>
      <h2>Choose where the work will live.</h2>
      <p class="ob-lead">Desktop workers can read and edit only the workspace you give them. Foundry starts in review-first mode and asks before sensitive actions.</p>
      <div class="ob-form">
        <div class="ob-field"><label>Project name</label><input id="obProjectName" value="${esc(state.projectName)}"></div>
        <div class="ob-field"><label>Workspace folder</label><div class="ob-folder-row"><input id="obCwd" value="${esc(state.cwd)}" placeholder="Foundry will create a local workspace"><button class="ob-button secondary" id="obBrowse">Choose folder</button></div></div>
      </div>
      <div class="ob-team-preview"><strong>Your starting team</strong>
        <div class="ob-team-row"><span>Outcome lead</span><span>${esc(outcome ? outcome.name : '')}</span></div>
        <div class="ob-team-row"><span>Specialist</span><span>Evidence and execution</span></div>
        <div class="ob-team-row"><span>Finish line</span><span>${esc(outcome ? outcome.deliverable : '')}</span></div>
      </div>
      <div class="ob-plan"><b>14 days of Pro included</b><span>No card. After that, Free Local keeps one project and two workers.</span></div>
      <div class="ob-error">${esc(state.error)}</div>
      <div class="ob-footer"><button class="ob-back" id="obBack">Back</button><button class="ob-button" id="obCreate" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Building your team…' : 'Create my Foundry'}</button></div>
    </section>`);
    document.getElementById('obProjectName').addEventListener('input', (event) => { state.projectName = event.target.value; });
    document.getElementById('obCwd').addEventListener('input', (event) => { state.cwd = event.target.value; });
    document.getElementById('obBrowse').addEventListener('click', async () => {
      if (!window.foundryDesktop || !window.foundryDesktop.pickFolder) {
        state.error = 'Folder selection is available in the desktop app. You can type a path here in development mode.';
        renderWorkspace();
        return;
      }
      const selected = await window.foundryDesktop.pickFolder();
      if (selected) { state.cwd = selected; renderWorkspace(); }
    });
    document.getElementById('obBack').addEventListener('click', () => { state.step = 1; renderOutcomes(); });
    document.getElementById('obCreate').addEventListener('click', complete);
  }

  async function complete() {
    state.busy = true;
    state.error = '';
    renderWorkspace();
    try {
      await request('/api/onboarding/complete', 'POST', {
        provider: state.provider,
        outcomeId: state.outcomeId,
        projectName: state.projectName.trim(),
        cwd: state.cwd.trim(),
      });
      root.innerHTML = '';
      window.location.reload();
    } catch (error) {
      state.busy = false;
      state.error = error.message;
      renderWorkspace();
    }
  }

  async function boot() {
    try {
      const onboarding = await request('/api/onboarding');
      if (onboarding.onboarded) return;
      state.outcomes = onboarding.outcomes || [];
      await refreshProviders();
      renderProviders();
    } catch (error) {
      layout(`<section class="ob-step"><div class="ob-step-label">Startup check</div><h2>Foundry could not finish setup.</h2><p class="ob-lead">${esc(error.message)}</p><button class="ob-button" id="obRetry">Try again</button></section>`);
      document.getElementById('obRetry').addEventListener('click', boot);
    }
  }

  boot();
})();
