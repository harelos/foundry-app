# Foundry product strategy

Date: 2026-10-01. Owner: Product Lead. Status: strategy for implementation review; no product changes or release authorized by this document.

Basis: `docs/PRODUCT_BRIEF.md`, source inspection at `ac7c108` on `codex/production-launch`, current official documentation, and the owner's interrupted Claude-to-Codex handoff. Targets below are proposed validation thresholds, not observed customer results. The commercial checkout is distinct from the more developed private Foundry installation; private capabilities are not evidence that this build ships them.

## 1. The decision

Launch an **AI outcome workspace for small ecommerce agencies**. Its first job is turning a client's existing brief and evidence into a campaign pack the operator can review, revise, and hand off.

Customer-facing promise to validate: **“Turn your client brief into a campaign pack you can approve.”** Supporting explanation: “Foundry organizes the work, checks the evidence, and keeps the deliverables together. You review the plan and the result.” These are proposed claims, gated by the proof matrix below.

“Outcome operating system” remains an internal ambition. It is too broad for the launch category. Agent counts, model councils, org charts, and token meters are supporting machinery, not the reason to buy.

### Launch avatar

Target the US, English-speaking owner of a 1–5-person ecommerce marketing agency who personally prepares campaign concepts, ad copy, and landing-page briefs for clients. They already pay for an eligible ChatGPT or Claude plan, use a Windows computer, and have a real client deliverable due within seven days. Recruit people who can supply approved product facts, an offer, a brand reference, and at least one previous deliverable.

The purchase trigger is another client deadline requiring repeated briefing, checking, and assembling drafts. The buyer is also the daily user. Their desired result is something they can confidently send to a client, not an AI workforce to configure.

Exclude developers, enterprise procurement, consumers exploring AI, and people expecting autonomous ad buying. Ecommerce merchants remain a later adjacent segment. Harel's business is useful dogfood, not independent market validation. Windows is the first supported commercial platform; demand from Mac-only agencies must be recorded as a qualification loss, not hidden in activation figures.

### Wedge: prepare a campaign review pack

The first mission uses one client, one product, one offer, and one audience. It produces:

1. A one-page audience, offer, and evidence brief with source references and explicit unknowns.
2. Three distinct campaign concepts, each with rationale, two primary-text drafts, and three headlines.
3. One landing-page content outline aligned to the selected concept, without editing a live page.
4. A review checklist and a consolidated, editable handoff with unresolved decisions clearly marked.

These counts define the template, not a performance claim. Generated images, rendered videos, live-page builds, analytics connections, and publishing are outside this first mission. Existing approved copy is locked unless the user explicitly permits changes. An unsupported product claim blocks acceptance; the system requests evidence or removes the claim.

Use two roles: a maker and a reviewer. The Director prepares the plan and coordinates those roles; it does not add a third concurrent worker. Start sequentially. More agents must earn their place through measured quality or time savings.

## 2. What the providers already do

Official pages were opened on 2026-10-01. Recheck eligibility, distribution conditions, and supported CLI versions before each release; a successful login is not proof of every capability.

