/**
 * Zod schema for the timesheet processor. The file rides as multipart (handled
 * by multer, validated by the upload filter); these are the text fields, which
 * multer delivers as strings, hence the coercions.
 */
import { z } from 'zod';
import { MIN_REQUIRED_MINUTES, MAX_REQUIRED_MINUTES } from './timesheet.constants.js';

export const processTimesheetSchema = z.object({
  employeeId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid employee id.'),
  month: z.coerce.number().int().min(1, 'Pick a month.').max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  // Optional per-run override of the 08:00 default (in minutes).
  requiredMinutes: z.coerce
    .number()
    .int()
    .min(MIN_REQUIRED_MINUTES)
    .max(MAX_REQUIRED_MINUTES)
    .optional(),
});
