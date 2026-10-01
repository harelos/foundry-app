# Foundry Product Launch Brief

## Product decision

Foundry is not another model chat, coding IDE, or generic multi-agent dashboard.
It is an outcome operating system for time-poor, non-technical business operators
who want an AI team but do not want to design prompts, orchestration graphs, skills,
or approval logic themselves.

The product promise is: choose a business outcome, connect an eligible AI plan, and
receive a supervised team, a visible plan, and reviewable deliverables.

## Primary launch customer

The first paid audience is US owner-operators and small agency/e-commerce teams with
an existing ChatGPT Plus/Pro or Claude Pro/Max subscription. They already use AI but
their work is trapped in scattered chats, unfinished drafts, and repetitive prompting.
They value speed to a finished campaign, page, client deliverable, or weekly operating
report more than access to another model.

Do not target software engineers first. They already have strong native tools and can
assemble orchestration themselves.

## Product surfaces

### Desktop

- The full product. Agents can use local folders and approved tools.
- Installable application with a real Windows installer.
- First-run connection to the official Codex CLI and/or Claude Code.
- Official provider browser login flows only. Never ask users to paste subscription tokens.
- Default safety mode requires approval for consequential actions.
- Local credentials stay in provider-owned storage or OS-protected storage.

### Web

- Public sales site plus a useful planning/chat workspace.
- Web sessions can plan, research, draft, and prepare a mission.
- Web must state clearly that it cannot operate the user's computer or local files.
- A mission can be handed to the desktop app through an explicit export/import flow.
- No fake local execution and no hidden remote-control promise.

## Authentication truth

- Claude Code supports browser login with eligible paid Claude accounts.
- Codex supports ChatGPT account login through the official Codex tooling.
- OpenAI's new Sign in with ChatGPT plan-usage DevKit is currently noncommercial for
  open-source use; commercial partner access is limited. Keep a future adapter boundary,
  but do not ship its noncommercial SDK in the paid product.
- API-key providers remain an advanced, optional path.

## Activation flow

1. Install Foundry Desktop.
2. Connect ChatGPT, Claude, or both through the official provider flow.
3. Choose one result, not a department: Launch a campaign, Build a landing page,
   Prepare a client delivery, Audit a store, or Run my weekly operations review.
4. Answer a short evidence-based intake.
5. Foundry creates the minimum team and a proposed plan.
6. The user approves the plan and working folder.
7. Agents execute with visible ownership and checkpoints.
8. Foundry presents a deliverable and a plain-language completion report.

The activation event is a reviewed deliverable, not creating an agent or sending a chat.

## Commercial model to validate

- Free Local: connect one provider, one active project, two workers, three outcome
  blueprints, manual runs, local-only storage.
- Pro: USD 29/month or USD 249/year. Unlimited projects, eight active workers,
  schedules, skills, approvals, Model Council, reusable workflows, and priority updates.
- Studio: USD 79/month. Twenty workers, shared blueprints, client workspaces, handoff
  exports, and team reporting. Do not build billing until activation is proven.
- No separate AI-credit trial is required when users bring an eligible subscription.
  Trial the paid orchestration features for 14 days without a card.

## Launch scope

- Keep: projects, workers, official Claude/Codex engines, skills, blueprints, Director
  dispatch, approvals, schedules, Model Council, transcripts, usage visibility, exports.
- Add: first-run onboarding, outcome-first creation, connection doctor, safe defaults,
  desktop packaging, clean-install checks, capability explanations, license gates,
  landing page, web planning workspace, and release documentation.
- Remove from the commercial build: TikTok/The Reel, business-specific Tiger Brands
  modules, private vault data, private transcripts, experimental engines by default,
  and any production credentials.

## Release rules

- Work only on `codex/production-launch` in `/home/harel/work/foundry-product`.
- Never deploy production from the VPS.
- Never copy `data.json`, credentials, tokens, customer data, or business-specific modules.
- Every claim on the landing page must map to a tested product behavior.
- Security and release QA can block the release.

