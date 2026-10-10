// Starts a fake remote MCP endpoint, runs index.js over stdio against it and checks that tools,
// instructions, calls and the npm attribution header pass through. No network, no real orders.
import assert from 'node:assert';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const headers = [];
let rateLimited = false;
const httpServer = http.createServer(async (req, res) => {
  headers.push(req.headers['x-esimsos-client']);
  if (rateLimited) { res.writeHead(429, { 'content-type': 'application/json' }).end('{"data":null,"error":{"code":"RATE_LIMITED"}}'); return; }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const server = new Server({ name: 'fake', version: '0' }, { capabilities: { tools: {} }, instructions: 'give the user the payment link' });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [{ name: 'create_order', description: 'd', inputSchema: { type: 'object' } }] }));
  server.setRequestHandler(CallToolRequestSchema, async (r) => ({ content: [{ type: 'text', text: JSON.stringify({ data: { echo: r.params }, error: null }) }] }));
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res, chunks.length ? JSON.parse(Buffer.concat(chunks)) : undefined);
});
await new Promise((r) => httpServer.listen(0, '127.0.0.1', r));

const client = new Client({ name: 'test', version: '0' });
await client.connect(new StdioClientTransport({
  command: process.execPath,
  args: [fileURLToPath(new URL('../index.js', import.meta.url))],
  env: { ...process.env, ESIMSOS_MCP_URL: `http://127.0.0.1:${httpServer.address().port}/api/mcp` },
}));
try {
  assert.strictEqual(client.getInstructions(), 'give the user the payment link');
  const { tools } = await client.listTools();
  assert.deepStrictEqual(tools.map((t) => t.name), ['create_order']);
  const r = await client.callTool({ name: 'create_order', arguments: { plan_id: 'X', email: 'a@b.cc' } });
  assert.deepStrictEqual(JSON.parse(r.content[0].text).data.echo, { name: 'create_order', arguments: { plan_id: 'X', email: 'a@b.cc' } });
  assert.ok(headers.length && headers.every((h) => h === 'npm'), 'every request is marked as coming from the npm package');
  rateLimited = true;
  const limited = await client.callTool({ name: 'create_order', arguments: {} });
  assert.strictEqual(limited.isError, true);
  assert.strictEqual(JSON.parse(limited.content[0].text).error.code, 'RATE_LIMITED');
  console.log('proxy: OK');
} finally {
  await client.close();
  httpServer.close();
}
