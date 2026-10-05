const fs = require('fs');

let code = fs.readFileSync('server/src/modules/deployments/deployment.controller.js', 'utf8');

code = code.replace(
  "import * as clientPaymentService from './clientPayment.service.js';",
  "import * as clientPaymentService from './clientPayment.service.js';\nimport * as subcontractorPaymentService from './subcontractorPayment.service.js';\nimport * as subcontractorInvoiceService from './subcontractorInvoice.service.js';"
);

code += `
export async function recordSubInvoice(req, res) {
  const file = req.file;
  const data = await subcontractorInvoiceService.recordSubInvoice(req.params.id, req.params.entryId, req.body, file, actor(req));
  res.json(data);
}

export async function readyForSubInvoice(req, res) {
  const data = await subcontractorInvoiceService.getReadyForSubInvoice(actor(req));
  res.json({ items: data });
}

export async function subPaymentsDue(req, res) {
  const data = await subcontractorInvoiceService.getSubcontractorsPaymentSummary(actor(req));
  res.json({ items: data });
}

export async function paidSubInvoices(req, res) {
  const data = await subcontractorInvoiceService.getPaidSubInvoices(actor(req));
  res.json({ items: data });
}

export async function subcontractorPaymentDetail(req, res) {
  const data = await subcontractorInvoiceService.getSubcontractorPaymentDetail(req.params.subcontractorId, actor(req));
  res.json(data);
}

export async function recordSubcontractorPayment(req, res) {
  const data = await subcontractorPaymentService.recordSubcontractorPayment(req.params.subcontractorId, req.body, actor(req));
  res.status(201).json(data);
}

export async function decideSubcontractorPayment(req, res) {
  const data = await subcontractorPaymentService.decideSubcontractorPayment(req.params.paymentId, req.body, actor(req));
  res.json(data);
}
`;

fs.writeFileSync('server/src/modules/deployments/deployment.controller.js', code);
console.log('Appended to deployment.controller.js');
