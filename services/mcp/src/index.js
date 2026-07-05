#!/usr/bin/env node

console.log('[Boot] Starting Bundestag MCP Server...');
console.log(`[Boot] Node.js ${process.version}`);
console.log(`[Boot] Environment: ${process.env.NODE_ENV || 'development'}`);

console.log('[Boot] Loading dependencies...');
import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
console.log('[Boot] Dependencies loaded');

console.log('[Boot] Loading config...');
import { config, validateConfig } from './config.js';
import { allTools } from './tools/search.js';
import { semanticSearchTools } from './tools/semanticSearch.js';
import { analysisTools } from './tools/analysis.js';
import { aggregateTools } from './tools/aggregate.js';
import { clientConfigTool } from './tools/clientConfig.js';
import { getCacheStats } from './utils/cache.js';
import { debug, info, error, errDetail, getStats } from './utils/logger.js';
import { allResources, SERVER_INSTRUCTIONS } from './resources/info.js';
import { allResourceTemplates, registerResourceTemplates } from './resources/templates.js';
import { allPrompts, registerPrompts } from './prompts/index.js';
import {
  getMetrics,
  getMetricsContentType,
  isMetricsEnabled,
  metricsMiddleware,
  updateActiveSessions
} from './utils/metrics.js';
import * as indexer from './jobs/indexer.js';
import * as qdrantService from './services/qdrant/index.js';
console.log('[Boot] Config loaded');

// Validate configuration
console.log('[Config] Validating environment variables...');
try {
  validateConfig();
  console.log('[Config] Validation successful');
} catch (err) {
  console.error(`[Config] ERROR: ${err.message}`);
  process.exit(1);
}

console.log('[Boot] Setting up Express...');
const app = express();
app.use(express.json());

// CORS middleware - compatible with ChatGPT connector requirements
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
  res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // 204 No Content for preflight
  }
  next();
});

// Prometheus metrics middleware (records HTTP metrics)
app.use(metricsMiddleware());

console.log('[Boot] Express configured');

// Helper: Get base URL
function getBaseUrl(req) {
  return config.server.publicUrl || `${req.protocol}://${req.get('host')}`;
}

// Session management
const transports = {};

// === TOOL METADATA (single source of truth) ===

// Tools that mutate server state (indexing jobs) — everything else is read-only.
const MUTATING_TOOLS = new Set([
  'bundestag_reindex_protocols',
  'bundestag_trigger_indexing',
  'bundestag_trigger_document_indexing',
  'bundestag_trigger_protocol_indexing'
]);

// Destructive mutations (data loss) — clients should gate these behind confirmation.
const DESTRUCTIVE_TOOLS = new Set([
  'bundestag_reindex_protocols' // deletes all protocol chunks before rebuilding
]);

// Every registered tool, in registration order. clientConfigTool is local-only
// (generates config text, no external calls) — the rest hit the DIP/Qdrant APIs.
const ALL_TOOLS = [...allTools, ...semanticSearchTools, ...analysisTools, ...aggregateTools, clientConfigTool];

// Derive the Directory-required `title` annotation from the tool name so it
// stays in sync automatically (e.g. bundestag_search_drucksachen → "Search Drucksachen").
function humanizeTitle(name) {
  return name
    .replace(/^bundestag_/, '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Standard MCP annotations for a tool, derived from the mutation sets above.
function annotationsFor(name) {
  const readOnly = !MUTATING_TOOLS.has(name);
  return {
    title: humanizeTitle(name),
    readOnlyHint: readOnly,
    destructiveHint: DESTRUCTIVE_TOOLS.has(name),
    idempotentHint: readOnly,
    openWorldHint: name !== 'get_client_config'
  };
}

// Compact tool catalog for the discovery/info endpoints — generated from the
// live registry so it can never drift from the actually-registered tools.
function toolCatalog() {
  return ALL_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description.split('\n')[0].trim(),
    annotations: annotationsFor(tool.name)
  }));
}

