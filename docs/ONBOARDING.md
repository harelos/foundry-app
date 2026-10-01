# Foundry onboarding: first reviewed outcome

**Status:** Product and copy specification for the commercial desktop build, 2026-10-01. No product UI, provider connection, billing, or release is certified by this document. This specification follows [PRODUCT_BRIEF.md](PRODUCT_BRIEF.md) and the narrower launch wedge in [PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md). The checked-in first-run UI and outcome catalog do not yet implement this flow.

## 1. Promise, audience, and definition of done

The first customer is a time-poor, nontechnical owner of a small US ecommerce agency, on Windows, with a real client campaign due soon and an eligible ChatGPT or Claude plan. Their first job is **prepare one client campaign review pack** from one product, one offer, one audience, and supplied evidence. They leave with an editable pack they have inspected and accepted, or a precise list of missing proof. Do not claim a result within 15 minutes if provider login, evidence gathering, or generation takes longer.

The product-facing promise to validate is: **“Turn your client brief into a campaign pack you can approve.”** The first screen explains: “Bring the product facts and the offer you already use. Foundry will organize the work, show you the plan, and prepare a pack for your review.” The CTA is **“Prepare a campaign pack.”** Below it: “Your ChatGPT or Claude plan powers the work. Foundry asks before changing files or taking action outside this pack.” Eligibility and provider limits vary. The first mission does not publish, send, buy ads, build a live page, or edit the client's systems.

**Activation:** `deliverable_accepted` is emitted only after the operator opens the consolidated pack, passes the evidence review, and explicitly chooses **“Accept this pack.”** A connected provider, created project, generated draft, downloaded file, or agent message is not activation. An unresolved material claim keeps the pack in **Needs review**.

The pack contains four linked, editable parts:

1. A one-page audience, offer, and evidence brief with source references and unknowns.
2. Three distinct campaign concepts, each with a rationale, two primary-text drafts, and three headlines.
3. One landing-page content outline aligned to the selected concept, with no live-page edit.
4. A review checklist and consolidated handoff that marks open decisions.

These are template contents, not promises of performance. The visible team has two roles: **Campaign Maker** drafts and assembles; **Evidence Reviewer** checks claims, source links, counts, and locked copy. Foundry coordinates them sequentially. The operator does not choose models, create an org chart, or configure agents during first run.

## 2. The first 15 minutes

This is a target path and interaction budget, not a guaranteed completion time. Each transition saves its state before moving on. Every tap acknowledges within 100 ms; provider work shows a real status and can be paused. On a phone, the user may prepare an intake or review a static draft, but desktop execution begins only inside Foundry Desktop. Web-to-desktop transfer is a visible export/import, never remote control.

