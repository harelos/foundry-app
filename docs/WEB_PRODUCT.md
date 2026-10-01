# Foundry web product and sales site

Status: proposed architecture, 2026-10-01. No hosted web product, pricing checkout, or production deployment is implied by this document. Source of product scope: [PRODUCT_BRIEF.md](PRODUCT_BRIEF.md).

## Product contract

Foundry's public site sells a concrete result: choose an outcome, prepare a supervised mission, then finish the work in Foundry Desktop. The hosted workspace is useful on its own for planning, research, drafting, and reviewing a proposed mission. It cannot see local folders, run local commands, use a user's browser session, or operate their computer. Every web screen that offers a desktop action should say where execution happens and require an explicit export/import handoff.

The first customer is a US owner-operator or small agency/e-commerce team already using ChatGPT Plus/Pro or Claude Pro/Max. Show outcomes such as a campaign, landing page, client delivery, store audit, and weekly operating review before showing workers or model settings. An eligible subscription is connected **inside Desktop** through official Codex or Claude tooling. It does not fund hosted web inference. Hosted chat needs a separately funded commercial model API, with visible limits and server-side cost controls; if that service is unavailable, saved intake and deterministic mission drafting remain usable, with chat clearly marked unavailable.

The activation event is a reviewed desktop deliverable. Web sign-up, a chat turn, mission export, and desktop import are intermediate events, not claims of activation.

## Current repo and separation

The checked-in app is a single local Node HTTP server (`server.js`) serving `public/index.html`, `public/app.js`, and `public/reel-ui.js`. It stores projects, transcripts, provider settings, and keys in local `data.json`; `/api/state` serializes agent configuration including keys. It also exposes local directory browsing, uploads, agent execution, and mutating routes. The server has no public-user auth boundary, and its default permission mode is `bypassPermissions`. Its checked-in interface uses the older light/green styling. The README describes a self-hosted control room and contains launch claims that must be reconciled with the product brief before publishing.

**Architecture decision:** do not host, reverse-proxy, iframe, or reuse this server as a public backend. Build a separate web origin and API with an allowlisted planning capability set. The desktop runtime owns local execution and provider browser login. The web service never receives CLI session files, subscription tokens, local paths, private vaults, or `data.json`. No shared production database or route handler should silently widen this boundary.

| Surface | Owns | Must never do |
| --- | --- | --- |
| Public site | Product explanation, tested proof, pricing information, docs, signed release downloads | Claim an untested capability or imply web control of a device |
| Hosted workspace | Account session, outcome intake, bounded planning chat, drafts, mission export | Browse local files, spawn CLI agents, accept provider subscription tokens, execute tools |
| Desktop app | Official provider login, working-folder choice, local agents, approval gates, deliverables | Auto-run an imported mission before user review |
| Optional future relay | A separate, explicitly paired and revocable channel for narrowly scoped capabilities | Grant remote control by merely signing into the web account |

There is no relay in launch scope. Any future relay needs its own threat model, pairing UX, permissions, audit trail, revocation, and separate release approval. Its absence must not make the web UI look broken.

## Page map and journeys

Use one brand system across the public and signed-in surfaces, with separate route trees and deployment bundles. Canonical URLs use lowercase paths without trailing slashes. Marketing pages are indexable; account, intake, chat, and export pages are `noindex` and excluded from the sitemap. The site should pre-render public content so its value and navigation work without client JavaScript.

| Route | Purpose and primary action | Indexing |
| --- | --- | --- |
| `/` | Outcome-led promise, concise product demonstration, tested proof, **Plan a mission** | Yes |
| `/how-it-works` | Web planning → export → desktop approval → deliverable; explain the capability boundary | Yes |
| `/outcomes` | Five launch outcomes with example inputs, review checkpoints, and deliverable types | Yes |
| `/pricing` | Proposed Free Local, Pro, Studio limits; plan availability and billing status must be explicit | Yes |
| `/download` | Windows installer, version, requirements, checksum/signature instructions, release notes | Yes |
| `/docs` | Getting started, provider connection, mission handoff, approvals, troubleshooting | Yes |
| `/docs/web-vs-desktop` | Plain capability matrix, including no local access from web | Yes |
| `/security`, `/privacy`, `/terms` | Security model and reviewed legal documents | Yes, once reviewed |
| `/app` | Signed-in mission list and resume | No |
| `/app/new` | Outcome choice and short evidence-based intake | No |
| `/app/missions/:id` | Planning chat, editable plan, sources, review state, export | No |
| `/app/settings` | Account, retention/deletion controls, quota and data export | No |

Primary navigation: **Outcomes, How it works, Pricing, Docs**, plus a compact **Plan a mission** action. Download is visible in the header utility area and in the footer; after a plan is prepared, **Download Desktop** becomes the next action. The footer also links security, privacy, terms, release notes, and contact. Outcome pages link to a relevant doc and to intake; docs link back to the appropriate outcome and download. Every public page has an inbound link, a canonical URL, and a descriptive title. Do not add invented testimonials, logos, ROI figures, or speed claims.

