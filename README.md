# pricing-dashboard

Pricing data, Simulator options, and Application Date requests use the Backend. Simulator batches
use the Mock Account Processor and display its HTTP 202 batch ID and acceptance message.

For native development, set `BACKEND_API_URL` and `ACCOUNT_PROCESSOR_API_URL` in the environment
or `.env` before `npm run dev`. Defaults are `http://localhost:8080` and `http://localhost:8081`.

Docker reads both variables at startup and writes them to the browser's `/config.js` runtime
configuration. Use addresses reachable by the browser. Unset production addresses use same-origin
paths, preserving AWS routing for `/api/*` and `/api/v1/mock/*`.
Production ignores native build-time provider URLs, including values loaded from `.env`.

`npm run test:browser` starts its own development server on port 5174 with provider URLs set by
`playwright.config.ts`. It does not reuse the running application or require shell URL overrides.

`npm run generate:api` cleans and regenerates the Backend client under `app/generated/backend/` and
the Mock Account Processor client under `app/generated/accountProcessor/` from their respective
provider-owned OpenAPI contracts.