| Elapsed target | Screen and exact interaction | What the user sees next | Completion condition |
| --- | --- | --- | --- |
| 0:00–0:45 | Welcome. Primary CTA **“Prepare a campaign pack.”** Secondary **“See an example pack.”** Short line: “One client. One offer. A pack you can review before anything leaves your computer.” | A four-step value path: Connect → Brief → Approve plan → Review pack. No product tour. | User starts or inspects the example. |
| 0:45–2:30 | **Connect your plan.** Choices: **“Continue with ChatGPT”** and **“Continue with Claude.”** Caption: “Your provider opens its own sign-in page. Foundry never asks for your password or subscription token.” Official browser login, then a connection doctor checks actual sign-in, effective billing source, supported runtime, and whether this mission can run safely. | Status: **“Checking your connection…”**, then **“ChatGPT is ready for this pack”** or an actionable blocker. A second provider is optional for recovery. | Verified provider can perform the required mission steps; a login badge alone does not count. |
| 2:30–3:00 | **What Foundry can do.** One compact disclosure: “Foundry can read the folder you choose and make draft files there after you approve the plan. It will ask before other files, sending, publishing, spending, or changing a live system.” Link: **“See how approvals work.”** | Next step is a business outcome, not a capability questionnaire. | User can accurately say what Foundry will and will not do. |
| 3:00–3:30 | **Choose a result.** The launch default is **“Prepare a client campaign pack”** with four deliverables shown in one line. Other outcome cards appear only when implemented and QA-certified. If shown before then, label **“Coming later”**, with no start CTA. | The pack intake opens with the chosen result. | One outcome is selected. |
| 3:30–5:30 | **Give Foundry the facts.** Five prompts: client/product; intended audience; current offer and exact terms; source material; deadline and constraints. Users can paste text, choose local files, or mark an item **“I don't have this yet.”** Show why each input matters. Approved copy gets **“Keep this wording exactly”** control. | A short “What we have / What we still need” summary, with missing proof marked. No invented filler. | Minimum usable evidence is present or a clearly scoped evidence-first plan is proposed. |
| 5:30–7:00 | **Review the plan.** Show outcome, chosen local folder, two roles, the four output parts, source list, proposed steps, and every approval checkpoint. Primary CTA **“Approve plan and folder.”** Secondary **“Edit plan.”** | On approval, create the minimum two-role team and save a versioned mission checkpoint. No worker configuration screen. | Human approves a specific plan and canonical working folder. |
| 7:00–12:30 | **Work in progress.** Show one current step and the next checkpoint: “Checking facts” → “Drafting three concepts” → “Reviewing claims and locked wording” → “Assembling your pack.” Progress reflects persisted work, never a fake percentage. A pause control is always available. Only ask a question when an answer changes the result or an approval is required. | Each completed part becomes available for preview. A blocked step explains what is saved and the next action. | Four parts are assembled or a specific missing-proof block is visible. |
| 12:30–15:00 | **Review your pack.** Open the consolidated preview, then a four-item checklist: source-backed facts; exact offer terms; approved wording preserved; open decisions resolved or visibly marked. CTAs: **“Accept this pack”**, **“Request a change”**, **“Open files.”** | Success: **“Your campaign pack is ready for handoff.”** Show files, source list, unresolved decisions, and what Foundry did. Offer **“Start another pack”** only after acceptance. | Explicit acceptance of a reviewable pack, or a focused revision request with the existing pack preserved. |

If provider sign-in takes longer, keep the same screen and explain the delay. If sources are incomplete, stop at the evidence decision rather than racing to a low-trust draft. The 15-minute path measures time to first review opportunity; the product strategy separately targets acceptance within 30 minutes after successful connection. Both are proposed targets that require user testing.

### Brief intake, exactly as displayed

1. **“Who is this campaign for?”** Helper: “Client name, product, and the page or document that describes it.” Accept a name and source; use “Untitled client” only as a private draft label, never in output.
2. **“Who should it reach?”** Helper: “Describe one audience in the words your client uses. If you have customer research, add it here.” An unsupported audience insight is marked as a hypothesis.
3. **“What is the offer today?”** Helper: “Price, discount, deadline, shipping, and any limits. Use the terms customers actually see now.” If unknown, omit numerical savings and promotions.
4. **“What should we trust?”** Helper: “Add an approved product sheet, previous campaign, research, or link. We will cite the source beside each factual claim.” Each source records provenance, date if known, and whether its wording is locked.
5. **“What must the handoff respect?”** Helper: “Deadline, brand rules, forbidden claims, exact wording, and where the finished files should go.” The local folder is selected separately with the native picker before approval.

Use one short screen at a time on 375/390 px; a desktop layout may show the source list beside the active question. Optional fields stay collapsed. Back and edit preserve answers. A missing item never becomes a fabricated fact. Sensitive customer data is unnecessary for this mission; prompt for redacted examples instead of customer records.

### The proposed plan card

> **Your campaign pack**  
> Goal: Prepare a review-ready pack for [client/product].  
> Sources: [N] supplied; [N] facts still need confirmation.  
> Campaign Maker: drafts the concepts and landing-page outline.  
> Evidence Reviewer: checks claims, offer terms, and wording against your sources.  
> Files: evidence brief, concept set, page outline, handoff checklist.  
> Working folder: [canonical local path].  
> Foundry may read the selected sources and write draft files in this folder. It will stop before any other action.  
> **Approve plan and folder** · **Edit plan**

