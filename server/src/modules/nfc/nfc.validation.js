/**
 * Zod schemas for the NFC Customers module. Transforms double as sanitization:
 * empty optional fields become undefined (so an unset NFC card is absent, not
 * "", keeping the partial unique index clean).
 */
import { z } from 'zod';

const emptyToUndef = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optionalStr = (max) => z.preprocess(emptyToUndef, z.string().trim().max(max).optional());
const objectId = (label) => z.string().regex(/^[a-f0-9]{24}$/i, `Invalid ${label} id.`);

export const idParamSchema = z.object({ id: objectId('record') });

const optionalEmail = z.preprocess(
  (v) => (typeof v === 'string' ? emptyToUndef(v.trim().toLowerCase()) : v),
  z.email('Enter a valid email address.').optional()
);

export const createCompanySchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required.').max(120),
  contactPerson: optionalStr(100),
  phone: optionalStr(30),
  email: optionalEmail,
  city: optionalStr(80),
  notes: optionalStr(2000),
});
export const updateCompanySchema = createCompanySchema.partial();

export const createEmployeeSchema = z.object({
  company: objectId('company'),
  name: z.string().trim().min(1, 'Name is required.').max(120),
  designation: optionalStr(80),
  phone: optionalStr(30),
  idNumber: optionalStr(40),
  nfcCardNumber: optionalStr(60),
  notes: optionalStr(2000),
});
// Company can't be reassigned via edit — keep an employee under the company it
// was created in (simpler, and the UI never offers it).
export const updateEmployeeSchema = createEmployeeSchema.omit({ company: true }).partial();

export const listCompaniesSchema = z.object({
  search: optionalStr(100),
});