// MCP Server Factory
function createMcpServer(baseUrl) {
  const server = new McpServer({
    name: 'bundestag-mcp',
    version: '1.0.0'
  }, {
    // Injected into the client's system prompt via the initialize result, so the
    // model gets tool-selection guidance without having to read a resource first.
    instructions: SERVER_INSTRUCTIONS
  });

  // === MCP RESOURCES ===

  for (const resource of allResources) {
    server.resource(
      resource.uri,
      resource.description,
      async () => {
        const content = await resource.handler();
        const text = typeof content === 'string'
          ? content
          : JSON.stringify(content, null, 2);

        return {
          contents: [{
            uri: resource.uri,
            mimeType: resource.mimeType,
            text
          }]
        };
      }
    );
  }

  // === MCP TOOLS ===

  // Register all search/entity/analysis/aggregate tools (clientConfigTool below).
  const allToolsCombined = [...allTools, ...semanticSearchTools, ...analysisTools, ...aggregateTools];
  for (const tool of allToolsCombined) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema,
      annotationsFor(tool.name),
      async (params) => {
        const startedAt = Date.now();
        try {
          const result = await tool.handler(params);
          debug('Tool', `${tool.name} completed`, {
            ms: Date.now() - startedAt,
            isError: !!result.error
          });
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }],
            isError: !!result.error
          };
        } catch (err) {
          error('Tool', `${tool.name} failed: ${errDetail(err)}`, { ms: Date.now() - startedAt });
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: true, message: errDetail(err), tool: tool.name })
            }],
            isError: true
          };
        }
      }
    );
  }

  // Client Config Tool
  server.tool(
    clientConfigTool.name,
    clientConfigTool.description,
    clientConfigTool.inputSchema,
    annotationsFor(clientConfigTool.name),
    async ({ client }) => {
      const result = clientConfigTool.handler({ client }, baseUrl);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  );

  // === MCP PROMPTS ===
  registerPrompts(server);

  // === MCP RESOURCE TEMPLATES ===
  registerResourceTemplates(server);

  return server;
}

// Root endpoint for basic health check (ChatGPT connector wizard)
app.get('/', (req, res) => {
  res.type('text/plain').send('Bundestag MCP Server');
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  const cacheStats = getCacheStats();
  const serverStats = getStats();

  res.json({
    status: 'ok',
    service: 'bundestag-mcp',
    version: '1.0.0',
    api: 'DIP Bundestag API',
    uptime: serverStats.uptime,
    cache: {
      apiHitRate: cacheStats.apiResponses.hitRate,
      entityHitRate: cacheStats.entities.hitRate,
      apiEntries: cacheStats.apiResponses.entries,
      entityEntries: cacheStats.entities.entries
    },
    requests: serverStats.requests,
    performance: serverStats.performance
  });
});

// Metrics endpoint (detailed stats - JSON format)
app.get('/metrics', (req, res) => {
  const cacheStats = getCacheStats();
  const serverStats = getStats();

  res.json({
    server: {
      name: 'bundestag-mcp',
      version: '1.0.0',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    },
    uptime: serverStats.uptime,
    requests: serverStats.requests,
    performance: serverStats.performance,
    breakdown: serverStats.breakdown,
    cache: cacheStats,
    memory: {
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    }
  });
});

// Prometheus metrics endpoint
app.get('/metrics/prometheus', async (req, res) => {
  try {
    // Update session count before exporting
    updateActiveSessions(Object.keys(transports).length);

    const metrics = await getMetrics();
    res.set('Content-Type', getMetricsContentType());
    res.send(metrics);
  } catch (err) {
    error('Metrics', `Failed to get Prometheus metrics: ${err.message}`);
    res.status(500).send('# Error generating metrics\n');
  }
});

// Deep health check - verifies DIP API and Qdrant connectivity
app.get('/health/deep', async (req, res) => {
  const checks = {
    server: 'healthy',
    dipApi: 'unknown',
    qdrant: 'unknown',
    cache: 'healthy',
    memory: 'healthy'
  };

  let overallHealthy = true;

  // Check DIP API connectivity
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const apiUrl = new URL(`${config.dipApi.baseUrl}/drucksache`);
    apiUrl.searchParams.set('apikey', config.dipApi.apiKey);
    apiUrl.searchParams.set('format', 'json');
    apiUrl.searchParams.set('rows', '1');

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      checks.dipApi = 'healthy';
    } else {
      checks.dipApi = `unhealthy (HTTP ${response.status})`;
      overallHealthy = false;
    }
  } catch (err) {
    checks.dipApi = `unhealthy (${err.message})`;
    overallHealthy = false;
  }

  // Check Qdrant connectivity
  if (config.qdrant.enabled) {
    const qdrantHealthy = await qdrantService.healthCheck();
    if (qdrantHealthy) {
      const qdrantInfo = await qdrantService.getCollectionInfo();
      checks.qdrant = 'healthy';
      checks.qdrantInfo = qdrantInfo;
    } else {
      checks.qdrant = 'unhealthy';
    }
  } else {
    checks.qdrant = 'disabled';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  const heapUsedPercent = (heapUsedMB / heapTotalMB) * 100;

  if (heapUsedPercent > 90) {
    checks.memory = `warning (${Math.round(heapUsedPercent)}% heap used)`;
  }

  // Check cache health
  const cacheStats = getCacheStats();
  checks.cacheStats = {
    apiEntries: cacheStats.apiResponses.entries,
    entityEntries: cacheStats.entities.entries,
    apiHitRate: cacheStats.apiResponses.hitRate
  };

  // Add indexer stats
  checks.indexer = indexer.getStats();

  res.status(overallHealthy ? 200 : 503).json({
    status: overallHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    activeSessions: Object.keys(transports).length,
    metricsEnabled: isMetricsEnabled()
  });
});

