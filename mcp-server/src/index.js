/**
 * CRM MCP server — exposes a fixed set of READ-ONLY tools over the Al
 * Jazeera CRM API for Claude Desktop / Cursor, via stdio. Every tool here
 * does a GET and nothing else; see src/api.js for the structural guarantee
 * behind that, not just a convention followed tool-by-tool.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { api, formatApiError } from './api.js';

const server = new McpServer({ name: 'crm-mcp-server', version: '1.0.0' });

const EMPLOYEE_ID = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, 'Must be the Employee record’s 24-character Mongo id, not an employee code like AJ-001.');

/** Every tool below is a GET + "return the JSON, or a clean error" — the one
 *  place that shape lives, so no tool handler repeats the try/catch. */
async function getAsToolResult(path, params = {}) {
  try {
    const { data } = await api.get(path, { params });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: formatApiError(error) }], isError: true };
  }
}

server.registerTool(
  'get_dashboard_summary',
  {
    title: 'Get dashboard summary',
    description:
      'Company-wide dashboard: revenue/profit/pipeline figures, pending-action counts, and the coordinator leaderboard inputs. Read-only.',
    inputSchema: {
      thresholdDays: z
        .number()
        .int()
        .min(1)
        .max(365)
        .optional()
        .describe('Document-expiry alert window in days (server default: 30).'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ thresholdDays }) => getAsToolResult('/dashboard', { thresholdDays })
);

server.registerTool(
  'get_standby_analysis',
  {
    title: 'Get standby workforce analysis',
    description: 'Breakdown of the workforce currently free to mobilise vs. actively placed with a client. Read-only.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => getAsToolResult('/dashboard/standby-analysis')
);

server.registerTool(
  'list_deployments',
  {
    title: 'List deployments',
    description:
      "List worker placements at clients. 'Active' = currently mobilised with a client right now; 'Ended' = placement is over. Read-only.",
    inputSchema: {
      status: z.enum(['Active', 'Ended']).optional(),
      worker: EMPLOYEE_ID.optional().describe('Limit to one Employee’s own placement history.'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(5000)
        .optional()
        .describe('Max rows to return (server default is only 20 — pass a higher value for a fuller list).'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ status, worker, limit }) => getAsToolResult('/deployments', { status, worker, limit: limit ?? 200 })
);

server.registerTool(
  'get_pending_hours',
  {
    title: 'Get pending hours queue',
    description: 'Monthly client-timesheet hours entries awaiting an Approve/Reject decision. Read-only.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => getAsToolResult('/deployments/pending-hours')
);

server.registerTool(
  'get_payments_due',
  {
    title: 'Get payments due',
    description: 'Clients with at least one outstanding invoice, soonest-due first. Read-only.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => getAsToolResult('/deployments/payments-due')
);

server.registerTool(
  'list_employees',
  {
    title: 'List employees',
    description: 'List company employees, optionally filtered by status. Read-only.',
    inputSchema: {
      status: z.enum(['Active', 'On Leave', 'Exited']).optional(),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Max rows to return (server default is only 10).'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ status, limit }) => getAsToolResult('/employees', { status, limit: limit ?? 100 })
);

server.registerTool(
  'list_clients',
  {
    title: 'List clients',
    description: 'List the customer companies this business supplies workers to. Read-only.',
    inputSchema: {
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Max rows to return (server default is only 10).'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ limit }) => getAsToolResult('/clients', { limit: limit ?? 100 })
);

const transport = new StdioServerTransport();
await server.connect(transport);