### Main path

1. Visitor chooses one of five outcomes. They can inspect a sample plan without creating an account. A clear boundary note says that local work happens in Desktop.
2. User starts intake: desired result, audience/business context, constraints, deadline, success criterion, and available evidence. Questions are conditional and skippable where possible. No request for local filesystem permission.
3. Web workspace creates an editable mission proposal: goal, assumptions, required inputs, smallest useful team, work steps, approvals, outputs, and open questions. Chat can refine the plan and draft web-safe material. Research must cite accessible sources and disclose when it has no source; no fabricated browsing result.
4. User reviews the proposal and chooses **Export mission**. The page explains that export downloads a local file and does not start work. A manual copy/paste fallback is available.
5. Desktop imports the file into a preview. It validates the schema, shows the entire plan, requires working-folder selection, identifies missing inputs, and requests approval before dispatch. The desktop completion report and deliverable are the real proof of value.

No cross-device account is required for the initial file handoff. Do not infer that a mission exported on a phone was imported on a PC until the desktop confirms it through an explicitly consented mechanism. Without that mechanism, measure export and desktop activation separately.

## Sales-site content rules

The hero should lead with a finished business outcome and a visible example of the plan/review loop. Show actual product screens only after the behavior has passed QA. A short boundary line near the first CTA: “Plan here. Run approved work in Foundry Desktop.” The three proof sections are: choose an outcome, review the team and plan, inspect the deliverable. Demonstrations must be labelled as examples until produced by the released build.

Pricing in the brief is a hypothesis, not an active checkout: Free Local; proposed Pro at USD 29/month or USD 249/year; proposed Studio at USD 79/month; proposed 14-day trial of orchestration features without a card. Label prices and limits as planned until billing and license gates exist and are tested. Do not show an active purchase CTA before then. Explain that provider subscriptions are purchased separately, eligibility varies, and hosted planning chat has separate usage limits. Do not promise that ChatGPT/Claude subscriptions work through a commercial hosted web SDK. The commercial web product must not use the noncommercial Sign in with ChatGPT DevKit.

Every landing-page claim belongs in a claim ledger with wording, responsible behavior, build/version, test evidence, and approval state. Publishing blocks on any claim without evidence. Keep specific UI copy and H1/H2 changes for a later, reviewed implementation task.

## Data and API boundary

Use a dedicated hosted service and database. The public site's content may be static; the workspace API is authenticated and scoped by account and mission. The following routes are a proposed contract, not existing endpoints:

| API | Data/behavior | Boundary |
| --- | --- | --- |
| `GET /api/web/session`, `POST /api/web/session/*` | Web session through the chosen production identity provider; secure, HttpOnly, SameSite cookies | Web identity is distinct from Claude/Codex provider login |
| `GET /api/web/outcomes` | Versioned, public outcome blueprints | No private desktop templates or Tiger Brands modules |
| `POST /api/web/missions`, `GET/PATCH /api/web/missions/:id` | Validated intake, plan, review status, optimistic version | Owner-scoped; bounded fields and size; no local paths |
| `POST /api/web/missions/:id/chat` | Bounded chat turn/stream, server-side inference, saved assistant draft | No local/desktop tools; quota, timeout, cancellation, and abuse limits |
| `POST /api/web/missions/:id/export` | Versioned `.foundry-mission.json` download | Serialized data only; no executable code, credentials, or remote commands |
| `GET /api/web/releases/latest` | Reviewed release metadata, verified download links, checksums | No unpublished binaries or mutable “latest” without version pin |
| `GET/DELETE /api/web/account/data` | User export and deletion request/status | Retention and deletion policy shown in UI |

Separate records for `Account`, `Mission`, `IntakeAnswer`, `PlanRevision`, and `ChatMessage`; every mission is owner-scoped. Store only the information needed to resume planning. Do not ingest local files at launch. If users paste confidential information, show a clear notice, encrypt it at rest, and provide deletion controls. Set and test retention periods before launch; avoid indefinite raw prompt and response logs. Keep model-provider request data out of analytics. Analytics may record consent-appropriate, aggregate events such as outcome selected, intake completed, plan reviewed, export clicked, download clicked, and verified desktop activation when that signal exists. Use opaque mission IDs in workspace URLs; keep email, chat text, and business details out of URLs, and keep mission IDs and user content out of analytics events.

The web API must not call local `server.js`, `/api/browse`, `/api/agents/*`, `/api/projects/*`, or any account-vault route. Apply server-side authorization on every resource read/write, CSRF protection for cookie-auth mutations, content security policy, output escaping, request/body limits, rate limits, and abuse monitoring. Treat prompts and citations as untrusted data. Browser scripts must never receive inference keys. Web inference uses a commercial API agreement, per-account budget, and a kill switch. An unavailable model returns an explicit failure with the user's draft preserved, never a fabricated answer.

