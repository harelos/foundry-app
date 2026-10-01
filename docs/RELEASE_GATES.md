# Foundry release gates

**Decision: BLOCKED for a commercial desktop or web release (2026-10-01).** This is a gate specification and a review of the current public repo, not a certification of the VPS runtime. The launch branch is `codex/production-launch`. No production deployment is authorized by this document.

## Scope and evidence

The target is the product in [PRODUCT_BRIEF.md](PRODUCT_BRIEF.md): a Windows desktop app that runs approved local agents, plus a web workspace that plans and drafts without local execution. The existing `/home/harel/foundry` VPS app is a separate, private runtime. Its control token, vault, mobile bridge, desktop shell, and recovery code are architectural references only. Do not copy its state, transcripts, business modules, vault, or credentials into this repo.

Review evidence from this branch:

- `server.js`, `reel.js`, `public/*`, `start.bat`, `package.json`, `.gitignore`, and `README.md` were inspected. `docs/PRODUCT_BRIEF.md` was read. No private transcript or credential file was opened.
- `node --check` passed for the four JavaScript files. `npm test` fails because this repo has no test script.
- A fresh `git archive HEAD` extracted to a disposable directory booted with an empty home and no provider credentials. It created an empty workspace. An unauthenticated `POST /api/projects` succeeded.
- In a second disposable install, a **fake** agent key was returned by unauthenticated `GET /api/state` and written verbatim to `data.json`. No real key was used.
- The public repo has no Windows installer, updater, web workspace, onboarding flow, or rollback procedure to test. A running development server is not evidence of those features.

Every gate below needs a reproducible test command or scripted scenario, its result, the tested artifact hash/version, and the reviewer name in the release evidence bundle. A screenshot or a UI label alone cannot close a security gate. All P0 and P1 gates must pass on the **packaged build** and on a clean Windows user profile before release. A failed or missing gate blocks release.

## Threat model

### Assets and trust boundaries

Protect provider login material, optional API keys, project files, customer data, agent instructions and outputs, local process privileges, signed update integrity, and the user's ability to revoke or delete data. The attacker may be a malicious web page on the same machine, an unauthenticated LAN user, a malicious prompt or project file, a compromised dependency/update source, another local OS user, or a compromised web session. Assume agent output and imported files are untrusted even when a user initiated the mission.

```text
Untrusted web page / LAN client ──HTTP──> local API ──> agent process ──> approved folder
                                           │                 └──> provider CLI / OS tools
                                           └──> local state and secret store
Browser web workspace ──HTTPS──> web service ──explicit export/import──> desktop
Installer / update feed ──signed artifact──> desktop runtime and local data migrations
```

| Boundary and threat | STRIDE | Required control and proof |
| --- | --- | --- |
| Web page or LAN client calls the local API and starts an agent | Spoofing, elevation, information disclosure | Bind to loopback; authenticate every private route; reject foreign `Origin` and `Host`; test LAN, DNS rebinding, cross-site form/fetch, and an unauthenticated request. |
| Agent prompt, imported blueprint, or attachment induces shell/file/network actions outside the approved mission | Tampering, elevation | Server-enforced capability allowlist, sandboxed working folder, explicit approval for consequential actions, immutable approval scope; adversarial prompt and path/symlink escape tests. |
| Agent process inherits the app's entire environment or another provider's token | Information disclosure, elevation | Per-run environment allowlist and per-provider isolated login; canary secrets must never appear in the wrong child, transcript, network request, or export. |
| Raw token or CLI login result is exposed by API, browser, log, backup, or export | Information disclosure | Provider-owned or OS-protected storage; metadata-only API; secret redaction; fixture-based scan of every output and persisted file. |
| Stop, crash, or app exit leaves a child process or continuing scheduled work | Tampering, denial of service | Process-group ownership, bounded cancellation, crash recovery, no silent restart of an unapproved action; process-tree test. |
| Installer or updater replaces binaries or migrates data without verified provenance | Tampering, elevation | Signed installer and updates, pinned channel and origin, signature and version checks before execution, atomic swap and tested rollback. |
| Delete leaves records in backups, exports, or worker scratch space | Information disclosure, repudiation | Deletion inventory, user-visible scope and retention, test on all stores; audit receipt without retained secret content. |
| Web UI suggests it can touch the user's computer | Spoofing, repudiation | Server-side capability separation, truthful copy, no local API bridge in web build, explicit desktop handoff with consent and validation. |

## Objective release gates

### G1. Clean install and packaging (P0)

- Build a versioned, signed Windows installer from the release commit. Record SHA-256, signer, version, and build command. A fresh Windows 11 standard-user profile with no Node, Claude, Codex, `.foundry-accounts`, or old Foundry state can install, launch, close, relaunch, and uninstall without a terminal or copied files.
- First launch remains useful without either provider: onboarding explains the missing connection and offers a planning path. No sample business/customer data or real credentials ship. A failed or cancelled login leaves an actionable retry state, never a fabricated connected state.
- Test a clean install, upgrade from the previous released version, and install after a failed prior setup. Verify installed files, file ownership/permissions, Start menu entry, and no unintended startup task/service. Uninstall behavior must match the deletion promise in G6.
- **Current:** no installer or packaged build in this repo; gate untested.

