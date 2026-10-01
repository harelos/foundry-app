'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitFor(url, token) {
  for (let i = 0; i < 60; i += 1) {
    try { if ((await fetch(`${url}/api/health`, { headers: { 'x-foundry-token': token } })).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('server did not start');
}

test('server stays on loopback and never serializes agent keys', async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-test-'));
  const projectDir = path.join(dataDir, 'workspace');
  fs.mkdirSync(projectDir);
  const port = await freePort();
  const token = 'local_test_session_123';
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      MC_PORT: String(port),
      MC_HOST: '127.0.0.1',
      MC_DATA_DIR: dataDir,
      MC_PROJECT_DIR: projectDir,
      MC_LICENSE_TIER: 'pro',
      MC_LOCAL_TOKEN: token,
    },
    stdio: 'ignore',
  });
  t.after(() => { try { child.kill('SIGKILL'); } catch {} fs.rmSync(dataDir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${port}`;
  await waitFor(base, token);

  assert.equal((await fetch(`${base}/api/state`)).status, 401);
  const cookie = `foundry_session=${token}`;

  let response = await fetch(`${base}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ name: 'QA', cwd: projectDir }),
  });
  const created = await response.json();
  const project = created.projects.find((item) => item.name === 'QA');
  const sentinel = 'qa_dummy_secret_do_not_use_123456';
  response = await fetch(`${base}/api/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ projectId: project.id, name: 'QA', engine: 'api', apiKey: sentinel }),
  });
  assert.equal(response.status, 400);
  const rejected = await response.json();
  assert.equal(rejected.code, 'engine_not_allowed');
  assert.equal(fs.readFileSync(path.join(dataDir, 'data.json'), 'utf8').includes(sentinel), false);

  response = await fetch(`${base}/api/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ projectId: project.id, name: 'QA', engine: 'codex', codexApiKey: sentinel }),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'raw_token_rejected');

  response = await fetch(`${base}/api/missions/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      mission: {
        schema: 'foundry.mission.v1',
        project: { name: 'Imported client job', outcomeId: 'campaign_review' },
        objective: 'Prepare a reviewable campaign pack.',
        evidenceNotes: 'Use only supplied facts.',
        constraints: 'Do not publish.',
        attachments: [],
      },
    }),
  });
  const imported = await response.json();
  assert.equal(imported.ok, true);
  assert.equal(imported.project.mission.status, 'ready');
  assert.equal(imported.state.agents.filter((agent) => agent.projectId === imported.project.id).length, 2);

  const status = await fetch(`${base}/api/health`, { headers: { 'x-foundry-token': token } });
  assert.equal(status.headers.get('x-frame-options'), 'DENY');
});