### Mission export/import contract

Use a documented schema with `schemaVersion`, `missionId` (opaque), `title`, `outcomeKey`, `goal`, `context`, `constraints`, `successCriteria`, `steps`, `proposedRoles`, `requiredInputs`, `approvalCheckpoints`, `expectedOutputs`, and `createdAt`. Include provenance for web research links and a clear `source: "web-planning"` marker. Bound text and array sizes. Exclude provider login state, API keys, local absolute paths, executable scripts, customer records, and web chat history unless the user intentionally selects a short summary. The export should be inspectable JSON, with an optional checksum for download integrity; a checksum is not an authorization grant.

Desktop import treats the file as untrusted. It validates schema and size, strips unknown execution fields, renders a safe preview, and asks the user to choose a folder and approve the plan before any agent is created or command is run. Version incompatibility gives a clear error and preserves the file. Re-import is idempotent by mission ID and revision, with an explicit “create another copy” action. A later paired relay would use the same validated mission schema; it would not bypass desktop approval.

## Visual and interaction system

Dark mode is the primary presentation: near-black with violet undertone, deep purple fills from `#4C1D95` to `#6D28D9`, legible light text, and restrained gold for active work. No forest green, pink, raspberry, or lilac accents. Light mode may follow after the dark experience is solid. Use Foundry's own identity, with simple typography and real product captures at consistent scale; do not transplant the checked-in green desktop CSS into the site. Keep the signed-in chat central, one slim header, and secondary details collapsed. Avoid decorative cards and oversized controls.

Design and QA start at 375px and 390px, then 768px and desktop 1440px. On the phone, the bottom composer stays reachable above the keyboard; actions respond immediately with a visible pending state, and long mission titles wrap without horizontal scroll. Touch targets are at least 44×44 CSS pixels where possible. Test an iPhone 12 mini-sized viewport and Instagram/Facebook in-app browser constraints. Any illustration or motion must support the explanation rather than slow the page.

## Accessibility, performance, and reliability gates

Target WCAG 2.2 AA. Use semantic landmarks, one page H1, ordered headings, visible focus, keyboard access to all controls, labelled inputs/errors, a skip link, text alternatives, at least 4.5:1 body-text contrast, and non-color status cues. Honor reduced motion. Chat streaming uses a restrained live region, does not steal focus, and offers a stop control. Intake errors preserve answers and focus the first error. Export, download, and import states are understandable without animation.

Measure on a midrange mobile profile over a constrained 4G connection, at the 75th percentile where field data exists:

| Budget | Launch gate |
| --- | --- |
| Public LCP / INP / CLS | ≤2.5 s / ≤200 ms / ≤0.1 |
| Public initial JavaScript | ≤100 KB compressed; keep primary content and navigation usable without it |
| Workspace initial JavaScript | ≤180 KB compressed, code split chat and settings |
| Interaction acknowledgement | Visible feedback within 100 ms; long chat/research operations show actual status and allow cancel |
| Images and fonts | Responsive formats/sizes, lazy load below fold, local or preloaded critical font subset, no layout shift |
| API | Timeouts, retryable error states, idempotent writes where needed; no optimistic “done” state before persistence |

Run automated accessibility checks and manual keyboard/screen-reader passes. Record screenshots at 375px, 390px, and desktop for each key page; inspect awkward wraps, clipped modals, horizontal overflow, keyboard overlap, and dark-mode contrast. Test cold and warm loads, low-bandwidth/offline/error states, mission export/import round trip, auth isolation between two accounts, and denial of every attempted web-to-local capability. Do not use private transcripts or customer data in QA fixtures.

## Implementation sequence and release gates

1. **Contracts and evidence:** agree on outcome templates, claim ledger, hosted inference funding/limits, identity choice, data retention, and mission schema with Product Lead, Desktop Runtime, and Security QA. Resolve those choices before copy or checkout claims become public.
2. **Static sales foundation:** build the public route tree and dark design tokens, then how-it-works, outcomes, docs, pricing-as-proposal, and download page. Use real verified captures only. Add canonical tags, sitemap, robots policy, metadata, and link checks.
3. **Useful web workspace:** add authenticated mission list, outcome intake, editable plan, bounded chat, source display, save/resume, deletion, and explicit web capability messaging. Keep the workspace service isolated from the desktop server.
4. **Desktop handoff:** lock the export schema and build safe import preview, version handling, folder choice, and approval gate with the desktop team. Validate a real end-to-end mission and reviewed deliverable on a clean Windows installation.
5. **Quality and release:** run security review, accessibility and performance gates, 375/390/desktop visual review, release-binary verification, claim audit, and copy review. Security/Release QA can block publication. Billing and license gates follow proven activation; no production deploy from this VPS.

This plan changes documentation only. Implementation and publication require their own reviewed tasks and release process.
