# pricing-dashboard

Pricing data, Simulator options, and Application Date requests use the Backend. Simulator batches
use the Mock Account Processor and display its HTTP 202 batch ID and acceptance message.

For native development, set `BACKEND_API_URL` and `ACCOUNT_PROCESSOR_API_URL` in the environment
or `.env` before `npm run dev`. Defaults are `http://localhost:8080` and `http://localhost:8081`.

Docker reads both variables at startup and writes them to the browser's `/config.js` runtime
configuration. Use addresses reachable by the browser. Unset production addresses use same-origin
paths, preserving AWS routing for `/api/*` and `/api/v1/mock/*`.
Production ignores native build-time provider URLs, including values loaded from `.env`.

For manual S3/CloudFront publishing, apply the existing `deploy/aws` Terraform root,
then run from the parent pricing-app repository:

```powershell
. .\deploy\setup.ps1
Publish-Dashboard
```

This builds `build/client`, writes the equivalent runtime `config.js`, uploads to the private
Dashboard bucket, and invalidates CloudFront. AWS CLI infers asset content types; entry/config
types are explicit. Entry/config responses require revalidation; fingerprinted assets cache for
one year. Precompressed `.gz` sidecars are excluded because CloudFront negotiates compression.
Old fingerprinted assets remain available for browsers still using an earlier entry point.

Terraform outputs `dashboard_bucket_name`, `dashboard_distribution_id`, and `dashboard_url`.
The CloudFront site is publicly reachable over HTTPS. API access also requires the API-routing
infrastructure described in ADR 0007. Static publishing alone does not verify API availability.
Dashboard CI retains its existing typecheck and browser tests, runs `npm run build`, and uploads
`build/client` as `dashboard-static`. CD downloads that artifact from the successful main-branch
push run, using the existing AWS OIDC role. It no longer publishes a Docker image or rolls ECS.

Apply the Terraform `DashboardStaticPublish` policy before enabling the new CD workflow.
CD discovers the current distribution by its existing `dashboard-s3` origin and reads the current
bucket from that origin. Destroy/redeploy needs no GitHub-variable updates. Discovery fails if
there is no matching distribution, more than one match, or an unexpected origin. CloudFront list
access uses `*` because listing is account-wide; uploads and invalidation target only the
Terraform-managed bucket and distribution.

CD generates `config.js` with empty
Backend and Mock Account Processor base URLs, preserving `/api/*` and `/api/v1/mock/*` on the
CloudFront origin. Development configuration is unchanged. Uploads retain old fingerprinted assets
and exclude `.gz` sidecars. After uploading assets, config, and finally HTML, CD invalidates `/*`,
waits for completion, and compares every published file's bytes through HTTPS with its local copy.
An upload, invalidation, HTTP, or content mismatch fails deployment. This verifies the static
release; it does not verify API availability.

`npm run test:browser` starts its own development server on port 5174 with provider URLs set by
`playwright.config.ts`. It does not reuse the running application or require shell URL overrides.

`npm run generate:api` cleans and regenerates the Backend client under `app/generated/backend/` and
the Mock Account Processor client under `app/generated/accountProcessor/` from their respective
provider-owned OpenAPI contracts.
