// Run from either repository: node ../.qa-audit/performance-2026-09-21/reproduce.mjs
// Uses real application code with in-process model stubs. Never connects to MongoDB
// or sends web push. Existing .env supplies configuration; no secret is printed.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const serverDir = path.join(root, 'server');
const require = createRequire(path.join(serverDir, 'package.json'));
process.chdir(serverDir);
require('dotenv').config({ path: path.join(serverDir, '.env') });
process.env.NODE_ENV = 'development';
process.env.SENTRY_DSN = '';
const load = (relative) => import(pathToFileURL(path.join(serverDir, 'src', relative)).href);
const model = async (relative) => (await load(`modules/${relative}.model.js`)).default;
const out = (probe, result) => console.log(JSON.stringify({ probe, ...result }));
const actorId = '000000000000000000000001';
const jwt = require('jsonwebtoken');
const { default: app } = await load('app.js');
const User = await model('auth/user');
const Notification = await model('notifications/notification');
let authReads = 0;
User.findById = () => ({ lean: async () => {
  authReads++;
  return { _id: actorId, name: 'Audit fixture', role: 'Admin', isActive: true, tokenVersion: 0 };
} });
function query(value) {
  let q;
  q = new Proxy({ then: (resolve, reject) => Promise.resolve(value).then(resolve, reject) }, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'lean') return async () => value;
      return () => q;
    },
  });
  return q;
}
Notification.find = () => query([]);
Notification.countDocuments = async () => 0;
const listener = app.listen(0, '127.0.0.1');
await new Promise((resolve) => listener.on('listening', resolve));
const base = `http://127.0.0.1:${listener.address().port}`;
try {
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  await health.text();
  const token = jwt.sign({ sub: actorId, tokenVersion: 0 }, process.env.JWT_ACCESS_SECRET, { expiresIn: '2m' });
  const response = await fetch(`${base}/api/notifications?limit=10`, { headers: { Authorization: `Bearer ${token}` } });
  await response.text();
  out('duplicate-authentication', { status: response.status, userReads: authReads });
  let first429 = null;
  for (let requestNumber = 3; requestNumber <= 601; requestNumber++) {
    const r = await fetch(`${base}/api/health`);
    await r.text();
    if (r.status === 429) { first429 = requestNumber; break; }
  }
  out('rate-limit', { first429Request: first429 });
} finally {
  await new Promise((resolve) => listener.close(resolve));
}

const Employee = await model('employees/employee');
const Deployment = await model('deployments/deployment');
const Timesheet = await model('timesheets/timesheet');
const LeaveRequest = await model('leave/leaveRequest');
const PayrollRun = await model('payroll/payrollRun');
const AuditLog = await model('audit/audit');
const { createPayrollRun } = await load('modules/payroll/payroll.service.js');
let counts = {}, active = 0, maxActive = 0;
function delayed(value, key, ms = 10) {
  const q = { select: () => q, lean: async () => {
    counts[key] = (counts[key] || 0) + 1;
    maxActive = Math.max(maxActive, ++active);
    await new Promise((resolve) => setTimeout(resolve, ms));
    active--;
    return value;
  } };
  return q;
}
PayrollRun.findOne = () => delayed(null, 'existing', 0);
PayrollRun.prototype.save = async function () { return this; };
AuditLog.create = async () => ({});
Deployment.find = () => delayed([], 'deployment');
Timesheet.find = () => delayed([], 'timesheet');
LeaveRequest.find = () => delayed([], 'leave');
for (const n of [10, 100]) {
  counts = {}; maxActive = 0;
  Employee.find = () => delayed(Array.from({ length: n }, (_, i) => ({
    _id: (i + 2).toString(16).padStart(24, '0'), fullName: `Fixture ${i}`, employeeId: `AUD${i}`, salary: 3000,
  })), 'employees', 0);
  const start = performance.now();
  await createPayrollRun({ periodYear: 2026, periodMonth: 9 }, { userId: actorId });
  out('payroll', { employees: n, injectedReadDelayMs: 10, elapsedMs: Math.round(performance.now() - start), counts, maxConcurrentReads: maxActive });
}

const { webpush, pushEnabled } = await load('config/webPush.js');
const Subscription = await model('notifications/pushSubscription');
const { notifyUserSafely } = await load('modules/notifications/notification.service.js');
Notification.create = async (data) => ({ ...data, toObject: () => data });
Subscription.find = () => query([{ endpoint: 'https://example.invalid/fixture', keys: {} }]);
webpush.sendNotification = async () => new Promise((resolve) => setTimeout(resolve, 250));
for (const n of [1, 4]) {
  const start = performance.now();
  for (let i = 0; i < n; i++) await notifyUserSafely(actorId, { type: 'RequestStatus', title: 'Fixture' });
  out('push-delay', { recipients: n, pushEnabled, injectedPushDelayMs: 250, elapsedMs: Math.round(performance.now() - start), externalRequests: 0 });
}

const XLSX = require('xlsx');
const { parseAttendanceWorkbook } = await load('modules/timesheetProcessor/timesheet.parser.js');
for (const n of [1000, 50000]) {
  const rows = [['Date', 'Time', 'Employee ID'], ...Array.from({ length: n }, (_, i) => [
    `2026-09-${String(i % 30 + 1).padStart(2, '0')}`, i % 2 ? '17:00' : '08:00', 'AUDIT',
  ])];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Punches');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true });
  let fired = false;
  const start = performance.now();
  const timer = new Promise((resolve) => setTimeout(() => { fired = true; resolve(performance.now() - start); }, 0));
  const parsed = await parseAttendanceWorkbook(buffer, { year: 2026, month: 9 });
  const parseMs = Math.round(performance.now() - start), timerDuringParsing = fired;
  out('parser-blocking', { rows: n, fileBytes: buffer.length, parseMs, timerDuringParsing, timerDelayMs: Math.round(await timer), punches: parsed.punches.length });
}
