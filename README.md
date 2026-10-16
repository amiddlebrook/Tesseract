# Tesseract — Edge Control Plane

A real, responsive event-processing control plane built with React + Vite and a **Cloudflare Worker**. GitHub Actions runs static type checks, API tests, a production build, and (when configured) automatic Cloudflare deployment.

> **No paid service is required.** The app needs no Gemini key, database, domain purchase, analytics subscription, or hosted build service. It targets Cloudflare Workers Free and GitHub Actions free quotas.

## What works

- **Overview:** real execution history, observed processing times, alert counts, and Cloudflare Worker health.
- **Edge topology:** queries /api/health for real colocation and round-trip data; shows the genuine browser → Worker → classification → routing path.
- **Pipeline lab:** edit JSON events and POST them to /api/pipeline/run. The Worker validates input, normalizes fields, scores severity, selects a deterministic route, and returns a trace with per-stage timings.
- **Analytics:** severity and route distribution from events actually processed on this browser. Export your local history as JSON.
- **Responsive UI:** handcrafted design system without runtime Tailwind CDN or vendor import maps.

There are **no fabricated CPU statistics, dummy network nodes, fake latency graphs, or fake running infrastructure processes**.

## Local development

Requires Node.js 22+ and npm.

    npm ci
    npm test
    npm run typecheck
    npm run dev:edge

Open **http://localhost:8787**. The dev:edge command builds the React app, then starts Wrangler locally. For fast UI-only editing, run **npm run dev** on port 3000 and **npx wrangler dev** in another terminal for the API proxy on port 8787.

## Free Cloudflare deployment

1. Create a free Cloudflare account and enable the workers.dev subdomain.
2. Create a Cloudflare API token with **Edit Cloudflare Workers** permissions, restricted to the intended account.
3. In this GitHub repository, open **Settings → Secrets and variables → Actions** and add **CLOUDFLARE_API_TOKEN** and **CLOUDFLARE_ACCOUNT_ID** as repository secrets. Never commit their values.
4. Merge the recovery pull request into **master** (or push changes to master). The **Cloudflare CI/CD** workflow runs tests and deploys with Wrangler automatically.
5. Open the deployment URL emitted by Wrangler in the GitHub Actions logs. A default Workers subdomain typically follows the pattern: https://tesseract-grid-os.<your-subdomain>.workers.dev

If secrets are missing, CI still verifies the app and explicitly skips deployment. This avoids CI failures while credentials are being configured. You can also deploy manually with **npm run deploy** after authenticating Wrangler locally.

The Worker configuration lives in **wrangler.jsonc**. Static assets and the API ship as a single Worker project; only /api/* paths invoke the Worker before assets.

## API

| Method | Path | Behavior |
|---|---|---|
| GET | /api/health | Actual Worker reachability, timestamp, and Cloudflare edge colocation when available |
| POST | /api/pipeline/run | JSON event processing, severity scoring, routing and timed stages |

Payload example:

    {
      "event": {
        "id": "evt-42",
        "source": "cloudflare-worker",
        "type": "threshold.breach",
        "severity": "critical",
        "message": "Queue latency exceeded target"
      }
    }

Scoring: low 15, medium 45, high 75, critical 95. Scores of 75+ take the priority-alerts route; other events use standard-events.

## Limits and privacy

- History is saved in the current browser's **localStorage**, with the latest 40 successful executions. It is not synchronized across devices and is not a shared observability backend.
- The Worker processes the submitted event in memory and does **not** persist or log the payload in application code. Standard platform request metadata and observability, if enabled in Cloudflare, are governed by account settings.
- Requests are limited to 32 KB and JSON objects with at most 100 top-level fields. Avoid submitting secrets or personal data into a public endpoint.
- The public API has no login or quotas per individual user. The Free plan has a shared limit of 100,000 Worker requests/day, and repeated misuse can consume the allowance. Static asset delivery is free and unlimited under the current platform policy.
- The pipeline is a deterministic reference implementation, not an actual Cloudflare account monitor or a third-party message queue.

## Architecture

    GitHub (master)
       ↓ GitHub Actions: npm ci → typecheck → API tests → Vite build
       ↓ Wrangler deploy (if secrets configured)
    Cloudflare Workers Free
       ├── Static Assets: React dashboard / SPA
       └── Worker: /api/health and /api/pipeline/run
                 ↓
             Browser localStorage (local history)

## Commands

    npm run dev           # Vite dev server; /api is proxied to local Wrangler
    npm run dev:edge      # Production-like local Worker and assets
    npm run build         # TypeScript + Vite build
    npm test              # Worker unit tests (no Cloudflare credentials required)
    npm run typecheck     # TypeScript verification
    npm run deploy        # Manual Cloudflare Worker deploy

## Cost objective

**$0 mandatory spend** within both providers' free tiers. Cloudflare requests beyond the free allowance fail or require an upgrade rather than being guaranteed unlimited. This project uses no D1/KV/R2/AI paid features, no custom domain, and no required credit-card-based service.

Built to stay simple, deployable, and honest about what is being measured.
