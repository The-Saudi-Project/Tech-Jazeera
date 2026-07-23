/**
 * Client-wide constants. The API origin can be overridden per environment
 * (VITE_API_URL in client/.env) without touching code — required when the
 * app is deployed and the API is no longer on localhost.
 */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

/** Mirrors server/src/modules/employees/employee.service.js — keep in sync. */
export const EXPIRY_WARNING_DAYS = 30;

/** Mirrors the Employee model's status enum. */
export const EMPLOYEE_STATUSES = ['Active', 'On Leave', 'Exited'];

/** Mirror of the server's route guards — used only to hide UI the API would
 *  reject anyway. The server is the real enforcement. */
export const EMPLOYEE_WRITE_ROLES = ['Admin', 'Manager', 'HR'];
export const EMPLOYEE_DELETE_ROLES = ['Admin', 'HR'];

/** Mirrors the Client model's status enum. */
export const CLIENT_STATUSES = ['Active', 'Inactive'];

/** Mirror of the client route guards (server enforces). */
export const CLIENT_WRITE_ROLES = ['Admin', 'Manager', 'Operations'];
export const CLIENT_DELETE_ROLES = ['Admin', 'Manager'];

/** Mirrors the Deployment model enums. */
export const DEPLOYMENT_SHIFTS = ['Day', 'Night', 'Rotating'];
export const DEPLOYMENT_STATUSES = ['Active', 'Ended'];

/** Mirror of the deployment route guards (server enforces). */
export const DEPLOYMENT_WRITE_ROLES = ['Admin', 'Manager', 'Operations'];

/** Mirrors the Attendance model enum, with display metadata used by the
 *  marking grid and summary. `letter` labels grid cells; `variant` is the
 *  Badge variant; `cell` is the grid-cell colour. */
export const ATTENDANCE_STATUS_META = {
  Present: { letter: 'P', variant: 'success', cell: 'bg-success/15 text-success' },
  Absent: { letter: 'A', variant: 'danger', cell: 'bg-danger/15 text-danger' },
  Leave: { letter: 'L', variant: 'warning', cell: 'bg-warning/15 text-warning' },
  Sick: { letter: 'S', variant: 'primary', cell: 'bg-primary/15 text-primary' },
  Off: { letter: 'O', variant: 'default', cell: 'bg-border/60 text-muted' },
};
export const ATTENDANCE_STATUSES = Object.keys(ATTENDANCE_STATUS_META);

/** Mirror of the attendance write guard (server enforces). */
export const ATTENDANCE_WRITE_ROLES = ['Admin', 'Manager', 'HR', 'Operations'];
