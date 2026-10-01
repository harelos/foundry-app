'use strict';

const { spawn } = require('child_process');

const PROVIDERS = {
  claude: {
    id: 'claude',
    name: 'Claude',
    command: 'claude',
    versionArgs: ['--version'],
    statusArgs: ['auth', 'status', '--json'],
    loginArgs: ['auth', 'login', '--claudeai'],
    engine: 'claude-code',
    installUrl: 'https://code.claude.com/docs/en/getting-started',
  },
  codex: {
    id: 'codex',
    name: 'Codex',
    command: 'codex',
    versionArgs: ['--version'],
    statusArgs: ['login', 'status'],
    loginArgs: ['login', '--device-auth'],
    engine: 'codex',
    installUrl: 'https://developers.openai.com/codex/cli/',
  },
};

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, {
        shell: false,
        windowsHide: true,
        env: options.env || process.env,
      });
    } catch (error) {
      return resolve({ code: -1, stdout: '', stderr: error.message, error: error.message });
    }
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      try { child.kill(); } catch {}
    }, options.timeout || 10000);
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr, error: error.message });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code == null ? -1 : code, stdout, stderr });
    });
  });
}

function providerCommand(id) {
  const provider = PROVIDERS[id];
  if (!provider) throw new Error('Unknown provider');
  return provider.command;
}

function parseClaudeStatus(result) {
  const raw = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    const data = JSON.parse(match ? match[0] : '{}');
    return {
      connected: !!(data.loggedIn ?? data.authenticated ?? data.email),
      account: data.email || (data.account && data.account.email) || null,
      plan: data.subscriptionType || data.plan || null,
    };
  } catch {
    return { connected: result.code === 0 && /logged|authenticated|claude\.ai/i.test(raw), account: null, plan: null };
  }
}

function parseCodexStatus(result) {
  const raw = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
  return {
    connected: result.code === 0 && /logged in|authenticated|chatgpt/i.test(raw) && !/not logged|unauthenticated/i.test(raw),
    account: null,
    plan: /chatgpt/i.test(raw) ? 'ChatGPT' : null,
  };
}

async function providerStatus(id) {
  const provider = PROVIDERS[id];
  if (!provider) throw new Error('Unknown provider');
  const version = await runCommand(provider.command, provider.versionArgs, { timeout: 7000 });
  if (version.code !== 0) {
    return { id, name: provider.name, installed: false, connected: false, version: null, installUrl: provider.installUrl };
  }
  const auth = await runCommand(provider.command, provider.statusArgs, { timeout: 10000 });
  const parsed = id === 'claude' ? parseClaudeStatus(auth) : parseCodexStatus(auth);
  return {
    id,
    name: provider.name,
    installed: true,
    version: (version.stdout || version.stderr).trim().split(/\r?\n/)[0] || null,
    installUrl: provider.installUrl,
    ...parsed,
  };
}

async function allProviderStatuses() {
  const values = await Promise.all(Object.keys(PROVIDERS).map(providerStatus));
  return Object.fromEntries(values.map((value) => [value.id, value]));
}

function launchProviderLogin(id) {
  const provider = PROVIDERS[id];
  if (!provider) throw new Error('Unknown provider');
  if (process.platform === 'win32') {
    const quoted = [provider.command, ...provider.loginArgs].map((part) => /\s/.test(part) ? `"${part}"` : part).join(' ');
    const child = spawn('cmd.exe', ['/d', '/s', '/c', `start "Foundry sign in" cmd.exe /k ${quoted}`], {
      detached: true,
      windowsHide: false,
      stdio: 'ignore',
    });
    child.unref();
  } else {
    const child = spawn(provider.command, provider.loginArgs, { detached: true, stdio: 'ignore' });
    child.unref();
  }
  return { ok: true, provider: id };
}

function classifyProviderFailure(message = '') {
  const text = String(message);
  if (/weekly limit|usage limit|rate.?limit|quota|too many requests|resets? at/i.test(text)) return 'plan_limit';
  if (/not logged|unauthenticated|authentication|authorize|login required|401/i.test(text)) return 'auth';
  if (/not found|ENOENT|is not recognized|command not found/i.test(text)) return 'not_installed';
  if (/network|ECONN|ETIMEDOUT|fetch failed|offline/i.test(text)) return 'network';
  return 'unknown';
}

function findProviderFailure(value, depth = 0) {
  if (depth > 6 || value == null) return null;
  if (typeof value === 'string') {
    const kind = classifyProviderFailure(value);
    return kind === 'unknown' ? null : { kind, message: value };
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProviderFailure(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === 'object') {
    for (const item of Object.values(value)) {
      const found = findProviderFailure(item, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function alternateEngine(engine) {
  return engine === 'codex' ? 'claude-code' : 'codex';
}

module.exports = {
  PROVIDERS,
  runCommand,
  parseClaudeStatus,
  parseCodexStatus,
  providerStatus,
  allProviderStatuses,
  launchProviderLogin,
  classifyProviderFailure,
  findProviderFailure,
  alternateEngine,
  providerCommand,
};
