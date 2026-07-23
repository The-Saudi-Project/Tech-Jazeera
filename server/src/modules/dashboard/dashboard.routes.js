/**
 * Dashboard route. Read-only, available to any authenticated user — it's the
 * landing page. (A production deployment might restrict the finance figures to
 * managers; Phase 1 keeps the overview open to all signed-in staff.)
 */
import { Router } from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(dashboardController.overview));

export default router;