Numbers in the real card are derived from saved intake. The plan states what evidence is missing and whether work can proceed without it. Approval binds the plan version, folder, requested capabilities, and current source set. A material change to scope, destination, external target, or payload requires a new approval.

## 3. First-run checklist and progressive disclosure

Show a compact checklist only while it helps the user reach a pack. The list is **Connect plan → Add facts → Approve plan → Review pack**. A step is complete only when its underlying state is persisted. Do not add “invite a teammate,” “explore models,” “customize workers,” or “start a trial.” After acceptance, replace the checklist with the finished pack and a clear next action.

First run shows the result, current step, next decision, and current artifact. “Campaign Maker” and “Evidence Reviewer” appear at plan review because ownership matters there. Provider names appear at connection and recovery because billing and consent matter there. Model names, usage details, skills, schedules, worker counts, and system diagnostics live behind **Details** or **Settings**. The user should never need “token,” “CLI,” “sandbox,” or a raw command error to recover. Technical diagnostics may exist in a support panel with secret-safe redaction.

Use a dark first visual system: near-black with violet undertone, deep purple accent `#4C1D95`–`#6D28D9`, restrained gold for active work, clear text labels for every status. Keep the primary action sized to its text and reachable with one thumb; use no horizontal scrolling or clipped folder names at 375/390 px. Show feedback instantly and never animate a fake percent. This document specifies copy and behavior; it does not change existing headings, CSS, or product code.

## 4. Templates and guardrails

The first release template is **Client campaign pack**, with optional narrow starts **Revise an existing concept** and **Prepare a client handoff** only after the underlying behavior passes the same QA. Five broad outcome categories in the brief describe the intended catalog, not five certified launch flows. The checked-in `core/outcomes.js` currently lists different outcomes; the UI must not advertise this campaign pack as working until the template and end-to-end flow are implemented and tested.

| Template element | Required behavior |
| --- | --- |
| Inputs | One client, product, offer, audience, approved facts, optional prior copy, destination folder. Give every fact a source or an `unverified` label. |
| Plan | Fixed deliverable list; role ownership; steps; source references; missing facts; file scope; approvals; definition of done. User may edit the goal, facts, constraints, and proposed outline before approving. |
| Draft | Three concepts with the specified draft counts, plus the evidence brief and aligned page outline. Keep approved copy byte-identical unless the operator unlocks it. |
| Review | Reviewer flags unsupported claims, mismatched offer terms, duplicate concepts, broken links, missing sections, and changed locked copy. A reviewer cannot waive a material issue by self-attestation. |
| Handoff | Editable files with a short completion report: delivered files, sources used, changes made, unresolved decisions, and actions **not** taken. Export is available in Free. |

Safe defaults are enforceable product requirements: read only selected sources; write drafts only in the approved folder; no automatic shell/network privilege expansion; no emails, publishing, ad changes, store changes, spending, refunds, or production mutation without a fresh action-specific human approval. The first campaign mission does not need those external actions at all. Imported web missions are untrusted proposals; desktop previews the content, validates attachments, asks for the folder, and repeats plan approval before execution. Web planning cannot read local files or run a desktop task. No provider or teammate instruction counts as user approval.

The provider connection uses official browser sign-in only. Foundry does not ask for a password or subscription token, put credentials in a project file, or silently switch to a paid API key. Tell the user that selected project context is sent to the provider that performs the work. A second connected provider may be used for recovery only after the operator consents to sending this mission's context there.

## 5. Provider limit: exact recovery UX

The provider limit is an interruption to **this mission**, not a new mission. The current pack, files, decisions, original instructions, approved wording, and pending approvals remain visible. The user never has to repeat the brief, paste a transcript, read a CLI error, or choose a model.

### In-run screen

When the active plan reports a usage limit, immediately stop new work and show a persistent inline card at the current step:

> **Claude has reached its plan limit**  
> Your campaign pack is saved. The evidence brief and first concept are complete; two concepts and the final review remain.  
> **Continue with ChatGPT**  
> **Wait for Claude** · **Review saved work**

