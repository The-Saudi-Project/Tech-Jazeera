const fs = require('fs');

let code = fs.readFileSync('server/src/modules/deployments/deployment.routes.js', 'utf8');

const importsToAdd = `  recordSubInvoiceSchema,
  subcontractorIdParamSchema,
  subcontractorPaymentIdParamSchema,
  recordSubcontractorPaymentSchema,
  decideSubcontractorPaymentSchema,
`;
code = code.replace(
  "  decideClientPaymentSchema,",
  "  decideClientPaymentSchema,\n" + importsToAdd
);

const routesToAdd = `
router.get('/sub-payments-due', asyncHandler(deploymentController.subPaymentsDue));
router.get('/paid-sub-invoices', asyncHandler(deploymentController.paidSubInvoices));
router.get(
  '/sub-payments-due/:subcontractorId',
  validate({ params: subcontractorIdParamSchema }),
  asyncHandler(deploymentController.subcontractorPaymentDetail)
);
router.post(
  '/sub-payments-due/:subcontractorId/payments',
  validate({ params: subcontractorIdParamSchema, body: recordSubcontractorPaymentSchema }),
  asyncHandler(deploymentController.recordSubcontractorPayment)
);
router.patch(
  '/sub-payments/:paymentId/decide',
  canDecidePayment,
  validate({ params: subcontractorPaymentIdParamSchema, body: decideSubcontractorPaymentSchema }),
  asyncHandler(deploymentController.decideSubcontractorPayment)
);
router.get('/ready-for-sub-invoice', asyncHandler(deploymentController.readyForSubInvoice));
router.post(
  '/:id/monthly-hours/:entryId/sub-invoice',
  canInvoice,
  uploadSingle,
  validate({ params: monthlyHoursEntryParamSchema, body: recordSubInvoiceSchema }),
  asyncHandler(deploymentController.recordSubInvoice)
);
`;

// Insert the new routes before `router.get('/export'`
code = code.replace(
  "router.get(\n  '/export',",
  routesToAdd + "\nrouter.get(\n  '/export',"
);

fs.writeFileSync('server/src/modules/deployments/deployment.routes.js', code);
console.log('Updated deployment.routes.js');
