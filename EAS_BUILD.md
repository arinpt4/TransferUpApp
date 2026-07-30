# EAS Build Setup Guide

This guide covers the one-time setup needed to link this project to Expo Application Services (EAS) and run production builds.

## Prerequisites

- An [Expo account](https://expo.dev/signup) (free)
- Node.js installed locally
- The project cloned locally

## One-Time Setup

### 1. Install eas-cli globally

```bash
npm install -g eas-cli
```

> **Why global?** eas-cli ships with dependencies that contain known CVEs (e.g. older `tar`, `uuid`, `glob` versions). Installing it globally keeps those transitive deps out of the project's `node_modules` and `package-lock.json`, avoiding security-policy blocks in CI and Replit environments. The npm scripts in `package.json` use `npx eas` so they work with both a global install and `npx`'s automatic download fallback.

### 2. Log in to your Expo account

```bash
npx eas login
```

### 3. Link the project to EAS

Run this from the project root:

```bash
npx eas project:init
```

This command will:
- Create a new EAS project (or link to an existing one) under your Expo account
- Automatically write the `projectId` into `app.json` under `extra.eas.projectId`

After running it, `app.json` will look like:

```json
"extra": {
  "eas": {
    "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

Commit this change so all collaborators share the same project ID.

## Running Production Builds

Once the project is linked, trigger builds using the npm scripts defined in `package.json`:

| Command | Description |
|---|---|
| `npm run eas:build:production` | Build for both iOS and Android |
| `npm run eas:build:ios` | Build for iOS only |
| `npm run eas:build:android` | Build for Android only |
| `npm run eas:submit:production` | Submit to App Store & Play Store |

Or call eas-cli directly:

```bash
# Build both platforms
npx eas build --profile production --platform all

# iOS only
npx eas build --profile production --platform ios

# Android only
npx eas build --profile production --platform android
```

## Build Profiles

Profiles are defined in `eas.json`:

| Profile | Purpose | Distribution |
|---|---|---|
| `development` | Dev client for local testing | Internal (TestFlight / internal track) |
| `preview` | QA / staging builds | Internal |
| `production` | App Store / Play Store releases | Store submission |

The `production` profile has `autoIncrement: true`, so build numbers are managed automatically by EAS — no manual bumping needed.

## Store Credentials

EAS manages signing credentials for you:

- **iOS**: EAS can generate and manage provisioning profiles and certificates. When prompted during your first build, choose `Expo managed` credentials.
- **Android**: EAS will generate a keystore on first build. Choose `Expo managed` for the keystore.

> ⚠️ If you already have existing App Store / Play Store credentials, choose `Provide existing` and follow the prompts.

## CI / Automated Builds

The `eas-cli` package is included in `devDependencies`, so any CI environment that runs `npm install` will have it available.

For GitHub Actions or similar, set the `EXPO_TOKEN` environment variable to a token generated at [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens). Then run:

```bash
npx eas build --profile production --platform all --non-interactive
```

## Troubleshooting

**"Project not linked" error**: Run `npx eas project:init` and commit the updated `app.json`.

**Build fails on credentials**: Run `npx eas credentials` to inspect and fix credential issues.

**Version conflicts**: `eas.json` requires eas-cli `>= 16.0.0`. Check your version with `npx eas --version`.
