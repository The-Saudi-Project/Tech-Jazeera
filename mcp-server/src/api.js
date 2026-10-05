/**
 * API client for the CRM backend — one shared axios instance every MCP tool
 * in src/index.js calls through, and the ONLY place that's allowed to know
 * about auth or make an HTTP request at all.
 *
 * Read-only by design (the user's own explicit requirement): the request
 * interceptor below hard-blocks any method other than GET. This is a
 * structural guarantee, not a convention each tool has to remember to
 * follow — if a future tool is written with `api.post(...)`, it fails
 * immediately and loudly instead of silently reaching production. Lifting
 * this later is a deliberate one-line change here, never automatic.
 */
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Loaded relative to this file, not process.cwd() — Claude Desktop/Cursor
// launch an MCP server with whatever working directory THEY have, not this
// project's folder, so a bare `import 'dotenv/config'` would silently find
// no .env at all once this runs outside a manual `node src/index.js` here.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { CRM_API_BASE, CRM_SERVICE_TOKEN, CRM_SERVICE_EMAIL, CRM_SERVICE_PASSWORD } = process.env;

if (!CRM_API_BASE) {
  throw new Error('CRM_API_BASE is not set — copy .env.example to .env and fill it in.');
}

// In-memory only, never persisted — a fresh process always starts from
// CRM_SERVICE_TOKEN if one was given (skips one login round trip), or from
// nothing at all, in which case the very first request below gets a 401 and
// the response interceptor logs in to get a real one. Access tokens on this
// CRM expire after 15 minutes, so this will refresh itself repeatedly over
// the life of a long-running MCP process.
let currentAccessToken = CRM_SERVICE_TOKEN || null;

/**
 * Logs in with the service account and returns a fresh access token.
 * Deliberately a plain, separate `axios.post` — NOT routed through the
 * `api` instance below, so this one legitimate POST this file ever makes
 * can never be mistaken for (or blocked by) the read-only guard on `api`.
 */
async function login() {
  if (!CRM_SERVICE_EMAIL || !CRM_SERVICE_PASSWORD) {
    throw new Error(
      'Got a 401 and cannot refresh: CRM_SERVICE_EMAIL/CRM_SERVICE_PASSWORD are not set in .env.'
    );
  }
  const response = await axios.post(`${CRM_API_BASE}/auth/login`, {
    email: CRM_SERVICE_EMAIL,
    password: CRM_SERVICE_PASSWORD,
  });
  const token = response.data?.data?.accessToken;
  if (!token) {
    throw new Error('Login succeeded but the response had no data.accessToken — did the API contract change?');
  }
  currentAccessToken = token;
  return token;
}

export const api = axios.create({ baseURL: CRM_API_BASE });

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (method !== 'get') {
    return Promise.reject(
      new Error(
        `Blocked ${method.toUpperCase()} ${config.url} — this MCP server is read-only by design (see the top of src/api.js to change that deliberately).`
      )
    );
  }
  if (currentAccessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

// Auto-refresh on 401: log in fresh and retry the ORIGINAL request exactly
// once. A second 401 right after a successful fresh login is a real
// authorization problem (disabled account, no Section Access grant for this
// endpoint, etc.) — surfaced to the caller as-is, never retried again, so a
// genuinely broken credential can't turn into a retry storm against the
// login endpoint's own rate limiter.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retriedAfterLogin) {
      original._retriedAfterLogin = true;
      const token = await login();
      original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
      return api(original);
    }
    return Promise.reject(error);
  }
);

/**
 * Turns an axios error into one clean line for an LLM to read — never a raw
 * stack trace or axios's own verbose error object. Every tool handler in
 * src/index.js runs its api.get() through this before returning a failure.
 */
export function formatApiError(error) {
  if (error.response) {
    const message = error.response.data?.message || error.response.statusText || 'Unknown error';
    return `API Error (${error.response.status}): ${message}`;
  }
  if (error.request) {
    return `API Error: no response received from ${CRM_API_BASE} (${error.message})`;
  }
  return `API Error: ${error.message}`;
}