### G2. Authentication and local API (P0)

- Desktop connects Claude Code and Codex through their **official browser login flows**. The app never asks for or captures a subscription token, intercepts OAuth output, or writes login material into its own JSON state. API keys are optional and clearly separate.
- A local API request without the app session is denied for all private reads and writes, including state, transcripts, project files, accounts, uploads, agent run/stop, and exports. Cross-origin and non-loopback attempts fail. The desktop session cannot be reused by an arbitrary web page. Test missing, stale, forged, and revoked sessions; foreign `Origin`/`Host`; DNS rebinding; and loopback requests from a different process.
- Web authentication has secure session handling, CSRF protection for state-changing requests, revocation, and server-side authorization. A web session cannot authenticate to a desktop execution endpoint by merely adding `?desktop=1` or changing client-side flags.
- Connection doctor verifies the selected CLI is installed and the account is actually usable with a harmless provider-specific check. It reports unsupported plans, login cancellation, expired sessions, and network failure honestly. No fallback silently switches account or billing mode.
- **Current:** `server.js:763-771` has no route auth; `server.js:881-918` returns/caches tokens; `public/index.html:1328-1333` asks users to paste a Claude token. The disposable install accepted an unauthenticated project create.

### G3. Local process lifecycle (P0)

- Only approved missions launch subprocesses. Spawn a known executable with an argument array and `shell: false`; validate working directory and binary identity. Reject user-controlled executable paths, shell metacharacters as executable input, and symlink escapes. Limit concurrent workers, turn duration, output size, and request body size.
- Stop, app exit, crash, and timeout terminate the **whole process tree** within a defined bound (target: 5 seconds) and mark the mission accurately. On restart, the app reconciles orphaned work and asks before resuming consequential actions. Retry does not duplicate a side effect.
- Test on Windows with a fixture CLI that forks a child and grandchild, ignores normal termination, and emits large output. Verify all descendants are gone and the UI status matches the OS. Test two simultaneous agents and account/profile isolation.
- **Current:** `server.js:258-266` uses `taskkill` on Windows but only kills the direct child on Unix; several runners use `shell: true` (`server.js:322,500,588,695`). No packaged lifecycle test exists.

### G4. Permissions and approvals (P0)

- Default mode is least privilege. The user approves the plan and exact working folder before execution. Read, write, process, network, publish, spend, secret access, and delete capabilities are enforced by the runtime, not by a UI warning or an instruction in the prompt.
- Consequential actions are paused for explicit, scoped approval showing the actor, target, exact effect, and expiry. Approvals are single-use and bound to the intended operation; changed parameters require a new approval. Denial and timeout stop the action. Record a redacted audit event.
- A hostile prompt, edited blueprint, or web import cannot turn on `bypassPermissions`, widen the folder, invoke an unapproved tool, or skip a checkpoint. Test direct API calls as well as UI flows. Disabled experimental engines have no executable route in the commercial build.
- **Current:** `server.js:13` and `start.bat:6` default to `bypassPermissions`; the API accepts caller-chosen `cwd` and agent settings (`server.js:1013-1080`). The public repo has no server-enforced approval ledger.

### G5. Credential and data isolation (P0)

- Local subscription credentials remain in provider-owned storage or OS-protected storage. Optional API keys use OS-protected storage with a reference in app state. Separate users, projects, providers, and workers cannot read each other's secrets. Child environments contain only the minimum provider variables for that run.
- `GET /api/state`, account APIs, error bodies, logs, transcripts, exports, browser storage, and backups contain no raw tokens. Masking in the UI is insufficient; test response bodies and files with fake canary values. Scan the release artifact and tracked repo for secrets and private business data; any high-confidence hit blocks until removed and rotated where real.
- State writes are atomic and crash-safe. Corrupt or zero-filled state must not be overwritten by a blank workspace; recovery selects a verified backup and explains the result. Test power-loss simulation and migration replay with fixture data.
- **Current:** `server.js:99-111` writes API/OAuth keys and transcripts to plaintext `data.json`; `server.js:139-158` returns agent keys from `/api/state`; `server.js:845-862` copies provider credentials to a backup folder; `server.js:275-305` passes the full parent environment to children. The fake-key test confirmed API and disk exposure. `.gitignore` prevents accidental tracking of named state files but does not protect runtime data or future paths.

### G6. Data deletion and export (P1)

- Publish a data inventory covering app state, provider-owned login state, uploads, agent scratch files, transcripts, logs, cached browser data, schedules, local backups, cloud/web data, and user-created exports. State exactly what project deletion, account disconnect, uninstall, and web-account deletion remove or retain.
- Confirm deletion of the selected scope, stop dependent jobs first, and return a completion receipt. A second delete is safe. Verify no deleted canary remains in app-owned active files, backups, or web records after the stated retention period. Never delete provider-owned credentials or user exports silently.
- Export contains only selected project data and excludes secrets by construction. Import validates schema/version, size, paths, signatures where used, and capabilities; it presents a preview and requires approval before creating workers or touching files.
- **Current:** project/agent/account deletion removes in-memory records and saves state (`server.js:1044-1078`, `server.js:981-984`); backup files and account config directories are not addressed by that deletion path. No policy or test exists.

