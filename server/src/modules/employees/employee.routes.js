/**
 * Employee routes.
 *
 * Role design: every authenticated role may READ (the whole company runs on
 * looking employees up); WRITE is Admin/Manager/HR (the people who own
 * workforce data); DELETE is Admin/HR only — it destroys history, so the
 * circle is smaller. Status 'Exited' is the everyday alternative to delete.
 */
import { Router } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesSchema,
  employeeIdParamSchema,
} from './employee.validation.js';
import * as employeeController from './employee.controller.js';

const router = Router();

// Everything below requires a logged-in user.
router.use(requireAuth);

router.get('/', validate({ query: listEmployeesSchema }), asyncHandler(employeeController.list));
router.get(
  '/:id',
  validate({ params: employeeIdParamSchema }),
  asyncHandler(employeeController.get)
);
router.post(
  '/',
  requireRoles('Admin', 'Manager', 'HR'),
  validate({ body: createEmployeeSchema }),
  asyncHandler(employeeController.create)
);
router.patch(
  '/:id',
  requireRoles('Admin', 'Manager', 'HR'),
  validate({ params: employeeIdParamSchema, body: updateEmployeeSchema }),
  asyncHandler(employeeController.update)
);
router.delete(
  '/:id',
  requireRoles('Admin', 'HR'),
  validate({ params: employeeIdParamSchema }),
  asyncHandler(employeeController.remove)
);

export default router;
