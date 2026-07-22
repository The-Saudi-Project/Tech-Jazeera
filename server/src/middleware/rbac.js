/**
 * requireRoles — decides WHAT an authenticated user may do.
 *
 * Usage (always AFTER requireAuth in the chain):
 *   router.get('/', requireAuth, requireRoles('Admin', 'HR'), controller)
 *
 * Authentication (who are you) and authorization (what may you do) are kept
 * as two middlewares because most routes share the same requireAuth but
 * differ in allowed roles.
 */
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../modules/auth/user.model.js';

export const requireRoles = (...allowedRoles) => {
  // Catch typos like requireRoles('Adm1n') at boot, not at request time.
  for (const role of allowedRoles) {
    if (!ROLES.includes(role)) {
      throw new Error(`requireRoles: unknown role "${role}". Valid roles: ${ROLES.join(', ')}`);
    }
  }

  return (req, res, next) => {
    if (!req.user) {
      // Programmer error: rbac ran before requireAuth. Fail loudly.
      throw new ApiError(500, 'Something went wrong. Please try again.');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action.');
    }
    next();
  };
};
