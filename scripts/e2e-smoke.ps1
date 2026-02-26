# E2E smoke: open Convertr web app, wait for load, snapshot interactive elements.
# Prereqs: agent-browser installed globally, web app running (e.g. pnpm dev).
# Usage: .\scripts\e2e-smoke.ps1 [baseUrl]

param(
  [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
agent-browser open $BaseUrl
agent-browser wait --load networkidle
agent-browser snapshot -i
