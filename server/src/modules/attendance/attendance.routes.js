/**
 * Attendance routes.
 *
 * Roles: marking is an operational/HR action (Admin, Manager, HR, Operations).
 * Reading and exporting are open to any authenticated user — Accounts needs
 * the summary for billing/payroll, Viewers may need to look.
 */
import { Router } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  markBulkSchema,
  listAttendanceSchema,
  summarySchema,
  exportSchema,
} from './attendance.validation.js';
import * as attendanceController from './attendance.controller.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/bulk',
  requireRoles('Admin', 'Manager', 'HR', 'Operations'),
  validate({ body: markBulkSchema }),
  asyncHandler(attendanceController.markBulk)
);
router.get('/', validate({ query: listAttendanceSchema }), asyncHandler(attendanceController.list));
router.get(
  '/summary',
  validate({ query: summarySchema }),
  asyncHandler(attendanceController.summary)
);
router.get(
  '/export',
  validate({ query: exportSchema }),
  asyncHandler(attendanceController.exportSummary)
);

export default router;
