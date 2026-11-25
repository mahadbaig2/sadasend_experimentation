# Agent integration recipe

## Bounded task

> Inspect this repository, integrate SadaSend in sandbox mode, preview a transactional email, identify configuration problems, and verify the outcome. Never send a real email without an approved recipient and small send limit. Report accepted, queued, pending approval, delivered and inbox placement separately.

The app's `scripts/mcp.ts` uses `@modelcontextprotocol/sdk` 1.32.2. `npm run lab:mcp -- --fixture` verifies its client initialization and tool call against a **local synthetic MCP server**. `--discover` connects to the URL in `SADASEND_MCP_URL`, initializes the protocol, and lists the actual hosted tools. It performs no hosted tool calls. [Current SadaSend MCP docs](https://www.sadasend.com/docs/mcp), checked 2026-11-25, specify streamable HTTP at `https://mcp.sadasend.com`; the TypeScript SDK README's SSE URL is stale. In this cloud machine, prefix the command with `NODE_OPTIONS=--use-env-proxy` to route Node fetch through the configured HTTPS proxy.

For a Codex run, first configure a scoped, read/send agent key in the client's MCP settings according to current [Codex MCP documentation](https://developers.openai.com/codex/mcp/). Use the SadaSend URL verified by `--discover`; do not put a key in a committed config file. Ask Codex to perform the bounded task above, with live sending disabled until the approved limits are set. Record discovered tools, protocol version, policy refusals, and redacted outputs.

For Claude Code, follow current [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp) with the same scoped key and verified URL. Confirm that the client actually initializes and discovers tools. Do not assume Codex and Claude Code share a config format.

**Status:** No real LLM agent run was performed. The Codex CLI exists in this environment; Claude Code CLI is absent. A paid model invocation requires explicit authorization. Hosted MCP initialization and tool discovery passed with an environment-bound agent key (protocol server version 1.0.0, 11 visible tools). A preview passed and one send request was held for human approval; no delivery was observed. The deterministic fixture remains a separate harness check.
