# Prioritized opportunities

These recommendations are hypotheses informed by package inspection, the local lab, and one hosted MCP approval-mode send. Dashboard behavior and independent REST/SDK tests remain pending. Effort is engineering time for one experienced engineer, excluding product/design review and security approval. No conversion or cost savings are claimed.

## 1. Agent-guided integration with account-aware diagnostics (2–4 weeks)

Add a prominent “Set up with your agent” entry point, client-specific Codex and Claude Code recipes, and a copyable bounded prompt. Resend and Loops also offer hosted MCP, so the differentiator should be account-aware policy diagnostics and safe recovery. Proposed read-only tools such as **`get_account_capabilities`** and **`diagnose_integration`** would report key scopes, sandbox state, sender/domain readiness, recipient policy, and precise next actions. These are proposals, **not existing APIs**. Build on structured tools and maintained recipes first; consider a SadaSend-side diagnostic agent only if real agent trials show that tools alone lack context. A server-side agent adds latency, permission design, reliability work, and provider token cost; customer token savings are unmeasured.

Dependencies: trusted account diagnostics, scope-safe redaction, current MCP transport contract, versioned recipes. Success metrics: time from fresh account to verified dry run, percentage of agent tasks completed without support, and rate of credential exposure or unsafe send attempts. Validate with real Codex/Claude Code runs and a small consented cohort.

## 2. One path from onboarding to first safe result (1–2 weeks)

Make sandbox sender, allowed recipient, dry run, and domain requirements explicit at every entry point. Reproduce the reported dashboard discrepancy before filing a defect. Provide one runnable TypeScript and Python quickstart each, with expected queued/pending-approval responses and remedial links. Add a preview that validates account policy without dispatch.

Dependencies: access to the dashboard and test account, verified backend semantics. Success metrics: median active setup minutes, waiting minutes, first dry-run success rate, and support contacts per first send.

## 3. Versioned compatibility and evidence examples (1–3 weeks)

Publish a contract table for REST, TypeScript, Python, and MCP, including transport endpoints, scopes, plan gates, retries, idempotency, and webhook signatures. Run the same non-sending contract fixtures in CI for both SDKs and the hosted MCP endpoint. Separate accepted, queued, approval hold, delivery event, and inbox placement in examples.

Dependencies: stable public API spec and test tenant; maintenance ownership. Success metrics: SDK parity drift found before release, docs examples runnable unchanged, and time to diagnose a policy refusal.

## First 30 days I could own

Week 1: reproduce onboarding and integration flows with approved account/recipients, establish baseline timings and redacted evidence. Week 2: ship the safe first-result recipe and client-specific setup prototype. Week 3: implement read-only diagnostic contracts and CI fixture coverage. Week 4: test with developers and improve the highest-friction path using observed completion and recovery data. Scope depends on access to account policy APIs and dashboard ownership.
