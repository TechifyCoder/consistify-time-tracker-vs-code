# Changelog

All notable changes to the **Consistify Time Tracker** extension will be documented here.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-05-22

### Added
- **Automated coding time tracking** — silently tracks active time across all files and languages.
- **Dashboard sync** — batches heartbeats and syncs to your Consistify dashboard every 15 minutes, on window blur, or on VS Code shutdown.
- **Offline resilience** — queues up to 500 payloads locally when offline, retries automatically on next sync.
- **Anti-cheat engine** — detects and discards passive/idle sessions (25+ minutes of low activity) to ensure accurate stats.
- **Terminal tracking** — counts active terminal usage, with a 10-minute passive cap to prevent idle inflation.
- **AI-paste detection** — distinguishes large AI-generated insertions from manual typing for nuanced scoring.
- **`Consistify: Set API Key`** command — securely stores your extension token using VS Code's built-in Secret Storage.
- **`Consistify: Clear API Key`** command — removes credentials and pauses syncing.
- **First-run welcome notification** — guides new users to connect their account on first activation.