// Auto-Discovery Endpoint
app.get('/.well-known/mcp.json', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    name: 'bundestag-mcp',
    version: '1.0.0',
    description: 'MCP server for German Bundestag parliamentary documentation (DIP API)',
    homepage: 'https://github.com/Movm/bundestag-mcp',
    mcp_endpoint: `${baseUrl}/mcp`,
    transport: 'streamable-http',
    tools: toolCatalog(),
    resources: [
      { uri: 'bundestag://system-prompt', name: 'AI Usage Guide', priority: 'high' },
      { uri: 'bundestag://info', name: 'Server Info' },
      { uri: 'bundestag://wahlperioden', name: 'Electoral Periods' },
      { uri: 'bundestag://drucksachetypen', name: 'Document Types' }
    ],
    prompts: allPrompts.map(p => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments
    })),
    resourceTemplates: allResourceTemplates.map(t => ({
      uriTemplate: t.uriTemplate,
      name: t.name,
      description: t.description
    })),
    entities: ['drucksache', 'drucksache-text', 'plenarprotokoll', 'plenarprotokoll-text', 'vorgang', 'vorgangsposition', 'person', 'aktivitaet'],
    supported_clients: ['claude', 'cursor', 'vscode', 'chatgpt']
  });
});

// Client-specific configuration
app.get('/config/:client', (req, res) => {
  const { client } = req.params;
  const baseUrl = getBaseUrl(req);
  const validClients = ['claude', 'cursor', 'vscode', 'chatgpt'];

  if (!validClients.includes(client)) {
    return res.status(404).json({
      error: 'Unknown client',
      message: `Supported clients: ${validClients.join(', ')}`,
      available: validClients
    });
  }

  const result = clientConfigTool.handler({ client }, baseUrl);
  res.json(result);
});

// Server Info Endpoint
app.get('/info', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const serverStats = getStats();

  res.json({
    server: {
      name: 'bundestag-mcp',
      version: '1.0.0',
      description: 'MCP server for German Bundestag parliamentary documentation (DIP API)',
      uptime: serverStats.uptime
    },
    api: {
      name: 'DIP API',
      provider: 'Deutscher Bundestag',
      baseUrl: config.dipApi.baseUrl,
      documentation: 'https://dip.bundestag.api.bund.dev/'
    },
    endpoints: {
      mcp: `${baseUrl}/mcp`,
      health: `${baseUrl}/health`,
      metrics: `${baseUrl}/metrics`,
      discovery: `${baseUrl}/.well-known/mcp.json`,
      config: `${baseUrl}/config/:client`,
      info: `${baseUrl}/info`
    },
    tools: toolCatalog(),
    resources: allResources.map(r => ({
      uri: r.uri,
      name: r.name,
      description: r.description
    })),
    links: {
      github: 'https://github.com/Movm/bundestag-mcp',
      dipApi: 'https://dip.bundestag.api.bund.dev/',
      documentation: 'https://github.com/Movm/bundestag-mcp#readme'
    }
  });
});

