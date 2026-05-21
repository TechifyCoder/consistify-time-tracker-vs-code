# Consistify Time Tracker

Consistify Time Tracker is a VS Code extension that automatically tracks your active coding time and syncs it to your Consistify dashboard. Stay consistent and monitor your coding habits effortlessly!

## Features

- **Automated Time Tracking:** Silently tracks your active time in VS Code.
- **Dashboard Sync:** Syncs your coding sessions directly to your Consistify account.
- **Easy Configuration:** Set up once with your Consistify API key and let it run in the background.

## Commands

This extension contributes the following commands to the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

* `Consistify: Set API Key`: Configures the extension with your Consistify API key to enable syncing.
* `Consistify: Clear API Key`: Removes your API key and stops syncing to your dashboard.

## Setup

1. Install the extension in VS Code.
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Run `Consistify: Set API Key`.
4. Paste your API key from your Consistify dashboard.
5. Start coding! The extension will track your activity in the background.

## Requirements

- VS Code version 1.85.0 or higher.
- A Consistify account and API key.

## Development

If you want to contribute or build the extension locally:

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Open the project in VS Code.
4. Press `F5` to run the extension in a new Extension Development Host window.
