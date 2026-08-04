/**
 * Timesheet Processor routes — an Admin-only internal tool.
 *
 * The upload uses a module-local Multer with MEMORY storage (the file is parsed
 * and discarded, never persisted), deliberately separate from the document
 * upload middleware so this module can't affect it. Both endpoints take the same
 * multipart input; `/preview` returns JSON, `/export` streams the .xlsx.
 */
import { Router } from 'express';
import multer from 'multer';
import asyncHandler from '../../utils/asyncHandler.js';
import ApiError from '../../utils/ApiError.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { processTimesheetSchema } from './timesheet.validation.js';
import * as timesheetController from './timesheet.controller.js';
import { XLSX_MIME, MAX_FILE_BYTES } from './timesheet.constants.js';

const router = Router();

// One operator: Admin only. requireRoles('Admin') also excludes Workers.
router.use(requireAuth, requireRoles('Admin'));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (req, file, cb) => {
    const nameIsXlsx = /\.xlsx$/i.test(file.originalname || '');
    // Browsers sometimes mislabel .xlsx as octet-stream/zip; accept those when
    // the name says .xlsx. The parser still rejects anything that isn't a real
    // workbook, so this is safe.
    const looseTypes = ['application/octet-stream', 'application/zip', 'application/vnd.ms-excel'];
    if (file.mimetype === XLSX_MIME || (nameIsXlsx && looseTypes.includes(file.mimetype))) {
      return cb(null, true);
    }
    return cb(new ApiError(400, 'Please upload a .xlsx Excel file.'));
  },
}).single('file');

/** Wrap Multer so its errors become our standard ApiError envelope. */
function uploadTimesheet(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, `File is too large (maximum ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB).`));
      }
      return next(new ApiError(400, `Upload error: ${err.message}`));
    }
    return next(err); // ApiError from the filter, or anything unexpected
  });
}

router.post(
  '/preview',
  uploadTimesheet,
  validate({ body: processTimesheetSchema }),
  asyncHandler(timesheetController.preview)
);
router.post(
  '/export',
  uploadTimesheet,
  validate({ body: processTimesheetSchema }),
  asyncHandler(timesheetController.exportXlsx)
);

export default router;
