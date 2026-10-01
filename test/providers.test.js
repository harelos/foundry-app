'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseClaudeStatus, parseCodexStatus, classifyProviderFailure, findProviderFailure, alternateEngine } = require('../core/providers');

test('parses official provider status without exposing credentials', () => {
  const claude = parseClaudeStatus({ code: 0, stdout: JSON.stringify({ loggedIn: true, email: 'person@example.com', subscriptionType: 'max' }), stderr: '' });
  assert.deepEqual(claude, { connected: true, account: 'person@example.com', plan: 'max' });
  const codex = parseCodexStatus({ code: 0, stdout: 'Logged in using ChatGPT', stderr: '' });
  assert.equal(codex.connected, true);
  assert.equal(codex.plan, 'ChatGPT');
});

test('detects recoverable provider failures and chooses the alternate engine', () => {
  assert.equal(classifyProviderFailure("You've hit your weekly limit; resets at 10am"), 'plan_limit');
  assert.equal(classifyProviderFailure('Authentication required'), 'auth');
  assert.equal(alternateEngine('codex'), 'claude-code');
  assert.equal(alternateEngine('claude-code'), 'codex');
  assert.deepEqual(findProviderFailure({ type: 'assistant', message: { content: [{ type: 'text', text: "You've hit your weekly limit · resets 10am" }] } }), {
    kind: 'plan_limit',
    message: "You've hit your weekly limit · resets 10am",
  });
});