Swap the provider names when ChatGPT is limited. The completed/remaining line is generated from the durable mission journal, not from a guessed percentage. Show **“Available again [provider-supplied date/time]”** only when the provider reports a reliable reset time. Otherwise use **“Your provider has not given a reset time.”** Never imply Foundry Pro changes a provider's limit. If the second provider is not connected, the primary action is **“Connect ChatGPT to continue”** or **“Connect Claude to continue”**, followed by official sign-in and capability check. If there is no eligible second provider, show **“Your work is saved. Continue when this plan is available, or connect another eligible plan.”** The saved work remains reviewable.

The first time this mission crosses providers, the confirmation sheet says:

> **Continue this pack with ChatGPT?**  
> Foundry will send this mission's brief, approved plan, source references, and saved draft work to ChatGPT so it can finish the remaining steps. Your files stay in the same approved folder. ChatGPT may write differently, so the evidence review will run again. No new files outside this folder or live actions are approved.  
> **Continue with ChatGPT** · **Keep this paused**

If the operator previously enabled **“Let Foundry continue this mission with my connected providers”**, name the allowed providers and scope in that setting, allow revocation, and show a visible transition log. Mere connection is not consent. For a client with confidential material, the operator can choose to wait without losing work. Do not offer a hidden “use API credits” fallback. An advanced API billing route, if ever shipped, needs separate explicit opt-in, clear budget, and effective billing-source display.

After consent, the card changes to **“Moving the saved pack to ChatGPT…”** and then **“ChatGPT is continuing from your saved pack. The evidence brief and first concept remain intact.”** The new provider verifies the real files and completed steps before writing; it continues only unfinished work. The review step repeats against the final pack. The activity history records the provider transition and the preserved artifacts. If the check fails, the card says **“ChatGPT can't finish this step with the current access. Your work is saved. Review the blocked step or wait for Claude.”** Include the specific missing capability in plain language.

### Recovery contract behind the screen

- Persist a durable mission record with original instructions, goal, plan version, source list and provenance, acceptance criteria, completed/remaining steps, decisions, artifact paths and checksums, action outcomes, folder permission scope, and pending approvals. Save at step boundaries and before consequential actions. Keep the original brief addressable; a condensed summary alone is insufficient.
- Distinguish plan limit from expired login, overload, network loss, user stop, organizational refusal, and provider refusal. A refusal or revoked access cannot be bypassed by switching providers. If the classification is uncertain, pause and show a diagnostic next step rather than declaring a limit.
- Fence the old run and hold one active mission lease. A late response or double tap cannot create a second writer. Check partial files and uncertain side effects before resuming; never replay an external action when its outcome is unknown.
- Verify the replacement provider's signed-in account, effective billing source, mission capabilities, folder access, and approval transport. A connected badge is insufficient. Existing approvals retain only their original scope; pending or new actions require fresh decisions.
- Start a new provider session from the durable mission and actual files. Do not promise transfer of private reasoning or identical output. Bound recovery attempts to one per eligible provider for this interruption. If both plans are limited, leave the mission paused with saved work and honest wait/reconnect options.

Recovery success means the interrupted mission reaches a reviewable, evidence-checked pack without lost approved work or duplicate action. A new provider process starting is not success. Test limit before work, after one artifact, mid-write, after an uncertain action, with a pending approval, after restart, both directions, and both plans unavailable. Test with fake external actions and final artifact diffs before claiming this behavior publicly.

## 6. Empty, loading, error, and success copy

Every state states what happened, what was saved, and one useful next action. Buttons below are literal proposed copy; contextual file/provider names and counts are filled from persisted data.

