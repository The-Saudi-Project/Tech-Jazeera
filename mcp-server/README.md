# CRM MCP Server

A standalone MCP (Model Context Protocol) bridge over the Al Jazeera CRM API,
for use with Claude Desktop or Cursor. Separate Node.js project — its own
`package.json`, not part of `client/` or `server/`.

**Read-only by design.** Every tool here issues a `GET` and nothing else.
`src/api.js`'s request interceptor hard-blocks any other HTTP method at the
code level — not just "we only wrote GET tools so far." See that file's own
comment if you ever deliberately want to add a write capability later.

## Tools

| Tool | Hits | Notes |
|---|---|---|
| `get_dashboard_summary` | `GET /dashboard` | optional `thresholdDays` |
| `get_standby_analysis` | `GET /dashboard/standby-analysis` | |
| `list_deployments` | `GET /deployments` | optional `status` (`Active`\|`Ended`), `worker` (Employee id), `limit` |
| `get_pending_hours` | `GET /deployments/pending-hours` | |
| `get_payments_due` | `GET /deployments/payments-due` | |
| `list_employees` | `GET /employees` | optional `status` (`Active`\|`On Leave`\|`Exited`), `limit` |
| `list_clients` | `GET /clients` | optional `limit` |

## Setup

```bash
cd mcp-server
npm install
cp .env.example .env
```

Edit `.env`:
- `CRM_API_BASE` — defaults to the real production API
  (`https://techjazeera.duckdns.org/api`). Point it at
  `http://localhost:5000/api` while developing/testing this bridge instead.
- `CRM_SERVICE_EMAIL` / `CRM_SERVICE_PASSWORD` — **create a dedicated login
  for this bridge first** (don't reuse your own). A full Admin login is the
  simplest choice — every tool here is read-only, so the real tradeoff is
  scope (an AI tool can read everything an Admin can), not mutation risk.
  Every call this bridge makes is attributed to this login in the CRM's own
  audit log.
- `CRM_SERVICE_TOKEN` — optional, leave blank. The bridge logs in
  automatically with the email/password above the moment any request gets a
  401 (access tokens expire after 15 minutes) and keeps itself refreshed for
  as long as the process runs.

Test it standalone:

```bash
npm start
```

It should sit waiting on stdio with no output (that's correct — this is how
an MCP server behaves outside a real client). Ctrl+C to stop.

## Register with Claude Desktop

Edit `claude_desktop_config.json`:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "aljazeera-crm": {
      "command": "node",
      "args": ["C:\\Users\\JARVIS\\Desktop\\Al Jazeera CRM\\mcp-server\\src\\index.js"]
    }
  }
}
```

(Use the real absolute path on your machine. `.env` in this project folder
is loaded automatically — no need to repeat the values in an `env` block
here, though you can override any of them that way if you prefer.)

Restart Claude Desktop afterward.

## Register with Cursor

Cursor reads the same shape from its own MCP settings
(Settings → MCP, or `.cursor/mcp.json` in a project):

```json
{
  "mcpServers": {
    "aljazeera-crm": {
      "command": "node",
      "args": ["C:\\Users\\JARVIS\\Desktop\\Al Jazeera CRM\\mcp-server\\src\\index.js"]
    }
  }
}
```

## Security notes

- `.env` is gitignored — never commit it. `.env.example` has no real values.
- This bridge can only ever `GET` (see `src/api.js`). If you want it to also
  write to the CRM later, that's a deliberate code change there, not a
  config flag.
- Whatever the service account in `.env` can read via Section Access, this
  bridge — and therefore any AI tool using it — can read. Scope that account
  accordingly.
