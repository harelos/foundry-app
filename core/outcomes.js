'use strict';

const OUTCOMES = {
  campaign_review: {
    id: 'campaign_review',
    name: 'Client campaign review',
    description: 'Turn campaign evidence into a client-ready review and next-week action plan.',
    deliverable: 'CAMPAIGN_REVIEW.md',
    workers: [
      {
        role: 'Campaign Lead',
        soul: 'Own the client outcome. Read the available evidence, identify the decision that matters, delegate one focused analysis, and assemble a concise campaign review with claims tied to evidence. Never invent metrics.',
      },
      {
        role: 'Evidence Analyst',
        reportsTo: 'Campaign Lead',
        soul: 'Audit the supplied files and data. Separate observed facts, calculations, unknowns, and recommendations. Return a compact evidence table and flag every unsupported claim.',
      },
    ],
  },
  landing_page: {
    id: 'landing_page',
    name: 'Landing page launch',
    description: 'Build and review a conversion-focused landing page from an existing offer.',
    deliverable: 'LANDING_PAGE_HANDOFF.md',
    workers: [
      {
        role: 'Conversion Lead',
        soul: 'Turn the offer and customer evidence into a focused landing page. Keep one promise, one audience, and one conversion goal. Coordinate copy, implementation, and review without inventing proof.',
      },
      {
        role: 'Page Builder',
        reportsTo: 'Conversion Lead',
        soul: 'Implement the approved page inside the project folder. Follow the existing stack, preserve current behavior, test responsive layouts, and leave a clear verification note.',
      },
    ],
  },
  weekly_ops: {
    id: 'weekly_ops',
    name: 'Weekly operations review',
    description: 'Convert scattered notes and numbers into priorities, owners, and next actions.',
    deliverable: 'WEEKLY_OPERATING_REVIEW.md',
    workers: [
      {
        role: 'Operations Lead',
        soul: 'Create one truthful weekly operating review: outcomes, blockers, decisions, owners, and next deadlines. Reduce work in progress and surface decisions that need the owner.',
      },
      {
        role: 'Operations Analyst',
        reportsTo: 'Operations Lead',
        soul: 'Inspect the supplied evidence, reconcile contradictions, and prepare a short factual ledger of what moved, what stalled, and what is unknown.',
      },
    ],
  },
  content_sprint: {
    id: 'content_sprint',
    name: 'Content sprint',
    description: 'Produce a reviewed week of content from one offer and one audience insight.',
    deliverable: 'CONTENT_SPRINT.md',
    workers: [
      {
        role: 'Content Lead',
        soul: 'Own a coherent content sprint tied to one business goal. Use the source material, select a small set of angles, and review every asset for specificity and factual accuracy.',
      },
      {
        role: 'Content Producer',
        reportsTo: 'Content Lead',
        soul: 'Draft the assigned assets in the brand voice. Prefer concrete observations and useful demonstrations. Do not invent testimonials, metrics, or product facts.',
      },
    ],
  },
  store_audit: {
    id: 'store_audit',
    name: 'Store conversion audit',
    description: 'Find the highest-confidence conversion blockers and ship a ranked action plan.',
    deliverable: 'STORE_AUDIT.md',
    workers: [
      {
        role: 'Audit Lead',
        soul: 'Own a practical conversion audit. Prioritize observed friction by confidence, expected impact, and effort. Distinguish evidence from inference and avoid redesigning unrelated areas.',
      },
      {
        role: 'Journey Reviewer',
        reportsTo: 'Audit Lead',
        soul: 'Review the customer journey and supplied evidence. Capture reproducible issues with location, consequence, evidence, and a narrow recommended change.',
      },
    ],
  },
};

function getOutcome(id) {
  return OUTCOMES[id] || null;
}

function publicOutcomes() {
  return Object.values(OUTCOMES).map(({ workers, ...outcome }) => ({ ...outcome, workerCount: workers.length }));
}

module.exports = { OUTCOMES, getOutcome, publicOutcomes };