| State | Main copy | Primary action | Secondary action |
| --- | --- | --- | --- |
| No projects | “No campaign pack yet. Start with one client, one product, and the facts you already have.” | “Prepare a campaign pack” | “See an example pack” |
| No provider | “Connect a ChatGPT or Claude plan to prepare the pack. Your brief can be saved first.” | “Connect ChatGPT” | “Connect Claude” |
| Login waiting | “Complete sign-in in your provider's window. This brief will stay here.” | “Return to Foundry” | “Cancel sign-in” |
| Login cancelled | “Connection was cancelled. Your brief is saved.” | “Try connecting again” | “Continue the brief” |
| Provider installed but unusable | “You're signed in, but this plan cannot run the campaign pack yet. Foundry will keep your brief.” | “Check connection” | “Choose another provider” |
| Network unavailable | “Foundry can't reach your provider right now. Your answers and files are saved.” | “Try again” | “Review the brief” |
| No usable sources | “We need a product fact or offer source before writing claims. Add one, or prepare an evidence-first plan.” | “Add a source” | “Plan from what I have” |
| Folder denied | “Foundry can't use this folder. Nothing was written there.” | “Choose another folder” | “Review the plan” |
| Plan approval pending | “Your plan is ready. Check the sources, output folder, and actions before work starts.” | “Approve plan and folder” | “Edit plan” |
| Work paused for a decision | “The draft is saved. One offer term needs your answer before the next step.” | “Answer the question” | “Review saved work” |
| Provider plan limited | “This provider has reached its plan limit. Your pack is saved.” | “Continue with [other provider]” when eligible | “Wait for [provider]” |
| Both providers unavailable | “Your pack is saved. Neither connected plan can continue now.” | “Review saved work” | “Check connections” |
| Review issue | “The pack is ready to inspect, but [N] claim needs a source or removal.” | “Review flagged claims” | “Open files” |
| Focused revision submitted | “We saved your change request. The accepted parts will stay as they are.” | “Review revised pack” when ready | “Open current pack” |
| Pack accepted | “Your campaign pack is ready for handoff. Review the files and open decisions before sharing.” | “Open files” | “Start another pack” |

Unsupported-plan copy must state the actual limitation observed by the connection doctor; do not recommend buying a higher tier unless provider eligibility and terms have been verified for the release. A raw provider message belongs only in an optional redacted diagnostic view. A 15-minute timer never forces acceptance or hides an error.

## 7. Activation analytics and quality gates

Instrument transitions in the desktop mission state, with opaque IDs kept out of third-party analytics and no client names, source text, file paths, prompts, tokens, or provider credentials in event payloads. A local event journal can support recovery; aggregate analytics require appropriate user notice and consent. Every event includes `schema_version`, `anonymous_install_id`, `mission_type`, `app_build`, `surface`, `timestamp`, and a coarse `provider_kind` only when relevant. Do not infer desktop activation from a web export.

| Event | Trigger | Purpose |
| --- | --- | --- |
| `onboarding_started` | First-run CTA opened | Denominator for the first-run path. |
| `provider_connect_started` / `provider_verified` / `provider_blocked` | Official login started; doctor verified actual run capability; or a categorized block | Separate login friction from eligibility and safety failure. |
| `outcome_selected` | User selects an available outcome | Outcome demand, without counting disabled cards. |
| `intake_saved` / `intake_ready` | Answers durably saved; minimum evidence check passes | Measure evidence friction; record coarse missing-input categories only. |
| `plan_presented` / `plan_approved` | Specific plan version rendered; human approves plan and folder | Measure review and approval drop-off. |
| `mission_started` / `checkpoint_completed` / `mission_paused` | Execution begins; named persisted checkpoint closes; or run pauses with reason | Separate provider time, user wait, and actual work. |
| `provider_limit_shown` / `provider_switch_consent` / `provider_continuation_started` / `provider_continuation_verified` | Limit classified; transfer approved; new run starts; final pack reaches review with preserved work | Measure recovery quality, not merely switch clicks. |
| `deliverable_opened` / `revision_requested` / `deliverable_accepted` | Preview opened; focused revision saved; all acceptance checks pass and user accepts | Primary activation funnel. |
| `upgrade_boundary_reached` / `upgrade_viewed` / `trial_started` | Locked paid action attempted; terms viewed; user explicitly starts trial | Validate upgrade relevance without interrupting first success. |

