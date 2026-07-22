/**
 * User — a staff member who can LOG IN to the ERP.
 *
 * Deliberately separate from Employee (M4). A User is an account with a
 * password and a role; an Employee is a workforce record with passports,
 * visas and deployments. A deployed welder is an Employee but usually not a
 * User; the accountant is a User but may not be a deployed Employee. The two
 * have independent lifecycles, so they are separate collections (per our
 * references-over-embedding rule).
 */
import mongoose from 'mongoose';

/**
 * Role list, exported as the single source of truth — rbac middleware,
 * validation schemas, and the seed script all import it from here so a new
 * role is added in exactly one place.
 */
export const ROLES = ['Admin', 'Manager', 'HR', 'Operations', 'Accounts', 'Viewer'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // lowercase + unique index: 'Ali@x.com' and 'ali@x.com' are one account.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // `select: false` — the hash NEVER leaves the DB unless a query opts in
    // with .select('+passwordHash'). Prevents accidentally serializing it.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    // Soft on/off switch: deactivate a leaver instead of deleting them, so
    // their audit history keeps pointing at a real user.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
