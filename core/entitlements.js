'use strict';

const TRIAL_DAYS = 14;

const TIERS = {
  free: {
    id: 'free',
    name: 'Free Local',
    projectLimit: 1,
    workerLimit: 2,
    schedules: false,
    council: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    projectLimit: 10,
    workerLimit: 8,
    schedules: true,
    council: true,
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    projectLimit: 50,
    workerLimit: 20,
    schedules: true,
    council: true,
  },
};

function ensureMeta(meta = {}, now = Date.now()) {
  if (!meta.installId) meta.installId = require('crypto').randomUUID();
  if (!meta.installedAt) meta.installedAt = now;
  return meta;
}

function startTrial(meta, now = Date.now()) {
  ensureMeta(meta, now);
  if (!meta.trialStartedAt) meta.trialStartedAt = now;
  return meta;
}

function entitlementFor(meta = {}, now = Date.now(), override = process.env.MC_LICENSE_TIER) {
  if (override && TIERS[override]) return { ...TIERS[override], source: 'override', trial: false };
  if (meta.licenseTier && TIERS[meta.licenseTier]) return { ...TIERS[meta.licenseTier], source: 'license', trial: false };
  const started = Number(meta.trialStartedAt || 0);
  const trialEndsAt = started ? started + TRIAL_DAYS * 86400000 : 0;
  if (started && now < trialEndsAt) {
    return { ...TIERS.pro, source: 'trial', trial: true, trialEndsAt };
  }
  return { ...TIERS.free, source: 'free', trial: false, trialEndsAt: trialEndsAt || null };
}

function canCreateProject(meta, projectCount, now) {
  const entitlement = entitlementFor(meta, now);
  return { allowed: projectCount < entitlement.projectLimit, entitlement };
}

function canCreateWorker(meta, workerCount, now) {
  const entitlement = entitlementFor(meta, now);
  return { allowed: workerCount < entitlement.workerLimit, entitlement };
}

module.exports = { TRIAL_DAYS, TIERS, ensureMeta, startTrial, entitlementFor, canCreateProject, canCreateWorker };