Primary metric: eligible installs whose first real campaign pack is accepted within 24 hours; report seven-day acceptance too. Report median and p75 install-to-open, connection-to-open, connection-to-accept, and active operator time separately. Segment by provider, Windows build, evidence completeness, first-run versus imported web brief, and recovery use without storing client details. Show stage conversion with exact numerators and denominators. Track guardrails: missing-source claims, changed locked copy, duplicate external actions, permission denials, provider misclassification, support contacts, failed exports, refunds, and day-7 repeat packs. Never call an unreviewed draft “completed.”

Emit each transition once per mission and plan version, after durable persistence, with a deduplication key. Distinguish `eligible_install` (supported Windows build, eligible provider, real mission) from all installs so a blocked connection is visible rather than hidden in the activation rate. Count a provider continuation as verified only when the same mission's saved work survives and the pack reaches review. Report the raw denominator beside every rate.

Proposed usability tests on a clean Windows build: five representative agency operators bring a real or realistic approved brief, connect their own eligible plan, reach and inspect the pack without technical help, and explain what Foundry can access. Observe the first block, time to reviewed artifact, focused revision, and limit recovery. Test 375 px, 390 px, and 1440 px, including long client names, keyboard overlap, contrast, and no horizontal scroll. Use fake data for automated external-action tests. These are tests to run, not outcomes already observed.

## 8. Free-to-Pro boundaries

**Free Local remains a complete first-outcome path:** one active project, two active workers, the campaign pack and its narrow variants when certified, manual runs, full approvals, durable checkpoints, basic export, and provider-limit continuation. A second provider may connect for recovery; it is not a paid safety feature. No card or upgrade prompt appears before the first pack is accepted. A free user can always open, revise, and export an existing pack, even after a trial ends.

**Pro is for repeat work and control:** proposed $29/month or $249/year, more saved projects, up to eight active workers subject to provider capacity, reusable client context and workflows, later opt-in schedules and advanced skills, and normal use of both providers. **Studio** is a later $79/month hypothesis for validated client workspaces and shared blueprint packages. These prices and the proposed 14-day no-card trial are not an active checkout or a provider usage allowance. Billing waits for product activation evidence and tested entitlement gates.

Offer an upgrade explanation only when the operator tries a paid repeat-work action, such as **“Create another active client project”** or **“Save this pack as a reusable workflow.”** The sheet must name the exact blocked action and benefit: “Your campaign pack is safe and exportable. Pro lets you keep multiple client projects active and reuse this workflow. Your ChatGPT or Claude plan is separate and keeps its own limits.” Actions: **“See Pro options”** and **“Keep using Free.”** Do not show an upgrade for a provider limit, a safety approval, a recovery connection, or opening a finished pack. Do not use “unlimited AI,” imply extra provider capacity, or start a trial silently.

## 9. Ship criteria and open dependencies

This document is the target experience, not evidence that it works. As inspected, `public/onboarding.js` has three setup screens and creates a project/team; it does not collect campaign evidence, present a mission plan for approval, or review/accept a pack. `core/outcomes.js` offers broad outcomes whose content does not match the launch campaign pack. `core/entitlements.js` and the onboarding screen introduce a Pro trial before the first accepted outcome. Provider status detects sign-in but does not establish every required capability or billing source. These gaps are implementation work, not claims that the new flow is live.

Before implementation claims or public copy, reconcile the narrower campaign-pack strategy with those entries, the current project-first interface, and the web proposal in [WEB_PRODUCT.md](WEB_PRODUCT.md). The [DESKTOP_ARCHITECTURE.md](DESKTOP_ARCHITECTURE.md) approval and provider contracts and [RELEASE_GATES.md](RELEASE_GATES.md) security gates remain binding. In particular, the current repository has no certified first-run flow, durable provider-to-provider mission transfer, or accepted-pack event.

Release proof needs a clean Windows install with both official provider routes, a usable campaign-pack mission, enforced folder/action approvals, evidence-checking review, safe export, restart recovery, and the provider-limit interruption suite. Capture real UI screenshots at 375 px, 390 px, and desktop only after implementation; none are produced by this copy document. Keep production untouched until the owner explicitly authorizes a release.
