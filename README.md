# Email Integration Lab

A small Next.js and TypeScript application for evaluating SadaSend with separate TypeScript, Python, and MCP probes. The interface supports local compose/preview, a SadaSend dry run, guarded live sending, message lookup, and a signed webhook receiver. Local and mocked outcomes are labeled separately from hosted results.

## Setup

Requires Node 20+ (tested with 24.22.3) and Python 3.9+ (tested with 3.12.14). From this checkout:

```bash
export NPM_CONFIG_CACHE=/tmp/sadasend-npm-cache # use a writable cache in this cloud machine
npm ci
python3 -m venv .venv
.venv/bin/pip install sadasend==0.1.6
cp .env.example .env.local
npm run dev
```

Keep `.env.local` private and gitignored. Add `SADASEND_API_KEY` only when available. The app never sends unless `LAB_LIVE_SEND_ENABLED=1`, `LAB_APPROVED_RECIPIENTS` contains the exact recipient, and `LAB_MAX_SENDS` is a positive small integer. Each attempt reserves an on-disk slot in `.lab/`, including failed attempts, to cap local test dispatches across restarts. A local preview does not contact SadaSend. A dry run makes a provider request and needs a key and reachable API; SadaSend's no-dispatch promise has not yet been verified against a live account. The sample OTP is synthetic.

The webhook receiver is `POST /api/webhook`. Set `SADASEND_WEBHOOK_SECRET` server-side. It verifies the raw body and timestamped HMAC through the official SDK and rejects duplicate payload/signature pairs using `.lab/webhook-events/`. A public HTTPS endpoint or tunnel is needed for hosted SadaSend to deliver webhooks; localhost cannot be reached by the hosted service. The route is a local evaluation receiver, not a durable production queue.

## Sending from your own domain

The default `LAB_FROM` uses SadaSend's shared onboarding domain for a bounded sandbox test. [SadaSend's current docs](https://www.sadasend.com/docs) limit that sender to account team members or test sinks and 100 lifetime messages. For an application, add a domain or dedicated subdomain you control in the SadaSend dashboard, publish the exact SPF, DKIM, and DMARC records it provides, verify the domain, then set `LAB_FROM` to an address there (for example `notifications@send.yourdomain.com`). Keep the key in server-side environment settings and call the SDK, REST API, or SMTP relay from your application backend. Use a live key for automatic production sends; an approval-mode agent key holds each message for a human to release. Do not change DNS for a production domain without the domain owner's authorization.

## Checks

```bash
npm run typecheck
npm run build
npm test
npm run lab:ts -- --mock
.venv/bin/python scripts/sdk-python.py
npm run lab:mcp -- --fixture
```

For a real **non-sending** SadaSend request after configuring the account, set `LAB_TEST_RECIPIENT` to an approved test address and run `npm run lab:ts -- --dry-run` or `.venv/bin/python scripts/sdk-python.py --dry-run`. These are independent SDK paths. The hosted MCP discovery probe is `npm run lab:mcp -- --discover`; it requires `SADASEND_AGENT_KEY` and `SADASEND_MCP_URL` if the official endpoint differs from the example. It initializes and lists tools without calling them. Run actual sends only after approving recipients and a maximum count.

Current official MCP docs use streamable HTTP at `https://mcp.sadasend.com`. The TypeScript SDK README still describes an older SSE path. In the managed cloud environment, Node 24 needs `NODE_OPTIONS=--use-env-proxy` for the hosted MCP probe to use the configured HTTPS proxy; direct Node fetch otherwise fails DNS resolution. The app and SDK probes remain separate from MCP.

The separate REST probe can read account state (`npm run lab:rest -- --account`), perform a non-sending dry run (`--dry-run`), look up a message (`--lookup ID`), or check missing authentication with a synthetic invalid key (`--invalid-auth`). It prints selected status and error fields, not full message bodies. It has not yet been run against the hosted API.

## Architecture and boundaries

- `app/` is the UI and server-only API. The API key never enters client JavaScript. HTML is submitted to SadaSend but the preview pane displays plain text to avoid rendering untrusted markup.
- `lib/lab.ts` validates input and reserves live-send slots. The application is intentionally single-workspace and local; it has no user authentication and should not be exposed publicly with a live key.
- `scripts/` holds separate SDK and official MCP-client harnesses. Mock output proves request construction, not provider behavior.
- `docs/capability-matrix.md` tracks API/SDK/MCP coverage and evidence. `docs/friction-log.md` records encountered issues. `docs/competitor-comparison.md`, `docs/recommendations.md`, and `docs/evaluation-summary.md` contain the assessment.
- `docs/continuation-prompt.md` is a copyable, evidence-based handoff for the next evaluation session.
- `results/evaluation.json` is the redacted machine-readable result ledger. No secrets or recipient addresses from a real account are stored there.

One hosted MCP approval-mode email was approved by the user and reported in the Inbox; account aggregate stats showed one sent and one delivered. The returned held message ID could not be read back through MCP, so there is no verified per-message event trail. The evaluation did not test account creation, custom-domain DNS, plan gates, actual Codex/Claude Code agent execution, or competitor live workflows. The docs state why and provide a recipe for continuing.
