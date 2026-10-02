'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

// Evaluate the REAL runtime functions without booting the private server,
// opening its state/vault, or launching any provider. The runner supplies an
// isolated, patched source file; --baseline supplies the original for red tests.
const source = fs.readFileSync(process.env.FOUNDRY_TURN_TEST_SOURCE || require('node:path').join(__dirname, '../server.js'), 'utf8');
function slice(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a, 'runtime source markers exist: ' + start);
  return source.slice(a, b);
}
function harness() {
  let clock = 10000, nextPid = 200, saved = 0;
  const alive = new Set(), children = [], timers = [];
  let resolveExe = () => Promise.resolve('/fixture/codex');
  class Child extends EventEmitter {
    constructor(command, args) {
      super(); this.pid = nextPid++; this.exitCode = null; this.signalCode = null;
      this.command = command; this.args = args; this.stdout = new EventEmitter(); this.stderr = new EventEmitter();
      this.stdin = new EventEmitter(); this.input = '';
      this.stdin.write = value => { this.input += value; }; this.stdin.end = () => {};
      alive.add(this.pid); children.push(this);
    }
    close(code = 0) { alive.delete(this.pid); this.exitCode = code; this.emit('close', code); }
    json(evt) { this.stdout.emit('data', Buffer.from(JSON.stringify(evt) + '\n')); }
  }
  const agents = new Map();
  const context = vm.createContext({
    Buffer, AbortController, Map, Set, WeakMap, Promise, console,
    Date: class extends Date { static now() { return clock; } },
    process: { pid: 1, platform: 'linux', env: { MC_CLAUDE_MAX: '1' }, kill(pid, signal) {
      if (!alive.has(pid)) { const error = new Error('ESRCH'); error.code = 'ESRCH'; throw error; }
      // Sending a signal is not proof the child has closed. Tests close it explicitly.
      if (signal) children.find(c => c.pid === pid).killRequested = true;
    } },
    require(name) { assert.equal(name, 'child_process'); return { execFileSync: () => '' }; },
    setTimeout(fn, ms) { const t = { fn, at: clock + ms }; timers.push(t); return t; },
    agents, state: { accountControlPlane: {} },
    spawn: (command, args) => new Child(command, args),
    randomUUID: () => 'fixture-' + nextPid++,
    saveData: () => { saved++; }, pushMsg: (a, m) => a.transcript.push(m), send: () => {},
    accountById: () => null, foundryVault: { envForAgent: () => ({}) },
    buildTurnPrompt: (a, text) => text, PERMISSION_MODE: 'default',
    resolveAgentWorkingDirectory: () => '/fixture', resolveCodexExe: () => resolveExe(),
    currentEngineSession: a => a.codexThread || 'fixture-thread',
    rememberEngineSession: (a, engine, id) => { a.codexThread = id; },
    currentSession: () => null, agentMcpConfigFile: () => '',
    handleEvent: (a, evt) => { a.transcript.push(evt); },
    resolveWorkflow: () => 'auto', prepareSkillSelection: () => [],
    queueHistoryBridge: () => {}, acctKey: a => a.accountId || 'machine',
    normalizeWorkflow: () => 'auto', projectAgents: () => [], controlLedgerEvent: () => {},
    accountControl: { createAccountControlPlane: value => value },
    modelRoutingDeps: () => ({}), modelCouncil: {
      normalizeAgentBody(a, b) {
        if ((b.model || '').startsWith('gpt-')) { b.engine = 'codex'; b.codexModel = b.model; delete b.model; }
      },
      applyModelChoice(a, model) { a.engine = model.startsWith('gpt-') ? 'codex' : 'claude-code'; a.codexModel = model; },
    },
    loopTick: () => ({ continue: false }),
  });
  vm.runInContext(slice('// ---------- Run a turn ----------', '// Pull image/video URLs') + '\n' +
    slice('async function runCodexTurn(', '// ---------- Hermes turn') + '\n' +
    slice('function agentActivity(', 'function projectAgents(') + '\n' +
    `globalThis.api = { runTurn, processServerQueue, stopAgent, childIsAlive, agentActivity,
      acquireClaudeSlot, releaseClaudeSlot,
      slots: _claudeSlots, waiters: _claudeWaiters,
      queueRuntimeEdit: typeof queueRuntimeEdit === 'function' ? queueRuntimeEdit : null,
      applyAgentEdit: typeof applyAgentEdit === 'function' ? applyAgentEdit : null };`, context);
  function agent(engine = 'codex') {
    const a = { id: 'agent-' + agents.size, engine, cwd: '/fixture', busy: false, transcript: [], queue: [],
      totals: { turns: 0, history: [] }, loop: { active: false } };
    agents.set(a.id, a); return a;
  }
  const response = () => ({ writeHead() {}, write() {}, end() { this.ended = true; } });
  return { ...context.api, agent, children, agents, response, alive,
    get saves() { return saved; },
    deferExe() { let resolve; resolveExe = () => new Promise(r => { resolve = r; }); return () => resolve('/fixture/codex'); },
    advance(ms) {
      clock += ms;
      const due = timers.filter(t => t.at <= clock);
      for (const t of due) { timers.splice(timers.indexOf(t), 1); t.fn(); }
    },
  };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('queue drain cannot start Codex while a live child exists despite a false busy flag', async () => {
  const h = harness(), a = h.agent();
  h.runTurn(a, 'original', h.response()); await flush();
  a.queue.push({ id: 'follow-up', text: 'do not lose me' }); a.busy = false;
  h.processServerQueue(a); await flush();
  assert.equal(h.children.length, 1);
  assert.equal(a.queue.length, 1);
  h.children[0].close(); h.processServerQueue(a); await flush();
  assert.equal(h.children.length, 2);
  assert.match(h.children[1].input, /do not lose me/);
  h.children[1].close();
});

test('stop cancels a Claude waiter before engine switch and cannot spawn stale Claude later', async () => {
  const h = harness(), holder = h.agent('claude-code'), waiter = h.agent('claude-code');
  h.runTurn(holder, 'occupy slot', h.response()); await flush();
  h.runTurn(waiter, 'old task', h.response()); await flush();
  assert.equal(waiter.waitingForSlot, true);
  if (h.queueRuntimeEdit) h.queueRuntimeEdit(waiter, { engine: 'codex', codexModel: 'gpt-5.6-terra' });
  else waiter.engine = 'codex'; // Baseline /edit mutates the busy agent immediately.
  h.stopAgent(waiter);
  waiter.haltQueue = false;
  h.runTurn(waiter, 'new task', h.response()); await flush();
  assert.equal(waiter.waitingForSlot, false);
  assert.doesNotMatch(h.agentActivity(waiter), /Claude slot/);
  const codex = h.children.find(c => c.command === '/fixture/codex');
  h.children[0].close(); await flush();
  assert.equal(h.children.length, 2, 'cancelled waiter never spawns');
  assert.equal(waiter.child, codex);
  assert.equal(waiter.busy, true);
  assert.equal(h.slots.get('claude:machine'), 0);
  codex.close();
});

test('resume writer conflict preserves exact queue head and retries in order after backoff', async () => {
  const h = harness(), a = h.agent();
  const first = { id: 'first', text: 'first task', urgent: true, workflow: 'auto', metadata: 'preserve' };
  a.queue.push(first, { id: 'second', text: 'second task' });
  h.processServerQueue(a); await flush();
  h.children[0].json({ type: 'turn.failed', error: { message: 'thread-store conflict: thread fixture already has an active writer (code -32600)' } });
  h.children[0].close(1);
  assert.equal(a.queue[0], first);
  assert.equal(a.queue[1].id, 'second');
  assert.ok(h.saves > 0, 'requeue persisted');
  h.processServerQueue(a); await flush(); assert.equal(h.children.length, 1, 'no hot retry loop');
  h.advance(1000); h.processServerQueue(a); await flush();
  assert.equal(h.children.length, 2);
  assert.match(h.children[1].input, /first task/);
  h.children[1].close(); h.processServerQueue(a); await flush();
  assert.match(h.children[2].input, /second task/); h.children[2].close();
});

test('direct message conflict from stderr is durable, not only queued messages', async () => {
  const h = harness(), a = h.agent();
  h.runTurn(a, 'direct task', h.response()); await flush();
  h.children[0].stderr.emit('data', 'session fixture is already running'); h.children[0].close(1);
  assert.equal(a.queue[0]?.text, 'direct task');
  assert.equal(a.transcript.some(m => m.role === 'error'), false);
});

test('stop never detaches a still-alive child on its three-second failsafe', async () => {
  const h = harness(), a = h.agent();
  h.runTurn(a, 'running', h.response()); await flush(); const child = h.children[0];
  h.stopAgent(a); child.killed = true; h.advance(3000);
  assert.equal(h.childIsAlive(child), true, 'kill requested is not exit');
  assert.equal(a.child, child);
  assert.equal(a.busy, true);
  h.runTurn(a, 'new work', h.response()); await flush();
  assert.equal(h.children.length, 1);
  assert.equal(a.queue[0].text, 'new work');
  child.close(1); assert.equal(a.child, null);
});

test('stop during asynchronous Codex resolution prevents its stale launch', async () => {
  const h = harness(), a = h.agent(), resolve = h.deferExe();
  h.runTurn(a, 'cancel before spawn', h.response()); h.stopAgent(a);
  resolve(); await flush();
  assert.equal(h.children.length, 0);
  assert.equal(a.busy, false);
});

test('slot granted then stopped before promise callback is released exactly once', async () => {
  const h = harness(), a = h.agent('claude-code');
  h.runTurn(a, 'never launch', h.response());
  assert.equal(h.slots.get('claude:machine'), 1);
  h.stopAgent(a); await flush();
  assert.equal(h.children.length, 0);
  assert.equal(h.slots.get('claude:machine'), 0);
});

test('late Claude close/error/output cannot clear or corrupt a newer Codex turn', async () => {
  const h = harness(), a = h.agent('claude-code');
  h.runTurn(a, 'Claude', h.response()); await flush(); const old = h.children[0];
  h.stopAgent(a); old.close(1);
  a.engine = 'codex'; a.haltQueue = false;
  h.runTurn(a, 'Codex', h.response()); await flush(); const current = h.children[1];
  const count = a.transcript.length;
  old.stdout.emit('data', '{"type":"late-output"}\n'); old.emit('error', new Error('late error')); old.emit('close', 1);
  assert.equal(a.child, current); assert.equal(a.busy, true); assert.equal(a.transcript.length, count);
  current.close();
});

test('busy edit retains current routing and announces the next engine, then applies on the next turn', async () => {
  const h = harness(), a = h.agent('claude-code');
  h.runTurn(a, 'old', h.response()); await flush();
  const body = { engine: 'codex', codexModel: 'gpt-5.6-terra', accountId: 'next-account' };
  assert.ok(h.queueRuntimeEdit, 'route must stage edits');
  h.queueRuntimeEdit(a, body);
  assert.equal(a.engine, 'claude-code'); assert.equal(a.accountId, undefined);
  assert.match(h.agentActivity(a), /next turn: gpt-5.6-terra/);
  h.children[0].close();
  h.runTurn(a, 'new', h.response()); await flush();
  assert.equal(a.engine, 'codex'); assert.equal(a.accountId, 'next-account');
  assert.ok(h.children[1].args.includes('gpt-5.6-terra')); h.children[1].close();
});

test('model-picker changes are also deferred and survive a stop', async () => {
  const h = harness(), a = h.agent('claude-code');
  h.runTurn(a, 'old', h.response()); await flush();
  assert.ok(h.queueRuntimeEdit);
  h.queueRuntimeEdit(a, { model: 'gpt-5.6-sol' }, true);
  assert.equal(a.engine, 'claude-code');
  h.stopAgent(a); h.children[0].close(1); a.haltQueue = false;
  h.runTurn(a, 'new', h.response()); await flush();
  assert.equal(a.engine, 'codex'); assert.ok(h.children[1].args.includes('gpt-5.6-sol'));
  h.children[1].close();
});

test('non-conflict failures are not retried as writer conflicts', async () => {
  const h = harness(), a = h.agent();
  h.runTurn(a, 'task', h.response()); await flush();
  h.children[0].json({ type: 'turn.failed', error: { message: 'model unavailable' } }); h.children[0].close(1);
  assert.equal(a.queue.length, 0); assert.equal(a.transcript.at(-1).text, 'model unavailable');
});

test('top-level writer conflict retries even if the CLI exits with zero', async () => {
  const h = harness(), a = h.agent();
  h.runTurn(a, 'preserve despite exit zero', h.response()); await flush();
  h.children[0].json({ type: 'error', message: 'thread-store conflict: already has an active writer' });
  h.children[0].close(0);
  assert.equal(a.queue[0]?.text, 'preserve despite exit zero');
});

test('a conflict mentioned after productive work never replays a possibly completed action', async () => {
  const h = harness(), a = h.agent();
  h.runTurn(a, 'write a file', h.response()); await flush();
  h.children[0].json({ type: 'item.started', item: { type: 'command_execution', command: 'fixture write' } });
  h.children[0].json({ type: 'turn.failed', error: { message: 'thread-store conflict: already has an active writer' } });
  h.children[0].close(1);
  assert.equal(a.queue.length, 0, 'uncertain work must not be automatically replayed');
  assert.equal(a.transcript.at(-1).role, 'error');
});

test('repeat conflicts retain the same message and never advance the queue', async () => {
  const h = harness(), a = h.agent();
  const first = { id: 'first', text: 'first task' };
  a.queue.push(first, { id: 'second', text: 'second task' });
  for (let i = 0; i < 5; i++) {
    h.processServerQueue(a); await flush();
    h.children[i].stderr.emit('data', 'thread fixture already has an active writer');
    h.children[i].close(1);
    assert.equal(a.queue[0], first); assert.equal(a.queue.length, 2);
    h.advance(30000);
  }
  assert.equal(first.resumeConflictAttempts, 5);
});

test('cancelled middle waiter does not consume another agent slot or disturb FIFO', async () => {
  const h = harness(), a = h.agent('claude-code'), b = h.agent('claude-code'), c = h.agent('claude-code');
  h.runTurn(a, 'first', h.response()); h.runTurn(b, 'cancelled', h.response()); h.runTurn(c, 'third', h.response());
  await flush(); h.stopAgent(b); await flush();
  assert.equal(h.slots.get('claude:machine'), 1);
  h.children[0].close(); await flush();
  assert.equal(h.children.length, 2); assert.equal(c.child, h.children[1]); assert.equal(b.child, null);
  assert.equal(h.slots.get('claude:machine'), 1);
  h.children[1].close(); assert.equal(h.slots.get('claude:machine'), 0);
});

test('a restored live PID prevents queue drain even without a child handle', async () => {
  const h = harness(), a = h.agent(); a.activePid = 999; h.alive.add(999);
  a.queue.push({ id: 'next', text: 'saved' });
  h.processServerQueue(a); await flush();
  assert.equal(h.children.length, 0); assert.equal(a.queue.length, 1);
  h.alive.delete(999); h.processServerQueue(a); await flush();
  assert.equal(h.children.length, 1); h.children[0].close();
});

test('route guards and durable fields are wired into the actual server source', () => {
  assert.match(source, /queueRuntimeEdit\(agent, b, true\)/);
  assert.match(source, /queueRuntimeEdit\(agent, b\)/);
  assert.match(source, /if \(agent.busy \|\| agentHasTurn\(agent\)\) return json\(res, 409/);
  assert.match(source, /pendingRuntimeEdits: a.pendingRuntimeEdits/);
  assert.match(source, /resumeRetryAt: a.resumeRetryAt/);
});
