# Live Foundry agent turn ownership fix

Date: 2026-10-02. Status: review patch, **not applied to live Foundry**.

This fixes the private runtime's Claude-slot/Codex queue race reported by the commander. It does not replace the commercial product's `server.js`.

`/home/harel/foundry` is not a Git checkout. To avoid editing a watched live file or publishing the private application, this branch carries a unified patch against its inspected `server.js`, plus tests and a safe reproduction runner. No private state, transcripts, vault, or account material is included. The branch starts at the published `origin/codex/production-launch`, excluding the team's unrelated unpushed work.

Inspected source SHA-256:

```
11f753e34b6cc4a262b2f821114d32a11122c9e60a511ddf2825d10349cfb1b7
```

## Root cause and changes

- Queue dispatch trusted `busy` without checking the existing child or a pending launch. A turn now owns a lease independent of the UI flag. Queue and direct-message entry paths check that ownership and any retained child/PID.
- Stop cleared state while a Claude slot promise remained pending. Slot waiters are now cancellable and removed from the FIFO. A slot belongs to its original turn and is released once, including cancellation after allocation but before the promise callback.
- Stop's timeout could detach a still-running child. It now waits for the child close callback; `child.killed` means a signal was requested, not that the process exited. Existing whole-tree termination remains in place.
- Claude late output/error/close handlers could overwrite a newer Codex turn. Both runners now check the captured turn's ownership. Codex also checks again after asynchronous executable resolution.
- Engine, model, reasoning-effort and account edits while working are persisted for the next turn. The activity label names the pending selection without pretending the current process changed providers. The existing edit implementation was moved into a reusable helper; unrelated edit behavior is preserved.
- A transient resume-writer conflict previously consumed its message. The same queue item, including metadata, returns to the head and is persisted with a bounded exponential retry delay of 1–30 seconds. No retry count discards the message. A direct message is likewise saved. Stop/halt still blocks automatic draining.
- Automatic retry is restricted to writer conflicts before productive output. A failure after tool activity remains an error for reconciliation, avoiding replay of an uncertain side effect. Other errors keep their prior behavior.

This does not recover the seven messages already reported lost, change account/model eligibility, or widen the private runtime's permissions.

## Reproduce without touching live state

From the review branch:

```sh
node fixes/live-turn-ownership/run-tests.cjs --source /home/harel/foundry/server.js --baseline
node fixes/live-turn-ownership/run-tests.cjs --source /home/harel/foundry/server.js
```

The runner only reads the supplied source, copies that one file into a disposable directory, validates/applies the patch there, syntax-checks it, and runs the actual runtime functions in a VM with fixture dependencies. It never boots the server, loads its private modules, reads credentials, invokes a provider, or calls the live API. Child processes, clocks, slot waits and stream events are controlled fixtures. Test subprocesses receive a minimal environment, without injected business credentials.

Observed results against the source hash above:

```
Baseline: tests 17, pass 2, fail 15, skipped 0, exit 1
Patched:  tests 17, pass 17, fail 0, skipped 0, exit 0
Syntax check: node --check on the patched server.js, exit 0
Patch check: git apply --check in the isolated directory, exit 0
```

The three requested reproductions fail meaningfully against the original source: two Codex children instead of one; a stopped waiter still marked waiting; and the second message replacing the first at the queue head. Additional tests cover delayed close, stale events, asynchronous launch cancellation, cancelled middle waiters, repeated conflicts, direct-message failures, zero-exit failure events, restored active PIDs, deferred edits, and avoiding replay after productive work.

## Reviewer application

Apply only to an isolated copy of the private runtime first:

```sh
# Run inside the reviewer's isolated private-runtime copy, never the live folder.
git apply --check /path/to/review-branch/fixes/live-turn-ownership/server.patch
git apply /path/to/review-branch/fixes/live-turn-ownership/server.patch
cp /path/to/review-branch/fixes/live-turn-ownership/test/turn-ownership.test.js test/turn-ownership.test.js
node --check server.js
node --test test/turn-ownership.test.js
```

The test filename fits the live package's `node --test test/*.test.js` suite. It defaults to that copy's `server.js`; the isolated runner instead supplies an explicit source path. Refuse a patch-context mismatch and review intervening changes. Do not replace the private server with the commercial product server.

Still unproven: end-to-end HTTP/browser behavior on the running private service, actual provider process timing, and Windows runtime execution. No production restart, deployment, real-provider turn or live-message replay was performed. Commander review and a separately authorized live application/restart remain necessary.
