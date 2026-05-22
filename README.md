# Consistify Time Tracker

> **Automatically track your active coding time and sync it to your [Consistify](https://consis-sigma.vercel.app) dashboard — effortlessly.**

[![Version](https://img.shields.io/visual-studio-marketplace/v/TechifyCoder.consistify-time-tracker?label=VS%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=TechifyCoder.consistify-time-tracker)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/TechifyCoder.consistify-time-tracker)](https://marketplace.visualstudio.com/items?itemName=TechifyCoder.consistify-time-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🕐 **Smart Time Tracking** | Silently tracks your active coding time across all languages and projects. |
| 📊 **Dashboard Sync** | Automatically syncs your sessions to your [Consistify dashboard](https://consis-sigma.vercel.app/dashboard/vscode) every 15 minutes. |
| 📡 **Offline Resilience** | Queues up to 500 sessions locally when offline — syncs as soon as you're back. |
| 🛡️ **Anti-Cheat Engine** | Detects and discards idle/passive sessions so your stats stay accurate. |
| 🖥️ **Terminal Tracking** | Counts active terminal usage with smart caps to prevent idle time inflation. |
| 🔒 **Secure Storage** | API key is stored in VS Code's encrypted Secret Storage — never in plain text. |
| 🌍 **Language Aware** | Tracks the programming language you're working in for detailed breakdowns. |

---

## 🚀 Quick Start

1. **Install** the extension from the VS Code Marketplace.
2. Open the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Run **`Consistify: Set API Key`**.
4. Head to your [Consistify Dashboard](https://consis-sigma.vercel.app/dashboard/vscode), copy your **Extension Token**, and paste it in.
5. **Start coding.** Time tracking begins immediately in the background. ✅

---

## ⌨️ Commands

Access these from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---|---|
| `Consistify: Set API Key` | Links the extension to your Consistify account by storing your token securely. |
| `Consistify: Clear API Key` | Removes your token and pauses syncing. |

---

## ⚙️ How It Works

The extension listens to VS Code editor events (typing, scrolling, file switching, window focus, terminal usage) and batches them into **heartbeat payloads**. These are:

1. **Cached locally** after each coding session ends (idle timeout, window blur, or VS Code close).
2. **Synced to the server** every 15 minutes, on window blur, or on shutdown.
3. **Retried automatically** if a sync fails due to network issues.

An **anti-cheat engine** scores each 5-minute activity window. If 25+ consecutive minutes show low activity scores, that time is discarded before syncing.

---

## 🔒 Privacy

- This extension **only collects**: timestamp, active duration (in seconds), programming language, and workspace folder name.
- **No file names, file paths, or code content** are ever collected or transmitted.
- All data is sent exclusively to `https://consis-sigma.vercel.app` using your personal API key as authentication.
- Your API key is stored using **VS Code's built-in Secret Storage** (OS keychain on most systems).

---

## 📋 Requirements

- VS Code `1.85.0` or higher
- A free [Consistify account](https://consis-sigma.vercel.app)

---

## 🛠️ Development

To build or contribute to this extension locally:

```bash
# 1. Clone the repository
git clone https://github.com/TechifyCoder/consistify-time-tracker-vs-code.git
cd consistify-time-tracker-vs-code

# 2. Install dependencies
npm install

# 3. Compile TypeScript
npm run compile

# 4. Press F5 in VS Code to launch the Extension Development Host
```

---

## 📄 License

MIT © [Satish Patel](https://github.com/TechifyCoder/consistify-time-tracker-vs-code) — see [LICENSE](LICENSE) for details.
