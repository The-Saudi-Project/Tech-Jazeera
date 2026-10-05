const fs = require('fs');

// Add to schema
let valCode = fs.readFileSync('server/src/modules/financialRequests/advance.validation.js', 'utf8');
const schemaAdd = `
export const submitAnnualVacationSchema = z.object({
  requestedDays: z.coerce.number().min(1, 'Must request at least 1 day').max(90, 'Max 90 days'),
  reason: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(1000).optional()
  ),
});
`;
fs.writeFileSync('server/src/modules/financialRequests/advance.validation.js', valCode + schemaAdd);

// Add to controller
let ctrlCode = fs.readFileSync('server/src/modules/financialRequests/advance.controller.js', 'utf8');
const ctrlAdd = `
import * as annualVacationService from './annualVacation.service.js';
export async function submitAnnualVacation(req, res) {
  const data = await annualVacationService.submitAnnualVacation(req.body.employee, req.body, req.user);
  res.status(201).json(data);
}
`;
fs.writeFileSync('server/src/modules/financialRequests/advance.controller.js', ctrlCode + ctrlAdd);

// Add to routes
let routesCode = fs.readFileSync('server/src/modules/financialRequests/financialRequests.routes.js', 'utf8');
routesCode = routesCode.replace('submitAdvanceSchema,', 'submitAdvanceSchema, submitAnnualVacationSchema,');
const routesAdd = `
router.post(
  '/annual-vacation',
  requireEmployeeAuth,
  validate({ body: submitAnnualVacationSchema.extend({ employee: z.string().regex(/^[a-f0-9]{24}$/i) }) }),
  asyncHandler(advanceController.submitAnnualVacation)
);
`;
routesCode = routesCode.replace("export default router;", routesAdd + "\nexport default router;");
fs.writeFileSync('server/src/modules/financialRequests/financialRequests.routes.js', routesCode);

console.log('Added annual vacation routes');