// MCP POST Endpoint (Main communication)
// Supports both stateful (Claude, Cursor) and stateless (ChatGPT) modes
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  let transport;
  let server;

  // Check if this is an existing session (stateful mode)
  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // New connection - determine mode based on client
  // ChatGPT doesn't send session headers, so we use stateless mode
  const useStatelessMode = !sessionId;
  const baseUrl = getBaseUrl(req);

  if (useStatelessMode) {
    // Stateless mode for ChatGPT
    // Create fresh server and transport for each request
    server = createMcpServer(baseUrl);
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
      enableJsonResponse: true
    });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      error('MCP', `Request failed: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null
        });
      }
    }
  } else if (isInitializeRequest(req.body)) {
    // Stateful mode for Claude, Cursor, etc.
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (id) => {
        transports[id] = transport;
        info('Session', `New session: ${id}`);
      },
      onsessionclosed: (id) => {
        delete transports[id];
        info('Session', `Session closed: ${id}`);
      }
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    server = createMcpServer(baseUrl);
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Invalid session' },
      id: null
    });
  }
});

// MCP GET Endpoint (SSE Stream) - for stateful clients
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const transport = transports[sessionId];

  if (transport) {
    await transport.handleRequest(req, res);
  } else {
    res.status(400).json({ error: 'Invalid session' });
  }
});

// MCP DELETE Endpoint (Close session) - for stateful clients
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const transport = transports[sessionId];

  if (transport) {
    await transport.handleRequest(req, res);
  } else {
    res.status(400).json({ error: 'Invalid session' });
  }
});

// Graceful Shutdown Handler
let httpServer;
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  info('Shutdown', `Received ${signal}, starting graceful shutdown...`);

  // Stop the background indexer
  indexer.stop();

  // Stop accepting new connections
  if (httpServer) {
    httpServer.close(() => {
      info('Shutdown', 'HTTP server closed');
    });
  }

  // Close all active sessions
  const sessionCount = Object.keys(transports).length;
  if (sessionCount > 0) {
    info('Shutdown', `Closing ${sessionCount} active session(s)...`);
    for (const [sessionId, transport] of Object.entries(transports)) {
      try {
        transport.close();
        delete transports[sessionId];
      } catch (err) {
        error('Shutdown', `Failed to close session ${sessionId}: ${err.message}`);
      }
    }
  }

  // Give in-flight requests time to complete (max 10 seconds)
  const shutdownTimeout = 10000;
  const shutdownStart = Date.now();

  await new Promise((resolve) => {
    const checkComplete = setInterval(() => {
      const elapsed = Date.now() - shutdownStart;
      if (Object.keys(transports).length === 0 || elapsed >= shutdownTimeout) {
        clearInterval(checkComplete);
        resolve();
      }
    }, 100);
  });

  info('Shutdown', 'Cleanup complete, exiting');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = config.server.port;
console.log(`[Boot] Starting server on port ${PORT}...`);

httpServer = app.listen(PORT, () => {
  const localUrl = `http://localhost:${PORT}`;
  const publicUrl = config.server.publicUrl;

  console.log('='.repeat(50));
  console.log('Bundestag MCP Server v1.0.0');
  console.log('='.repeat(50));
  console.log(`Port: ${PORT}`);
  console.log(`API: ${config.dipApi.baseUrl}`);
  if (publicUrl) {
    console.log(`Public URL: ${publicUrl}`);
  }
  console.log('='.repeat(50));
  console.log('Endpoints:');
  console.log(`  MCP:           ${localUrl}/mcp`);
  console.log(`  Health:        ${localUrl}/health`);
  console.log(`  Health (deep): ${localUrl}/health/deep`);
  console.log(`  Metrics:       ${localUrl}/metrics`);
  console.log(`  Prometheus:    ${localUrl}/metrics/prometheus`);
  console.log(`  Discovery:     ${localUrl}/.well-known/mcp.json`);
  console.log(`  Info:          ${localUrl}/info`);
  console.log(`  Config:        ${localUrl}/config/:client`);
  console.log('='.repeat(50));
  console.log('Resources:');
  allResources.forEach(r => {
    console.log(`  ${r.uri}`);
  });
  console.log('Resource Templates:');
  allResourceTemplates.forEach(t => {
    console.log(`  ${t.uriTemplate}`);
  });
  console.log('='.repeat(50));
  console.log('Tools:');
  [...allTools, ...semanticSearchTools, ...aggregateTools].forEach(t => {
    console.log(`  ${t.name}`);
  });
  console.log('  get_client_config');
  console.log('='.repeat(50));
  console.log('Prompts:');
  allPrompts.forEach(p => {
    console.log(`  ${p.name}`);
  });
  console.log('='.repeat(50));

  // Start background indexer if enabled
  if (config.qdrant.enabled && config.indexer.enabled) {
    console.log('[Boot] Starting background indexer...');
    console.log(`[Boot]   Document chunk indexing: ${config.indexer.documentIndexingEnabled ? 'enabled' : 'disabled'}`);
    console.log(`[Boot]   Protocol chunk indexing: ${config.indexer.protocolIndexingEnabled ? 'enabled' : 'disabled'}`);
    indexer.start().then(() => {
      console.log('[Boot] Background indexer started');
    }).catch(err => {
      console.error('[Boot] Failed to start indexer:', err.message);
    });
  } else if (config.qdrant.enabled) {
    console.log('[Boot] Qdrant enabled, indexer disabled. Use INDEXER_ENABLED=true to enable.');
  } else {
    console.log('[Boot] Semantic search disabled (QDRANT_ENABLED=false)');
  }

  console.log('='.repeat(50));
  info('Boot', 'Server ready for requests');
});
