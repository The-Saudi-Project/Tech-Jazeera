/**
 * Employee service — all employee business logic. Controllers only translate
 * HTTP; nothing in here touches req/res.
 */
import Employee from './employee.model.js';
import ApiError from '../../utils/ApiError.js';
import { logAudit } from '../audit/audit.service.js';

/**
 * A document counts as "needs attention" when it expires within this many
 * days (or already has). The client mirrors this constant for its badges —
 * if you change it, change client/src/lib/constants.js too.
 */
export const EXPIRY_WARNING_DAYS = 30;

/** Fields the expiry-alert filter inspects. */
const EXPIRY_FIELDS = [
  'passport.expiry',
  'visa.expiry',
  'iqama.expiry',
  'medical.expiry',
  'drivingLicense.expiry',
];

/** Escape user text before embedding it in a $regex — prevents both regex
 *  injection and accidental syntax errors from names like "O'Brien (Ops)". */
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Paginated, searchable, sortable listing.
 * search  → case-insensitive match on name / employeeId / mobile / email
 * status  → exact match
 * alerts  → 'true' keeps only employees with a document expiring within
 *           EXPIRY_WARNING_DAYS (or already expired)
 */
export async function listEmployees({ page, limit, search, status, alerts, sortBy, sortOrder }) {
  // Each condition is AND-ed; search and alerts are each internally OR-ed.
  const conditions = [];
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    conditions.push({
      $or: [{ fullName: rx }, { employeeId: rx }, { mobile: rx }, { email: rx }],
    });
  }
  if (status) conditions.push({ status });
  if (alerts === 'true') {
    const threshold = new Date(Date.now() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
    // $lte against a Date matches only real dates — documents with no expiry
    // (null/absent) are naturally excluded.
    conditions.push({ $or: EXPIRY_FIELDS.map((field) => ({ [field]: { $lte: threshold } })) });
  }
  const filter = conditions.length > 0 ? { $and: conditions } : {};

  // Secondary _id sort keeps pagination stable when the primary key ties
  // (e.g. many employees created the same day).
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1, _id: 1 };

  const [items, total] = await Promise.all([
    Employee.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Employee.countDocuments(filter),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getEmployee(id) {
  const employee = await Employee.findById(id).lean();
  if (!employee) throw new ApiError(404, 'Employee not found.');
  return employee;
}

/** Duplicate employeeId is caught by the unique index → 409 via errorHandler. */
export async function createEmployee(data, actor) {
  const employee = await Employee.create(data);
  await logAudit({
    user: actor.userId,
    action: 'employee.create',
    targetType: 'Employee',
    targetId: employee._id,
    meta: { employeeId: employee.employeeId, fullName: employee.fullName },
    ip: actor.ip,
  });
  return employee.toObject();
}

export async function updateEmployee(id, data, actor) {
  const employee = await Employee.findByIdAndUpdate(id, data, {
    new: true, // return the updated document, not the stale one
    runValidators: true, // Mongoose skips schema validation on updates unless told
  }).lean();
  if (!employee) throw new ApiError(404, 'Employee not found.');
  await logAudit({
    user: actor.userId,
    action: 'employee.update',
    targetType: 'Employee',
    targetId: employee._id,
    meta: { employeeId: employee.employeeId, fields: Object.keys(data) },
    ip: actor.ip,
  });
  return employee;
}

export async function deleteEmployee(id, actor) {
  const employee = await Employee.findByIdAndDelete(id).lean();
  if (!employee) throw new ApiError(404, 'Employee not found.');
  await logAudit({
    user: actor.userId,
    action: 'employee.delete',
    targetType: 'Employee',
    targetId: employee._id,
    meta: { employeeId: employee.employeeId, fullName: employee.fullName },
    ip: actor.ip,
  });
}