### G7. Installer and updater integrity (P0)

- Installer and update manifest/artifacts have a verifiable publisher signature; the app verifies signature, hash, product ID, channel, and monotonically increasing version before replacing code. Downloads use authenticated HTTPS from an allowlisted origin. Failed, modified, unsigned, wrong-channel, and downgraded artifacts are rejected before execution.
- Update stages beside the current version, validates compatibility and disk space, snapshots only nonsecret metadata needed for recovery, then switches atomically. No updater runs with broader privileges than required. A failed launch restores the prior binary and usable data; schema migrations have a tested forward/rollback plan.
- Test offline, interrupted download, tampered manifest, tampered binary, process still running, migration failure, and forced rollback on a disposable Windows profile. Record hashes and logs with secrets redacted.
- **Current:** no installer, update feed, version migration, or rollback code in the public repo.

### G8. Web/desktop capability truth (P0)

- Web can plan, research, draft, and export a mission. It cannot browse local folders, start/stop local agents, read local credentials, or imply remote control. Desktop import shows requested folder, tools, and effects before approval. A web-originated mission remains inert until the desktop user explicitly imports and approves it.
- Product copy, pricing matrix, onboarding, and error states map to demonstrated behavior. Test every visible capability claim in the final web and desktop builds; record the assertion and the passing test. Paid plan use must be described according to the official provider flow actually shipped.
- Test hostile imports, copied URLs, `?desktop=1`, forged client capability flags, and a browser with no desktop app. Desktop-only API routes reject web credentials server-side.
- **Current:** `server.js` serves one local UI with powerful APIs; the repo has no separate web workspace, export/import handoff, or server-side capability boundary. The current README describes broad local autonomy and no auth, which conflicts with the brief.

### G9. Automated and manual tests (P0)

- CI runs syntax/lint, unit tests for policy and auth, API abuse tests, installer smoke tests, clean-profile end-to-end tests, secret-canary tests, and data migration/recovery tests. Tests use fake providers and fixture data; they never send real messages, spend money, or access the owner's vault.
- Release QA repeats the packaged Windows smoke path: install → official login (test account) → choose outcome → approve plan/folder → run a harmless file fixture → stop/restart → review deliverable → export → uninstall. A second path covers login unavailable/cancelled. Record elapsed times and failures; a tap that appears inert is a failed UI test.
- Verify at 375 px, 390 px, and desktop for onboarding, connection status, approvals, and capability explanations. No clipped text, horizontal scroll, or hidden consequential action.
- Every test failure is triaged against the release commit. No "expected" failure is waived without a documented scope decision and a new gate. **Current:** no `test` script; `npm test` fails. Only syntax checks and the two disposable-install probes above have run.

### G10. Rollback and release decision (P0)

- Keep the last known good signed installer and an independently restorable backup of user data. Document how to revert the binary without reverting credentials, how to restore/migrate data safely, and how to disable a bad update feed. Exercise rollback after a failed update and after a failed migration; verify project count and fixture content by readback.
- A release record includes commit, artifact hashes, gate evidence, known limitations, reviewer, and explicit release decision. Release QA blocks if any P0/P1 gate is missing or if a landing-page claim lacks a passed behavior test. Production deployment is a separate owner-controlled action and is never performed from this VPS.
- **Current:** no release record or rollback mechanism in this repo. Decision remains **BLOCKED**.

## Current public-repo blockers, ordered

1. **P0: unauthenticated local control API and unrestricted bind.** `server.listen(PORT)` in `server.js:1241` specifies no loopback host; the router has no auth. A disposable install allowed unauthenticated project creation. This permits workspace reads and agent execution wherever the port is reachable.
2. **P0: secret exposure.** Agent/account keys are stored in plaintext and returned by `/api/state` (`server.js:99-158,771`). A fake-key fixture verified both paths. The UI also offers token capture/paste (`server.js:881-918`, `public/index.html:1328-1333`).
3. **P0: unsafe execution defaults.** `bypassPermissions` is the default, caller-supplied folders are accepted, and multiple engines spawn via a shell (`server.js:13,322,500,588,695,1013-1080`). There is no enforceable approval boundary.
4. **P0: no commercial installer/updater or web boundary.** The repo contains a development batch launcher and a single local UI, not the two surfaces promised by the brief. No clean packaged Windows install can be certified.
5. **P0: no release test suite or crash-safe state recovery.** `npm test` has no script. `saveData()` copies and rewrites JSON synchronously without atomic replace or verified recovery (`server.js:89-115`).
6. **P1: deletion and rollback are undefined.** Current delete routes remove records but do not cover backups/config folders; no update rollback or retention policy is present.

These findings apply to this branch's public-repo code. They do **not** assert that the private live VPS app has the same implementation or that its presence closes any commercial release gate.
