/**
 * Client-side form schemas for the NFC Customers module (react-hook-form +
 * Zod). Empty optional fields are allowed; the server trims and drops them.
 */
import { z } from 'zod';

export const companyFormSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required.').max(120),
  contactPerson: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.union([z.literal(''), z.string().email('Enter a valid email address.')]).optional(),
  city: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const emptyCompanyForm = {
  companyName: '',
  contactPerson: '',
  phone: '',
  email: '',
  city: '',
  notes: '',
};

export const employeeFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(120),
  designation: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  idNumber: z.string().trim().max(40).optional(),
  nfcCardNumber: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const emptyEmployeeForm = {
  name: '',
  designation: '',
  phone: '',
  idNumber: '',
  nfcCardNumber: '',
  notes: '',
};
