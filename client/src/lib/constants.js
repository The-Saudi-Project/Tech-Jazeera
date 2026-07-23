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
