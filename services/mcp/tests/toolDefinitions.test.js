import { describe, it, expect } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { allTools } from '../src/tools/search.js';
import { semanticSearchTools } from '../src/tools/semanticSearch.js';
import { analysisTools } from '../src/tools/analysis.js';
import { clientConfigTool } from '../src/tools/clientConfig.js';

const everyTool = [...allTools, ...semanticSearchTools, ...analysisTools, clientConfigTool];

describe('tool definitions', () => {
  it('registers a non-trivial number of tools', () => {
    expect(everyTool.length).toBeGreaterThanOrEqual(30);
  });

  it('every tool has the fields the MCP registration requires', () => {
    for (const tool of everyTool) {
      expect(typeof tool.name, `name for ${tool.name}`).toBe('string');
      // description is REQUIRED: server.tool(name, description, schema, annotations, cb)
      // silently mis-parses (callback becomes undefined) if description is missing.
      expect(typeof tool.description, `description for ${tool.name}`).toBe('string');
      expect(tool.description.length, `description for ${tool.name}`).toBeGreaterThan(0);
      expect(typeof tool.inputSchema, `inputSchema for ${tool.name}`).toBe('object');
      expect(typeof tool.handler, `handler for ${tool.name}`).toBe('function');
    }
  });

  it('tool names are unique', () => {
    const names = everyTool.map(t => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('MCP registration actually carries descriptions + annotations', () => {
  it('server.tool(name, description, schema, annotations, cb) records the description', () => {
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    const sample = allTools[0];
    server.tool(
      sample.name,
      sample.description,
      sample.inputSchema,
      { readOnlyHint: true, openWorldHint: true },
      async () => ({ content: [{ type: 'text', text: 'ok' }] })
    );
    // Introspect the SDK's internal registry to prove the description landed
    // (the previous 3-arg form dropped it).
    const registered = server._registeredTools?.[sample.name];
    expect(registered).toBeTruthy();
    expect(registered.description).toBe(sample.description);
    expect(registered.annotations?.readOnlyHint).toBe(true);
  });
});
