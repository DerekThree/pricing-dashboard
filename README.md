# pricing-dashboard

Pricing data, Simulator options, and Application Date requests use the Backend. Simulator batches
use the Mock Account Processor and display its HTTP 202 batch ID and acceptance message.
The Simulator also receives complete Transaction Batches over the Mock Transaction Processor's
native WebSocket connection, validates incoming data against its generated canonical schema,
and displays results for the current batch. Reset clears acceptance and results, retaining drafts.

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

`npm run generate:transaction-batch` cleans `app/generated/transactionProcessor/`, generates
TypeScript models from `pricing-mock-server/schemas/transaction-batch-v1.json`, and copies that
schema for browser validation. Run from the sibling repository workspace, as with HTTP generation.
The Mock Server's `asyncapi.yaml` references this provider-owned schema.

`TRANSACTION_PROCESSOR_WS_URL` supplies the full browser-visible WebSocket URL, independently of
the HTTP providers, in native development or Docker's startup-generated `/config.js`.
Development defaults to `ws://localhost:8081/api/v1/mock/txn/batches`. An empty runtime value,
or an unset production value, uses `/api/v1/mock/txn/batches` on the Dashboard's current host,
with `ws` for HTTP or `wss` for HTTPS. Production retains the current ECS/ALB baseline following
the S3/CloudFront rollback. Automatic reconnection and deployed verification are later tickets.
