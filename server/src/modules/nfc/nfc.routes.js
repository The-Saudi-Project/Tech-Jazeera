/**
 * NFC Customers routes — an Admin-only directory, separate from Clients.
 * requireRoles('Admin') also excludes Workers, so no requireStaff is needed.
 */
import { Router } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createCompanySchema,
  updateCompanySchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  listCompaniesSchema,
  idParamSchema,
} from './nfc.validation.js';
import * as nfcController from './nfc.controller.js';

const router = Router();

router.use(requireAuth, requireRoles('Admin'));

// Companies
router.get('/companies', validate({ query: listCompaniesSchema }), asyncHandler(nfcController.listCompanies));
router.post('/companies', validate({ body: createCompanySchema }), asyncHandler(nfcController.createCompany));
router.get('/companies/:id', validate({ params: idParamSchema }), asyncHandler(nfcController.getCompany));
router.patch(
  '/companies/:id',
  validate({ params: idParamSchema, body: updateCompanySchema }),
  asyncHandler(nfcController.updateCompany)
);
router.delete('/companies/:id', validate({ params: idParamSchema }), asyncHandler(nfcController.deleteCompany));

// Employees (belong to a company)
router.post('/employees', validate({ body: createEmployeeSchema }), asyncHandler(nfcController.createEmployee));
router.patch(
  '/employees/:id',
  validate({ params: idParamSchema, body: updateEmployeeSchema }),
  asyncHandler(nfcController.updateEmployee)
);
router.delete('/employees/:id', validate({ params: idParamSchema }), asyncHandler(nfcController.deleteEmployee));

export default router;
