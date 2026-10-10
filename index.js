#!/usr/bin/env node
// esimsos-mcp: local stdio MCP server that proxies to the public eSIM SOS remote MCP endpoint.
// No secrets, no payment data: the shop returns a payment link and the human pays in the browser.
import { createRequire } from 'node:module';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const { version } = createRequire(import.meta.url)('./package.json');
const endpoint = process.env.ESIMSOS_MCP_URL || 'https://esimsos.net/api/mcp';

const remote = new Client({ name: 'esimsos-mcp', version });
try {
  await remote.connect(new StreamableHTTPClientTransport(new URL(endpoint), {
    requestInit: { headers: { 'x-esimsos-client': 'npm' } },
  }));
} catch (err) {
  console.error(`esimsos-mcp: cannot reach ${endpoint}: ${err.message}`);
  process.exit(1);
}

const server = new Server(
  { name: 'esimsos', title: 'eSIM SOS', version },
  { capabilities: { tools: {} }, instructions: remote.getInstructions() },
);
server.setRequestHandler(ListToolsRequestSchema, (req) => remote.listTools(req.params));
// Network or rate-limit failures come back as a tool error the model can read, not a crash.
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    return await remote.callTool(req.params);
  } catch (err) {
    const error = { message: err.message, code: /RATE_LIMITED/.test(err.message) ? 'RATE_LIMITED' : 'REMOTE_ERROR' };
    return { content: [{ type: 'text', text: JSON.stringify({ data: null, error }) }], isError: true };
  }
});
await server.connect(new StdioServerTransport());
