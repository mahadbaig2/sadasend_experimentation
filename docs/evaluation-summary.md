# Evaluation summary

**Date:** 2026-11-25 UTC. **Starting point:** an empty Git checkout and a running Codex cloud machine. There was no SadaSend account session, API key, approved recipient, or configured domain in the runtime at the start. The user subsequently approved one recipient and a maximum of two real sends. Signup time cannot be measured. The approval delay was not timed separately.

## What was tested

| Surface | Result | Evidence |
|---|---|---|
| Next.js application | **Passed locally:** production build, three local tests, HTTP 200 home page, synthetic preview endpoint, disabled-send guard | `results/evaluation.json` |
| TypeScript SDK 0.1.6 | **Passed with mock transport:** one dry-run POST to `/emails`, idempotency header present. Hosted request **blocked** by missing key and policy access. | `scripts/sdk-ts.ts`, `results/evaluation.json` |
| Python SDK 0.1.6 / spec 1.0.0 | **Passed with mock opener:** independent dry-run POST and idempotency header. Hosted request **blocked**. | `scripts/sdk-python.py`, `results/evaluation.json` |
| MCP SDK 1.32.2 | **Passed live:** streamable HTTP initialization with environment-bound agent key; server version 1.0.0 and 11 scope-visible tools. Preview said it would be accepted without sending. One send request was held, then approved by the user, who reported Inbox receipt. | `scripts/mcp.ts`, `results/live-mcp-2026-11-25.json` |
| Webhook receiver | **Passed local fixture:** valid signed request accepted, duplicate flagged, invalid signature refused. No hosted webhook delivery. | `app/api/webhook/route.ts`, `results/evaluation.json` |
| REST API | **Blocked with this credential:** API domain is reachable, but only an agent key is bound for MCP and the REST account request returned `invalid_api_key`; no separate API key is configured. | `scripts/rest.ts`, `results/evaluation.json` |
| Official docs and dashboard | **Docs passed after network update:** current MCP docs identify streamable HTTP at the root URL. Dashboard flow was user-reported, not directly observed. | `docs/friction-log.md` |
| SMTP and onboarding | **Not tested live.** | `docs/capability-matrix.md` |
| Resend and Loops | **Documentation/source based only.** No live credentials or sends. Current pricing and limits not verified. | `docs/competitor-comparison.md` |

## Main observations and friction

1. The official TypeScript and Python SDKs both expose a broad client surface and built-in dry-run/idempotency options. Their local transport behavior passed equivalent mock probes. This does not establish hosted API behavior.
2. The TypeScript SDK README describes an SSE MCP path, while [current MCP docs](https://www.sadasend.com/docs/mcp) say streamable HTTP at the root URL. The current route initialized successfully; the README should be updated.
3. The approval-mode tool accepted one message and held it. After the user approved it, the user reported Inbox receipt and account aggregate stats showed one sent and one delivered. The aggregate is not a message-specific event. The returned ID still could not be found through `get_email_status` or `search_emails`.
4. The reported dashboard sandbox discrepancy remains an unverified lead. No second email was sent.

## What SadaSend should address first

The most immediate observed fix is to make a held message ID resolvable through the MCP status tool, or expose a distinct approval lookup. Next, update the stale README MCP URL. Account-aware diagnostics and client-specific recipes remain promising product opportunities. See [recommendations](recommendations.md) for effort, dependencies, metrics, and a realistic first 30 days.

## Remaining blockers

- A separate REST/SDK API key is still needed for independent hosted REST, TypeScript, and Python tests. The agent key worked through MCP but was rejected as `invalid_api_key` at the REST account endpoint. The approved two-send limit has one unused slot; no further send is needed to establish this path.
- For dashboard reproduction, grant browser/account access. For Resend/Loops live parity, provide separate accounts and authorization. A paid model agent run also needs explicit authorization.

The inbox result is user-reported, while the one-day sent/delivered totals are account aggregates. The returned message ID has no verified event trail. Approval acceptance, provider delivery, and inbox placement are recorded separately in `results/live-mcp-2026-11-25.json`.
