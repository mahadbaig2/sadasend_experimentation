# Friction log

## F-01 — Documentation access in this cloud environment

- **Class:** Environment limitation. **Severity:** High for this evaluation; affects any developer on restricted egress.
- **Task / intended outcome:** Inspect current official SadaSend docs before implementing tests.
- **Expected/source:** Public pages linked in the evaluation request at `https://www.sadasend.com/docs`.
- **Actual:** `curl -IL` returned `CONNECT tunnel failed, response 403` before reaching the site. This is a network policy response, not an observed SadaSend failure.
- **Reproduce:** From this environment, run `curl -IL --max-time 12 https://www.sadasend.com/docs`.
- **Runtime:** Node 24.22.3, Python 3.12.14; no SDK involved. **Attempts:** 1; under one minute.
- **Root cause:** Restricted cloud egress excludes the domain. **Workaround:** Drafted allowlist additions for `sadasend.com`, `www.sadasend.com`, Resend and Loops documentation sites. Required for live documentation review.
- **Fix/verification:** Apply the network draft in environment settings; repeat the HEAD/GET request and verify page content. No SadaSend product change implied.

## F-02 — npm cache location

- **Class:** Environment limitation. **Severity:** Low; affects first install in this runtime.
- **Task:** Query the published TypeScript SDK.
- **Expected/source:** `npm search sadasend` through npm registry.
- **Actual:** Registry metadata returned but npm could not create `/home/agent/.npm/_cacache` (`ENOENT`).
- **Reproduce:** Run `npm search sadasend --json` with default cache location.
- **Runtime:** npm 11.19.1, Node 24.22.3. **Attempts:** 1; under one minute.
- **Root cause:** The home cache path is unavailable to this sandbox. **Workaround:** `NPM_CONFIG_CACHE=/tmp/sadasend-npm-cache`. Required here.
- **Fix/verification:** Use a writable cache under `/workspace` or `/tmp`; package metadata and tarball download then succeed.

## F-03 — SDK README points to an outdated MCP transport

- **Class:** Documentation defect. **Severity:** Medium; affects developers copying the SDK README MCP configuration.
- **Task:** Choose the hosted MCP transport for a client harness.
- **Expected/source:** [TypeScript README](https://github.com/SadaSend/sadasend-sdk-ts#native-model-context-protocol-mcp-integration) says SSE URL `https://mcp.sadasend.com/mcp/sse`; [Python package README](https://pypi.org/project/sadasend/) describes `POST /mcp`.
- **Actual:** [Current MCP docs](https://www.sadasend.com/docs/mcp), checked 2026-11-25, state streamable HTTP at `https://mcp.sadasend.com` and explicitly say the server opens no SSE stream. An official MCP SDK client initialized at that URL and discovered 11 tools. The README SSE path failed in this environment; its initial failure included a proxy/DNS issue, so the transport claim is established by current docs and the working root endpoint, rather than attributing the entire failed call to the old path.
- **Reproduce:** Read the linked package materials at version 0.1.6.
- **Runtime:** SDKs 0.1.6. **Attempts:** Source review only; under five minutes.
- **Root cause:** README not updated when the service moved to streamable HTTP. **Workaround:** Use the current root URL with `StreamableHTTPClientTransport` and the environment HTTPS proxy. Required for this test.
- **Proposed fix:** Update the SDK README transport and URL. **Verify:** Initialize an official MCP client using the copyable README configuration in CI.

## F-04 — Held message ID cannot be read back through MCP

- **Class:** Product defect hypothesis or undocumented approval-queue separation. **Severity:** Medium for agent debugging; affects approval-mode users.
- **Task:** Confirm the status of one approved-recipient test message after `send_email` returned a held message ID.
- **Expected/source:** [Current MCP docs](https://www.sadasend.com/docs/mcp) say `get_email_status` returns the delivery state and event timeline; approval mode returns a held message ID.
- **Actual:** `send_email` said “Held for approval, not sent” with message ID `ed18dda0-ead0-45bb-bd2c-a85703da4a59`. `get_email_status` returned `isError=true` and “No message ... on this account.” `search_emails` found no matching subject or `pending_approval` status. The same lookup failed after the user reported dashboard approval. No second send was attempted.
- **Reproduce:** With an approval-mode key, call `preview_email`, then `send_email` once to an approved recipient. Call `get_email_status` with the returned ID and `search_emails` with the subject/status. Do not repeat the send merely because the lookup fails.
- **Runtime:** Official MCP SDK 1.32.2, hosted server version 1.0.0. **Attempts:** One send, two ID lookups, three search queries; a few minutes of diagnosis.
- **Root cause:** Unconfirmed. The approval queue may use a distinct record model, or the lookup may be lagging/incorrect. **Workaround:** Use the dashboard approval queue and record its outcome; no MCP read path for the held item was verified.
- **Proposed fix:** Make held IDs resolvable through `get_email_status`, or return a separate approval ID plus a documented lookup. **Verify:** A newly held message can be read before approval and its transition observed afterward.
