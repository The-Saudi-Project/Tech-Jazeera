/**
 * NFC Customers service — all business logic for companies and their people.
 * Controllers only translate HTTP; nothing here touches req/res.
 */
import NfcCompany from './nfcCompany.model.js';
import NfcEmployee from './nfcEmployee.model.js';
import ApiError from '../../utils/ApiError.js';
import { logAudit } from '../audit/audit.service.js';

/** Escape user text before embedding in a $regex (injection / bad-syntax guard). */
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Reject a card number already held by someone else (nicer than the raw 409). */
async function assertCardFree(nfcCardNumber, exceptId = null) {
  if (!nfcCardNumber) return;
  const query = { nfcCardNumber };
  if (exceptId) query._id = { $ne: exceptId };
  const clash = await NfcEmployee.findOne(query).select('_id').lean();
  if (clash) throw new ApiError(409, 'That NFC card number is already assigned to someone else.');
}

/** List companies (optional search) with each one's employee count. */
export async function listCompanies({ search }) {
  const filter = {};
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ companyName: rx }, { contactPerson: rx }, { phone: rx }, { city: rx }];
  }
  const companies = await NfcCompany.find(filter).sort({ companyName: 1 }).lean();
  const counts = await NfcEmployee.aggregate([{ $group: { _id: '$company', count: { $sum: 1 } } }]);
  const countBy = new Map(counts.map((c) => [c._id.toString(), c.count]));
  return companies.map((c) => ({ ...c, employeeCount: countBy.get(c._id.toString()) ?? 0 }));
}

/** One company plus its employees (name-sorted). */
export async function getCompany(id) {
  const company = await NfcCompany.findById(id).lean();
  if (!company) throw new ApiError(404, 'Company not found.');
  const employees = await NfcEmployee.find({ company: id }).sort({ name: 1 }).lean();
  return { ...company, employees };
}

export async function createCompany(data, actor) {
  const company = await NfcCompany.create(data);
  await logAudit({
    user: actor.userId,
    action: 'nfc.company.create',
    targetType: 'NfcCompany',
    targetId: company._id,
    meta: { companyName: company.companyName },
    ip: actor.ip,
  });
  return company.toObject();
}

export async function updateCompany(id, data, actor) {
  const company = await NfcCompany.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  if (!company) throw new ApiError(404, 'Company not found.');
  await logAudit({
    user: actor.userId,
    action: 'nfc.company.update',
    targetType: 'NfcCompany',
    targetId: company._id,
    meta: { companyName: company.companyName, fields: Object.keys(data) },
    ip: actor.ip,
  });
  return company;
}

export async function deleteCompany(id, actor) {
  const company = await NfcCompany.findByIdAndDelete(id).lean();
  if (!company) throw new ApiError(404, 'Company not found.');
  const removed = await NfcEmployee.deleteMany({ company: id }); // cascade its people
  await logAudit({
    user: actor.userId,
    action: 'nfc.company.delete',
    targetType: 'NfcCompany',
    targetId: id,
    meta: { companyName: company.companyName, removedEmployees: removed.deletedCount },
    ip: actor.ip,
  });
}

export async function createEmployee(data, actor) {
  const company = await NfcCompany.findById(data.company).select('companyName').lean();
  if (!company) throw new ApiError(404, 'Company not found.');
  await assertCardFree(data.nfcCardNumber);
  const employee = await NfcEmployee.create(data);
  await logAudit({
    user: actor.userId,
    action: 'nfc.employee.create',
    targetType: 'NfcEmployee',
    targetId: employee._id,
    meta: { name: employee.name, company: company.companyName },
    ip: actor.ip,
  });
  return employee.toObject();
}

export async function updateEmployee(id, data, actor) {
  if (data.nfcCardNumber) await assertCardFree(data.nfcCardNumber, id);
  const employee = await NfcEmployee.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  if (!employee) throw new ApiError(404, 'Employee not found.');
  await logAudit({
    user: actor.userId,
    action: 'nfc.employee.update',
    targetType: 'NfcEmployee',
    targetId: employee._id,
    meta: { name: employee.name, fields: Object.keys(data) },
    ip: actor.ip,
  });
  return employee;
}

export async function deleteEmployee(id, actor) {
  const employee = await NfcEmployee.findByIdAndDelete(id).lean();
  if (!employee) throw new ApiError(404, 'Employee not found.');
  await logAudit({
    user: actor.userId,
    action: 'nfc.employee.delete',
    targetType: 'NfcEmployee',
    targetId: employee._id,
    meta: { name: employee.name },
    ip: actor.ip,
  });
}