| Verified provider capability | Product consequence |
| --- | --- |
| ChatGPT Work on the web supports multi-step tasks, projects, files, plugins, skills, and finished documents and other outputs. [Official web guide](https://learn.chatgpt.com/docs/web) | Do not position native ChatGPT as merely scattered chat. Foundry must outperform an informed user of native Work on this specific campaign workflow. |
| Codex supports ChatGPT subscription login and separately billed API-key access; its browser flow returns credentials to Codex. [Official authentication guide](https://learn.chatgpt.com/docs/auth) | Use the official local flow. Show the selected billing source. Never silently substitute an inherited API key. |
| Codex app-server is explicitly an integration interface for authentication, conversation history, approvals, and streamed events. [Official app-server guide](https://learn.chatgpt.com/docs/app-server) | Prefer evaluating this supported boundary over expanding a permissive event parser. Integration choice remains the runtime engineer's responsibility, backed by compatibility tests. |
| Sign in with ChatGPT plan-usage documentation covers open-source, locally hosted apps and directs paid or remotely hosted apps to an interest form. It does not grant access to ChatGPT conversation history. [Official plan-usage overview](https://developers.openai.com/siwc/token-sharing-open-source) | The brief's “noncommercial DevKit” wording should not be repeated as a verified current license description. Keep the direct plan-usage adapter deferred pending explicit eligibility. Local Codex integration and this separate OAuth product are different routes. |
| Claude Code can edit files, run commands, use MCP, and support parallel work on its web surface. [Official overview](https://code.claude.com/docs/en/overview) | Local execution and parallel agents alone are not differentiation. |
| Claude Code supports subscription authentication; credential precedence can select another billing source. [Official authentication guide](https://code.claude.com/docs/en/authentication) | Doctor must check the effective account and billing method, not simply detect installed credentials. |
| Anthropic documents conditions for offering Claude Code inside products: accept its Commercial Terms, keep its binary and authentication methods intact, and have each end user authenticate and pay their provider directly. [Official distribution conditions](https://code.claude.com/docs/en/legal-and-compliance) | This is a supported conditional route, not permission to resell inference, pool accounts, modify the binary, or claim a partnership. Release QA must verify compliance for the actual packaging. |

The strategic inference is that Foundry's possible advantage is **a tested business workflow, an explicit definition of done, and continuity across connected providers**. It is a hypothesis, not a demonstrated moat. Native products may close this gap. The validation plan compares completed artifacts and operator effort, not feature inventories.

## 3. Repository reality and launch blockers

This was a read-only source audit, not an application or security certification. No private state or credential files were opened. No provider execution was triggered.

During final review, concurrent work added desktop/core scaffolding, packaging configuration, `docs/RELEASE_GATES.md`, and `docs/WEB_PRODUCT.md`. The table below records the inspected `ac7c108` baseline, not a claim that those later files are absent. Scaffolding does not close a gate; the next review must test the resulting packaged build. Those concurrent changes were not made or certified in this task.

| Evidence in this checkout | Assessment and required change |
| --- | --- |
| `package.json` has only `start` and `dev`; tracked files include `start.bat`, with no desktop packaging or test configuration. | No evidence of a tested Windows installer. Clean installation, update, uninstall, and recovery evidence are release blockers. |
| `server.js:13` defaults to `bypassPermissions`; `runTurn` passes it to Claude. | Personal-tool default conflicts with the commercial approval promise. Enforce safe permissions in the execution path, not just an approval-looking screen. |
| `saveData` persists credential-bearing agent fields; `publicAgent` includes credential fields; account routes retain token capture paths. | Remove raw subscription-token UX and secret serialization from the commercial path. Credentials must remain provider-owned or OS-protected and must not reach browser payloads, exports, logs, or crash reports. |
| `server.listen(PORT)` has no explicit loopback host. | Verify binding and require local request authentication, origin checks, and path authorization. “Local” is not itself an access-control boundary. |
| `runCodexTurn` creates a synthetic session marker, does not pass a real resume command, and records zero token/cost values. | Do not claim reliable Codex continuation or accurate usage. Preserve real session identifiers and label unavailable usage as unknown, never zero. |
| `saveData` directly writes state, retains one backup, and caps persisted transcript entries at 300. | Existing persistence is not a durable mission checkpoint. Verify atomic recovery and preserve authoritative decisions outside a truncated transcript. |
| Project, worker, blueprint, dispatch, transcript, loop, and usage structures exist. | Reuse these foundations after validation. A bounded loop is not a scheduler. Model Council, schedules, and outcome acceptance are not proven in this checkout. |
| `reel.js`, `public/reel-ui.js`, and `/api/reel/*` are wired into the server. | Exclude The Reel from the commercial package, including routes and dependencies. Do not copy private Foundry state to obtain newer features. |

README claims such as “everything is local,” old design direction, and setup instructions require a separate authorized implementation pass. Local project storage does not mean offline inference: selected context goes to the connected provider. This strategy does not alter the README or product code.

## 4. Activation and acceptance

The activation event is **the first real campaign pack explicitly accepted by its operator**, after opening the artifact and passing its evidence checklist. Sending a message, creating workers, a model saying “done,” or downloading an unopened file does not count.

The intended path is: install → official provider connection and working check → choose “Prepare a campaign pack” → supply evidence → approve the plan and local folder → execute → open the pack → accept or request a focused revision.

Intake asks only for the product, audience, current offer, source material, and delivery constraints. Defaults choose the team and model. Missing evidence becomes a visible question, not invented copy. The connection doctor distinguishes missing CLI, failed login, exhausted plan, unsupported capability, and network failure, with a specific recovery action for each.

Acceptance requires all four deliverables, functioning local links, exact source-backed commercial facts, preserved approved copy, no fabricated testimonials or results, no unrequested external writes, and no unresolved material claim. Revision updates the existing artifact and retains accepted sections. A result can be useful but remain “needs review”; that state is not activation.

Internal usability targets: p95 visible response to a tap within 100 ms; local mission-state navigation within 500 ms on the documented test machine; first execution-state feedback within one second. Provider completion time is measured separately. Aim for first accepted pack within 30 minutes after successful connection, including review, while also reporting total install-to-accept time. These are targets to test, not landing-page promises.

## 5. Provider-limit recovery is P0

The owner's weekly Claude limit interrupted this very strategy task. Asking an ordinary operator to find a replacement model, repeat the brief, or paste a transcript is a product failure.

Ship a visible **“Continue with Codex”** or **“Continue with Claude”** action when another connected, eligible provider can complete the remaining work. Default to one click. Offer automatic switching only after the user enables it for named providers and permits the relevant project context to be sent to them. Connecting a provider alone is not consent to transfer every client's context.

The promise is recovery from saved work, not transfer of hidden reasoning or identical model behavior. Foundry owns the mission state; provider sessions remain provider-specific.

### Required recovery contract

1. Persist mission ID, original objective, current instructions, approved plan, acceptance criteria, source references, decisions, completed steps, remaining steps, artifact paths and checksums, tool-action outcomes, permission scope, and pending approvals. Save at step boundaries and before consequential actions. Keep relevant original instructions addressable; do not trust a summary alone.
2. Classify quota exhaustion separately from expired login, transient overload, network failure, user stop, and provider refusal. Never use fallback to bypass a refusal, revoked access, or organizational restriction. Show reset timing only when the provider supplies it.
3. Stop or fence the old run before activating the replacement. Use a single active mission lease so a late event cannot overwrite newer work. Inspect incomplete writes and uncertain tool outcomes before resuming. Never automatically repeat an external side effect whose outcome is unknown.
4. Confirm the replacement has the required tools, file access, account entitlement, billing source, and permission scope. A connection badge or model-list entry is insufficient. If a capability is missing, explain the blocked step and preserve the work; do not quietly substitute a weaker deliverable.
5. Start a new provider session against the existing mission and approved folder. The replacement reads the checkpoint and actual artifacts, verifies completed steps, and continues only unfinished work. Existing approvals carry only their original scope; new actions still require approval.
6. Record the transition in the same activity history and report what continued. If both plans are unavailable, persist and pause with reconnect/wait options. No endless retries, account cycling, inferred reset time, automatic upgrade, or silent paid API fallback.

Automatic switching uses a bounded route with at most one attempt per eligible provider for the interruption. API billing is a separate explicit opt-in with a budget. User-enabled extra usage at the provider is still possible; Foundry must not promise that subscription execution can never incur additional provider charges.

### Recovery acceptance suite

Inject a limit before work, after the first artifact, during a file write, and immediately after a simulated external action. Test both provider directions, expired login, unavailable tools, both plans exhausted, app restart, duplicate clicks, late events, and a pending approval. Use fixtures for all external writes.

Every test must preserve approved copy and completed files, retain decisions and pending approvals, avoid duplicate actions and concurrent writers, and finish or show a precise recoverable block. Also run a real two-provider campaign-pack continuation on a clean Windows machine. Attach event logs, artifact diffs, and the final reviewed pack. This incident proves the need, not that the repository implements the solution.

## 6. Feature hierarchy and surfaces

| Priority | Scope | Exit criterion |
| --- | --- | --- |
| P0: earn trust and first completion | Windows installer; official Claude/Codex connections; doctor; approved folder; safe permissions; durable mission state; campaign blueprint; maker/reviewer; artifact preview, revision and basic export; provider recovery; honest status and usage | A qualified user completes and accepts a real pack without terminal commands, prompt engineering, or staff intervention; release safety suite passes. |
| P1: earn repeat usage | Saved client evidence, reusable outcome blueprints, multiple projects, explicit repeat-run setup, opt-in local schedules, advanced skills | Returning users complete a second pack with less active effort. Schedules state that the computer must be awake and pause at approvals. |
| P2: earn higher spend | Model Council, broader outcomes, Studio client organization and shared blueprints | Incremental adoption and willingness to pay are demonstrated. Council must beat the normal reviewer on quality enough to justify usage and latency. |

Preserve usable project, transcript, dispatch, and blueprint primitives. Hide engine plumbing, org charts, and token detail from first-run setup. Do not import the private application wholesale. Items described as “keep” in the brief are subject to actual presence and release QA; absence does not create an automatic launch obligation.

Desktop is the full execution product. First-run status is understandable in one view: goal, current step, next decision, artifact. Use near-black with violet undertone, deep purple accents, gold for working state, concise controls, and plain labels. Require screenshots and interaction checks at 375 px, 390 px, and 1440 px. Mobile layouts must not imply that the phone can operate an unconnected desktop.

Web v1 is the sales site plus a useful structured brief planner with browser-local draft persistence and explicit mission-file export/import. Its output includes evidence references, constraints, and the desired result. It never claims access to desktop files. Import is previewed and approved before execution, including path and attachment validation.

**Explicit scope cut from the brief:** defer hosted AI chat/research until an approved provider and funding route exists. A paid desktop license and subscription login do not fund arbitrary server-side inference. The planner can prepare the mission without that dependency. Web-to-desktop is a downloaded mission package, not remote control. No cloud sync or phone-to-desktop execution in v1.

Reconcile `docs/WEB_PRODUCT.md` to this decision in the next authorized implementation plan: retain its safe mission schema, import preview, accessibility, and performance requirements; defer its hosted account, chat, and research service. This strategy does not silently edit that teammate's proposal. Preserve all applicable security gates in `docs/RELEASE_GATES.md`; deferring a feature is not permission to weaken protections for shipped features.

## 7. Free, Pro, and Studio

Foundry charges for repeatable workflow and organization. AI usage is supplied and billed by the user's chosen provider, subject to that provider's limits and terms. Never sell “unlimited AI.”

| Boundary | Free Local | Pro | Studio |
| --- | --- | --- | --- |
| Price hypothesis | $0 | $29/month; $249/year hypothesis | $79/month hypothesis; waitlist only initially |
| Projects / workers | One active project; two active workers | Unlimited saved projects; up to eight active workers, queued to provider capacity | Up to twenty active workers only after capacity testing; not promised inference concurrency |
| Outcomes | Campaign pack, concept revision, client handoff: three narrow variants of the same workflow | Saved client context and reusable versions of these workflows; broader templates only after validation | Reusable client workspaces and shared blueprint packages |
| Runs | Manual | Manual first; schedules after P1 acceptance | Repeat client delivery and team reporting after validation |
| Providers | One provider for ordinary execution; a second may connect for recovery | Both providers usable in normal workflows | Each person uses their own provider account; no pooled subscription |
| Safety and ownership | Full approvals, checkpoints, one-click and opted-in automatic recovery, basic export | Same protections; advanced workflow controls | Same protections; later organization features |
| Advanced tools | Curated skills | Custom skills; Model Council only when proven | Shared blueprints and handoff packages; no implied live collaboration |

The second recovery connection is a deliberate exception to the brief's Free one-provider rule. Do not put work preservation, approvals, basic export, or continuation behind a paywall. Worker limits count active execution slots, not a guarantee that a subscription supplies simultaneous requests.

Offer a 14-day no-card Pro-feature trial starting when the first accepted pack is reached. Expiry preserves every artifact and its export; users choose which project stays active in Free. Hold annual checkout until retention is understood. Studio is a pricing interview and waitlist, not a purchasable set of unfinished features.

No billing build before the day-30 activation gate. Afterwards, validate willingness to pay at $29, then implement the smallest authorized monthly checkout and entitlement path. Interest and survey answers are not revenue. Paid activation, renewal, support burden, and refund experience determine whether to retain the price. No outreach, charge, or payment-system mutation is authorized by this document.

## 8. Ninety-day validation plan

Day 1 is the start of the approved validation program. Targets are explicit decision rules, not forecasts. Product Lead owns the weekly artifact review and publishes numerator/denominator counts, including failures.

| Window | Experiment and evidence | Gate and response |
| --- | --- | --- |
| Days 1–14 | Recruit 12 qualified agency operators with a real deadline. Observe their current workflow and collect permissioned before/after artifacts. Run paired tasks in Foundry and their native AI product, counterbalancing task order; label staff-assisted runs. | At least 8 supply a real brief and complete an observed attempt. If fewer qualify, revise recruitment or avatar before adding product surface. No paid acquisition. |
| Days 15–30 | Ten qualified operators attempt clean install through first pack with no staff intervention. Separately complete the recovery and security suites. Track elapsed time, active operator time, corrections, and artifact acceptance. | At least 7/10 accept a real pack within 24 hours; median connected-to-accepted time ≤30 minutes; zero unresolved critical safety/recovery failures. Miss: fix the largest failure category and repeat the gate before billing. |
| Days 31–60 | Extend to at least 20 activated external operators. Measure a second accepted pack within 14 days. Use paired reviews against native tools and request permission to test the $29 monthly offer. | At least 10/20 repeat; at least 6/20 choose the actual paid offer once checkout is authorized and available. Paired evidence should show ≥25% median reduction in active operator time without lower acceptance quality. Miss: improve wedge/value before schedules or Studio. |
| Days 61–90 | Observe a full renewal opportunity for at least ten monthly customers; expand enrollment if needed. Inspect recurring use, support effort, and why anyone cancels. Interview five multi-client users about Studio. | At least 6/10 renew and at least 6/10 accept a pack in three of four observed weeks. Median support effort ≤20 minutes per paying customer per month. Smaller or immature cohort means “insufficient evidence,” not a passed gate. |

North-star metric: **weekly operators with at least one accepted campaign pack**. Also report visitor→planner, planner→download, download→connection, connection→accepted pack, 14-day repeat, activated→paid, and first renewal. Event definitions: `connection_verified`, `mission_plan_approved`, `artifact_opened`, `artifact_accepted`, `revision_requested`, `mission_interrupted`, `fallback_offered`, `fallback_started`, `fallback_completed`, `mission_blocked`, and later `subscription_started` / `subscription_renewed`. Identify artifact version and mission to avoid counting reopens or duplicate acceptance.

Fallback success = interrupted eligible missions resumed to reviewable completion without duplicated actions or lost accepted work / eligible interruptions where continuation was requested or preauthorized. Report no-backup cases separately. Do not count a new provider process starting as successful recovery.

Collect only consented operational telemetry with no prompt bodies, client files, credentials, or raw transcripts. Permit local export for pilot measurement. Baseline is currently unmeasured; no conversion, upsell, retention, or time-saved result is claimed here.

If activation passes but native tools perform equally well, test whether saved client context and recovery create repeat value. If by day 90 customers neither repeat nor pay, stop scope expansion and consider packaging the workflow for native tools. Do not answer weak demand with more agents. Paid social is a later, explicitly approved experiment using only proof-backed claims; this task includes no Meta writes.

## 9. Claim-to-proof matrix

All statuses refer to the commercial checkout. Official provider capability is not proof of Foundry behavior. QA stores build ID, environment, supported provider version, steps, expected/actual behavior, and evidence for every claim. “Required” means not yet certified.

| Proposed claim | Proof required before publication | Current status | Accountable owner |
| --- | --- | --- | --- |
| “Turn your brief into a campaign pack you can approve” | Complete pack against the acceptance checklist; operator acceptance; unedited session evidence | Required | Onboarding and Outcome Systems Designer |
| “Works with your eligible ChatGPT or Claude plan” | Clean Windows official login, effective billing-source check, completed task on each supported provider; distribution review | Provider routes documented; Foundry unverified | Desktop Runtime and Authentication Engineer + Security Reliability and Release QA |
| “No API key required for supported subscription workflows” | Each supported subscription path completes with no key supplied and no inherited-key billing | Required | Desktop Runtime and Authentication Engineer |
| “Continue with another connected plan” | Both-direction quota injection, real continuation, artifact/decision parity, no duplicate side effect | Required; P0 | Desktop Runtime and Authentication Engineer |
| “You approve the plan and consequential actions” | Denied and pending actions remain blocked across every execution adapter, restart, and fallback; fixture-only external writes | Existing bypass default blocks claim | Security Reliability and Release QA |
| “Your credentials stay out of project files and exports” | Secret canaries absent from saved state, public responses, exports, logs and installer; provider/OS credential-storage verification | Existing serialization blocks claim | Security Reliability and Release QA |
| “Local project storage” | File-location inspection and network capture; disclosure that inference sends selected context to providers | Required; never claim fully offline | Security Reliability and Release QA |
| “Install and start without terminal setup” | Clean supported Windows installation with missing prerequisites and canceled login recovery; recorded uninstall/update checks | No installer evidence | Desktop Runtime and Authentication Engineer |
| “Pick up where you left off” | Crash/restart after step boundaries and partial write; approved sections unchanged; no lost decisions after long history | Existing persistence insufficient | Desktop Runtime and Authentication Engineer |
| “Plan on the web, continue on desktop” | Real export/import round trip including missing attachments, invalid paths, duplicate import, and user approval | Required; planner only | Web Product and Landing Engineer |
| “Clear on a small screen” | Screenshots and task checks at 375, 390, and 1440 px; no clipping, overflow, or hidden primary action | Required | Web Product and Landing Engineer |
| “Saves time” or any numeric benefit | Paired real-user artifacts and active-time measurement, cohort sizes, date, failure inclusion and permission to publish | Unmeasured; prohibited now | Direct Response Positioning and Paid Social Strategist |
| “Runs on a schedule” | Sleep/wake, missed run, expired login, exhausted plan, and pending approval tests with stated local-runtime limits | P1, not launch copy | Desktop Runtime and Authentication Engineer |

No invented testimonials, guaranteed conversion lift, “20 employees for $29,” autonomous publishing promise, provider endorsement, or unlimited usage. Marketing publishes only claims QA has certified for the exact release.

## 10. What we will not build

- A general-purpose agent marketplace, graph builder, prompt IDE, or enterprise org-chart product.
- Five broad outcomes on day one. “Build a landing page,” “Audit a store,” and “Run my operations” wait until the campaign workflow retains users.
- Autonomous ad buying, sending customer email, commerce writes, payments, or production deployment.
- The Reel, TikTok tooling, media generation, private Tiger Brands modules, credentials, or transcripts in the commercial bundle.
- Shared subscription accounts, token-paste onboarding, account rotation to evade limits, or a paid product built on unconfirmed direct plan-usage eligibility.
- A hosted agent runtime, cloud sync, remote desktop bridge, mobile native app, Mac/Linux installer, or real-time team editing in the first release.
- Subscription-quota estimates presented as exact remaining capacity, or unsupported usage presented as $0.
- Billing before activation evidence, Studio delivery before repeat usage, or Council before a demonstrated quality advantage.

## 11. Team contract and release gate

These are proposed workstream responsibilities, not messages already sent or permission to alter code. The next implementation plan must stay inside this scope and receive the owner's required approval.

| Workstream | Reviewable artifact owed |
| --- | --- |
| Product Lead | Accepted scope, metric definitions, weekly artifact comparison, go/no-go against gates |
| Desktop Runtime and Authentication Engineer | Supported connection matrix, installer evidence, credential/billing selection evidence, checkpoint and fallback demonstrations |
| Web Product and Landing Engineer | Proof-gated landing proposal and working planner/import package; screenshots at all three widths |
| Onboarding and Outcome Systems Designer | Five-question intake, two-role workflow, evidence rubric, sample pack using licensed/public or synthetic labeled inputs |
| Direct Response Positioning and Paid Social Strategist | One-avatar message test, objections from interviews, claim registry, native-tool comparison; no ad-account changes |
| Security Reliability and Release QA | Distribution review, secret-canary checks, permissions and recovery suite, sanitized package manifest, release veto |

Public release requires the activation gate, a clean-install artifact, both provider paths, the recovery suite, enforced permissions, sanitized packaging, verified export, all applicable P0/P1 gates in `docs/RELEASE_GATES.md`, and no open critical QA blocker. Product priority labels here do not downgrade QA severity. A document, screenshot, or verbal completion report cannot replace the relevant execution evidence. QA can block release. All code work remains on `codex/production-launch`; production deployment stays outside this VPS and requires explicit owner authorization.

### Five decisions the team must follow

1. **One buyer and one outcome:** Windows-based US small ecommerce agencies; a reviewable campaign pack is the launch product.
2. **Acceptance is activation:** measure an operator accepting a source-backed deliverable, not chats, agents, or generated volume.
3. **Continuity is core:** official connected providers, durable mission state, and one-click or opted-in automatic fallback without discarding work; safety and recovery remain in Free.
4. **Desktop executes; web prepares:** no hidden hosted inference, remote-control claim, production writes, or unsupported provider-access promise.
5. **Pro follows proof:** validate $29 monthly after activation; Studio, broad outcomes, schedules, and Council follow evidence, and QA gates every public claim.
