# Foundry

Foundry is an outcome workspace for business operators who already use Claude or ChatGPT. It gives a real job a small role-based team, one local workspace, an agreed deliverable, and a review step.

The commercial launch is intentionally narrower than the private Foundry used by Tiger Brands Global. It starts with small ecommerce agencies preparing campaign work for clients. TikTok/Reel and business-specific modules are not included.

## Product surfaces

- **Desktop:** local file and command tools through the official Claude Code and Codex CLIs. Authentication stays with Anthropic and OpenAI.
- **Web planner:** prepares and exports a `foundry.mission.v1` file. It does not access local files, run agents, or remotely control a desktop.
- **Sales site:** `site/`, ready for GitHub Pages after an authorized manual workflow run.

## First-run flow

1. Connect Claude or Codex through the provider's official sign-in flow.
2. Choose a business outcome instead of starting with an empty chat.
3. Select a local workspace folder.
4. Foundry creates two workers and one named deliverable.
5. Open the deliverable and explicitly accept it or request a revision.

The default permission mode is `acceptEdits`; provider sandboxes and approval boundaries still apply. External or irreversible actions are not part of the launch workflow.

## Develop

Requires Node.js 22 for development. End users receive Electron's bundled runtime and do not need Node.js for Foundry itself.

```bash
npm ci
npm test
npm run desktop
```

Local browser development:

```bash
npm run dev
```

Web planner and sales site:

```bash
npm run site
```

## Package

```bash
npm run pack
npm run dist:win
```

The Windows target is a per-user assisted NSIS installer. The manual GitHub workflow builds a pilot artifact and never publishes a release automatically. A public production release additionally requires:

- an approved Windows code-signing identity;
- a clean Windows 11 installation, login, execution, uninstall, and recovery run;
- commercial/legal review of the exact Claude Code and Codex distribution;
- a real two-provider continuation test for the supported campaign workflow.

See [release gates](docs/RELEASE_GATES.md) and the [desktop architecture](docs/DESKTOP_ARCHITECTURE.md).

## Security boundaries

- The service binds to `127.0.0.1` only.
- Packaged desktop sessions use a random HttpOnly local session cookie.
- Agent keys are neither returned by `/api/state` nor serialized to `data.json`.
- State writes use a temporary file, backup, and atomic rename.
- Renderer isolation is enabled; Node integration is disabled.
- Provider login is launched by the official CLI. Foundry does not capture a subscription token.
- App state is stored under Electron's per-user application-data directory.

Foundry sends selected context to the provider the user chooses; "local" does not mean offline inference.

## Plans under validation

- **Free Local:** one project, two workers, manual runs.
- **Pro:** proposed at $29/month or $249/year, with saved projects, up to eight workers, reusable outcomes, and two-provider continuity.
- **Studio:** proposed at $79/month after team demand and capacity are proven.

The 14-day no-card Pro feature trial starts when the first promised outcome is opened and accepted, not while the user is still setting up. Afterward the install remains useful on Free Local. Provider usage is billed by the provider and is never advertised as unlimited.

## Repository map

```text
core/       providers, outcomes, entitlements
desktop/    Electron main process and preload bridge
public/     local desktop renderer
site/       sales site and browser-only mission planner
test/       deterministic Node tests
docs/       product, positioning, architecture, onboarding, and release gates
```
