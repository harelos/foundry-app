'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TRIAL_DAYS, startTrial, entitlementFor, canCreateProject, canCreateWorker } = require('../core/entitlements');

test('trial starts once and exposes Pro limits for fourteen days', () => {
  const now = Date.UTC(2026, 9, 1);
  const meta = {};
  startTrial(meta, now);
  startTrial(meta, now + 1000);
  assert.equal(meta.trialStartedAt, now);
  const entitlement = entitlementFor(meta, now + 13 * 86400000);
  assert.equal(entitlement.id, 'pro');
  assert.equal(entitlement.trial, true);
  assert.equal(entitlement.trialEndsAt, now + TRIAL_DAYS * 86400000);
});

test('expired trial falls back to useful Free Local limits', () => {
  const now = Date.UTC(2026, 9, 1);
  const meta = { trialStartedAt: now - 15 * 86400000 };
  assert.equal(entitlementFor(meta, now).id, 'free');
  assert.equal(canCreateProject(meta, 0, now).allowed, true);
  assert.equal(canCreateProject(meta, 1, now).allowed, false);
  assert.equal(canCreateWorker(meta, 1, now).allowed, true);
  assert.equal(canCreateWorker(meta, 2, now).allowed, false);
});
