# Continuation prompt: SadaSend Email Integration Lab

Copy the prompt below into a new development session to continue this evaluation. It is a handoff of observed evidence, not a claim that every SadaSend capability works.

---

You are continuing an evidence-based SadaSend developer-experience evaluation in `/workspace/sadasend_experimentation` for a Founding Engineer, Developer Experience application. Read `README.md`, `docs/evaluation-summary.md`, `docs/capability-matrix.md`, `docs/friction-log.md`, `docs/competitor-comparison.md`, `docs/recommendations.md`, `results/evaluation.json`, and `results/live-mcp-2026-11-25.json` before changing the project. Preserve the existing checkout, generated evidence, and ignored `.lab/` send reservations. Do not create a worktree unless explicitly requested.

## Purpose

Extend the small Next.js “Email Integration Lab” to distinguish what SadaSend actually does from SDK, documentation, MCP, and dashboard claims. Show engineering depth and product judgment. Keep observed facts, hypotheses, and recommendations separate. Continue from the current implementation; do not rebuild the app from scratch.

## Verified results as of 2026-11-25

- The app uses Next.js 16.4.6, Node 24.22.3, TypeScript SDK `sadasend@0.1.6`, Python SDK `sadasend==0.1.6` (generated spec 1.0.0), and official MCP SDK 1.32.2. `npm run typecheck`, `npm run build`, and `npm test` passed; the test suite has 3 tests. Local preview, disabled-send guard, TypeScript/Python mock dry-run request construction, MCP local fixture, and webhook signature/duplicate handling passed. These mock/local checks are **not** hosted API proof.
- Hosted MCP initialized using **streamable HTTP at `https://mcp.sadasend.com`** with an environment-bound agent key. Server version was 1.0.0. Eleven tools were visible with this key: `build_utm_url`, `check_suppression`, `get_email_status`, `get_stats`, `list_domains`, `list_templates`, `preview_email`, `render_template`, `search_emails`, `send_email`, and `verify_email`. Current docs list 12 tools total; `check_domain_setup` was not visible, plausibly because the key lacks the `domains` scope. Do not call that a defect without testing a key with that scope.
- `list_domains` said the account had no sending domains. Current [SadaSend docs](https://www.sadasend.com/docs) say `onboarding.sadasend.com` is a shared sandbox sender limited to account team members or safe test sinks and 100 lifetime messages. For a real app, add and verify a domain or subdomain you control, publish the exact SPF/DKIM/DMARC records the dashboard supplies, then change `LAB_FROM` to an address on that domain. Do not change DNS without explicit authorization.
- Hosted `preview_email` said the synthetic message “would be accepted” and that nothing was sent. One subsequent `send_email` request using the approval-mode agent key returned **held for approval**, message ID `ed18dda0-ead0-45bb-bd2c-a85703da4a59`. The user approved it in the dashboard and confirmed receiving subject “SadaSend integration lab test” in the Inbox from `noreply@onboarding.sadasend.com`. Account-wide `get_stats` for one day then reported 1 sent and 1 delivered. Treat the Inbox result as **user-reported** and the stats as **aggregate**; neither is a message-specific provider event.
- `get_email_status` returned `isError=true` / “No message ... on this account” for that ID before and after approval. `search_emails` found nothing by subject, pending-approval status, or unfiltered recent list. This is a reproducible observability gap, but its root cause is unconfirmed: an approval record might use another ID/model. Do not send a duplicate just because lookup fails. See friction item F-04.
- Current [MCP docs](https://www.sadasend.com/docs/mcp) specify the root streamable HTTP endpoint and say no SSE stream is opened. The TypeScript SDK 0.1.6 README still advertises `https://mcp.sadasend.com/mcp/sse`. Record this as a documentation inconsistency (F-03). In this cloud runtime, Node's direct fetch needed `NODE_OPTIONS=--use-env-proxy` to use the HTTPS proxy.
- The API domain is now reachable. A distinct `SADASEND_API_KEY` is not bound; only `SADASEND_AGENT_KEY` worked through MCP. An API account request with the environment-bound agent variable returned `invalid_api_key`, which may be caused by the proxy secret's destination scope. Do not classify it as a SadaSend REST defect without a properly bound REST key. Hosted REST, TypeScript SDK, and Python SDK operations remain untested.
- Resend and Loops also document hosted MCP ([Resend](https://resend.com/docs/mcp-server.md), [Loops](https://loops.so/docs/mcp-server.md)). MCP availability alone is not a SadaSend advantage. SadaSend's documented recipient policies and the **observed human approval hold** are the stronger candidate distinction. Resend/Loops were not tested live. No broad deliverability or market superiority claim is supported.
- The original dashboard lead—an overview promising sandbox sending while one browser composer requests a verified domain and another onboarding page offers no-DNS sending—remains **unverified**. Account creation time, custom-domain verification, SMTP, live webhooks, plan-gated features, and actual Codex/Claude Code agent runs remain untested.

## Authorization and credential boundaries

The user authorized **only one recipient**, stored in `LAB_APPROVED_RECIPIENTS`, and **at most two real sends**. Exactly one send request has been used; it required human approval and reached the Inbox by user report. The second slot is unused, but do not spend it merely to repeat a successful result. Ask for fresh authorization if the recipient, volume, or purpose changes. No burst, bounce-manufacturing, campaign, billing, domain DNS, or paid-model actions are authorized. Keep all keys server-side; never print, commit, or paste values into logs or reports. An earlier key appeared in chat and should be treated as exposed; use only properly configured environment bindings, and verify rotation before widening access.

## Next work, in priority order

1. Investigate the held-message lookup gap without sending again. Check current official docs and account dashboard behavior, and determine whether the returned ID is an approval ID, whether a separate email ID appears after approval, and whether `get_email_status`/`search_emails` have a scope or indexing issue. Record redacted protocol evidence and a minimal reproduction. If this cannot be resolved, mark root cause unconfirmed.
2. Obtain a separate scoped REST/SDK key through environment settings if available. Test account read, a non-sending REST dry run, and equivalent official TypeScript and Python SDK dry runs using the harnesses. Test missing/invalid auth and documented validation safely. Compare wire shapes, statuses, errors, timeouts, and idempotency. Do not label mocked results as live. Do not send another email unless it answers a concrete unresolved question.
3. If the user chooses a domain they control, inspect the SadaSend-generated DNS records and propose exact changes for review. Obtain authorization before modifying DNS. After verification, test a sender on that domain with the existing approved recipient and remaining send allowance only if a real send is necessary.
4. Reproduce the dashboard sandbox-entry discrepancy using an authenticated browser session if available. Measure active steps and waiting time separately. Keep credentials out of screenshots.
5. Update the competitor comparison from current official Resend and Loops docs, including their MCP, first-send, domain, template, and error-recovery workflows. Run competitor live tests only with separate credentials and authorization. Run an actual LLM agent only with explicit permission for any paid model/API use.

Update `docs/capability-matrix.md`, `docs/friction-log.md`, `docs/evaluation-summary.md`, and `results/*.json` as evidence changes. Keep passed, failed, blocked, unsupported, and not-tested outcomes distinct. Finish with what worked, what did not, what needed a workaround, exact next prerequisites, and three evidence-backed product opportunities with effort assumptions and measurable success criteria.

## Workspace note

The remote repository's `main` branch was empty at the start. This checkout remains an unborn local `work` branch with application files **untracked and not pushed**. Preserve these files before any environment replacement or checkout change. Do not claim the app is present on GitHub until a commit and push are actually made.

---
