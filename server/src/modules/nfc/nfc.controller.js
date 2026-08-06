/**
 * NFC Customers controller — HTTP translation only. Inputs arrive validated by
 * the Zod middleware; all rules live in the service.
 */
import ApiResponse from '../../utils/ApiResponse.js';
import * as nfcService from './nfc.service.js';

const actor = (req) => ({ userId: req.user.id, ip: req.ip });

/** GET /api/nfc/companies?search → data: companies[] (with employeeCount) */
export async function listCompanies(req, res) {
  const data = await nfcService.listCompanies(req.query);
  res.json(new ApiResponse('NFC companies.', data));
}

/** GET /api/nfc/companies/:id → data: company (+ employees) */
export async function getCompany(req, res) {
  const data = await nfcService.getCompany(req.params.id);
  res.json(new ApiResponse('NFC company.', data));
}

/** POST /api/nfc/companies → 201 data: company */
export async function createCompany(req, res) {
  const data = await nfcService.createCompany(req.body, actor(req));
  res.status(201).json(new ApiResponse('Company created.', data));
}

/** PATCH /api/nfc/companies/:id → data: company */
export async function updateCompany(req, res) {
  const data = await nfcService.updateCompany(req.params.id, req.body, actor(req));
  res.json(new ApiResponse('Company updated.', data));
}

/** DELETE /api/nfc/companies/:id → data: null (cascades its employees) */
export async function deleteCompany(req, res) {
  await nfcService.deleteCompany(req.params.id, actor(req));
  res.json(new ApiResponse('Company deleted.'));
}

/** POST /api/nfc/employees → 201 data: employee */
export async function createEmployee(req, res) {
  const data = await nfcService.createEmployee(req.body, actor(req));
  res.status(201).json(new ApiResponse('Employee added.', data));
}

/** PATCH /api/nfc/employees/:id → data: employee */
export async function updateEmployee(req, res) {
  const data = await nfcService.updateEmployee(req.params.id, req.body, actor(req));
  res.json(new ApiResponse('Employee updated.', data));
}

/** DELETE /api/nfc/employees/:id → data: null */
export async function deleteEmployee(req, res) {
  await nfcService.deleteEmployee(req.params.id, actor(req));
  res.json(new ApiResponse('Employee removed.'));
}
