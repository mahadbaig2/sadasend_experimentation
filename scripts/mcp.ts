import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

if (process.argv[2] === '--fixture') {
  const server = new McpServer({ name: 'local-fixture', version: '1.0.0' });
  server.registerTool('read_fixture_status', { description: 'Return a synthetic status; no hosted SadaSend connection.' }, async () => ({ content: [{ type: 'text', text: 'fixture-ready' }], structuredContent: { status: 'fixture-ready' } }));
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const fixtureClient = new Client({ name: 'sadasend-email-lab', version: '0.1.0' });
  await server.connect(serverTransport);
  await fixtureClient.connect(clientTransport);
  try {
    const discovered = await fixtureClient.listTools();
    const response = await fixtureClient.callTool({ name: 'read_fixture_status' });
    if (discovered.tools.length !== 1 || (response.structuredContent as { status?: string } | undefined)?.status !== 'fixture-ready') process.exitCode = 1;
    console.log(JSON.stringify({ mode: 'local-fixture', protocol: fixtureClient.getServerVersion(), tools: discovered.tools.map(t => t.name), result: response.structuredContent }));
  } finally {
    await fixtureClient.close();
    await server.close();
  }
} else if (process.argv[2] === '--discover') {
const token = process.env.SADASEND_AGENT_KEY;
if (!token) throw new Error('Set SADASEND_AGENT_KEY server-side before MCP discovery.');
const url = new URL(process.env.SADASEND_MCP_URL || 'https://mcp.sadasend.com');
const client = new Client({ name: 'sadasend-email-lab', version: '0.1.0' });
const headers = { Authorization: `Bearer ${token}` };
const transport = url.pathname.endsWith('/sse')
  ? new SSEClientTransport(url, { requestInit: { headers }, eventSourceInit: { fetch: (input, init) => fetch(input, { ...init, headers: { ...headers, ...init?.headers } }) } })
  : new StreamableHTTPClientTransport(url, { requestInit: { headers } });
try {
  await client.connect(transport);
  const tools = await client.listTools();
  console.log(JSON.stringify({ protocol: client.getServerVersion(), toolCount: tools.tools.length, tools: tools.tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) }, null, 2));
} finally {
  await client.close();
}
} else {
  throw new Error('Use --fixture or --discover. Hosted tool calls are disabled until scopes and schemas are reviewed.');
}
