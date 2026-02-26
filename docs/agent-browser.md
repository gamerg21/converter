# agent-browser in Convertr

**agent-browser** is a fast browser automation CLI for AI agents (Playwright under the hood). It was installed globally and can drive the Convertr web app for E2E flows, visual checks, and debugging.

## How it helps this project

| Use case | How |
|----------|-----|
| **E2E testing** | No Playwright/Cypress in the repo yet; `agent-browser` can open the app, take snapshots, click/fill/upload, and assert without adding test deps. |
| **Visual regression** | `screenshot`, `screenshot --full`, `screenshot --annotate`, and `diff screenshot --baseline` for UI consistency. |
| **Accessibility / structure** | `snapshot -i` (interactive elements) or `snapshot -c` (compact) gives an accessibility tree with refs (`@e1`, `@e2`, …) for reliable selectors. |
| **CI / scripts** | Commands chain with `&&`; one browser session runs via daemon. Good for “smoke” scripts that load the app and run a critical path. |
| **Local debugging** | `--headed` to watch the browser; `trace start/stop`, `profiler start/stop`, `record start/stop` for performance and behavior. |

## Quick start

1. **Install browser (once)**  
   ```bash
   agent-browser install
   ```

2. **Start the app** (e.g. `pnpm dev` in another terminal) so the web app is on `http://localhost:3000` (or your configured port).

3. **Open and snapshot**  
   ```bash
   agent-browser open http://localhost:3000
   agent-browser wait --load networkidle
   agent-browser snapshot -i
   ```
   Use the printed refs (e.g. `@e2`) for clicks:  
   `agent-browser click @e2`

4. **Chain a short flow**  
   ```bash
   agent-browser open http://localhost:3000 && agent-browser wait --load networkidle && agent-browser snapshot -i
   ```

## Project config

Optional project-level config: **`agent-browser.json`** in the repo root (see root of this project). Example:

- `headed: true` – show browser during local runs
- `downloadPath` – where conversion downloads go when testing
- `sessionName` – persist cookies/localStorage for repeat runs

Config is merged with `~/.agent-browser/config.json`; CLI flags override.

## Example: smoke check script

From repo root, with the web app already running:

```bash
# Open home, wait for load, snapshot interactive elements
agent-browser open http://localhost:3000 && agent-browser wait --load networkidle && agent-browser snapshot -i

# Optional: full-page screenshot
agent-browser screenshot --full e2e-home.png
```

You can turn this into a small script (e.g. `scripts/e2e-smoke.sh` or `.ps1`) and run it in CI after `pnpm dev` (or against a deployed URL).

## Useful commands for Convertr

- **Upload flow**: After snapshot, use `upload <sel> <file>` with the file input’s ref.
- **Check jobs**: `agent-browser get text @e<N>` for job table content; `find role button click` for actions.
- **Screenshots**: `agent-browser screenshot --full` or `--annotate` for docs/visual diffs.
- **Diff two states**: `agent-browser diff snapshot` or `diff screenshot --baseline baseline.png`.

## Docs and options

- Full CLI: `agent-browser --help`
- Config locations and env: `AGENT_BROWSER_*` (see `--help` output).
