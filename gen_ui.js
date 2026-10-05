const fs = require('fs');
const path = require('path');

function duplicateAndReplace(srcPath, destPath, replacements) {
  let content = fs.readFileSync(srcPath, 'utf8');
  for (const [from, to] of replacements) {
    // using regex with global flag to replace all occurrences
    content = content.replace(new RegExp(from, 'g'), to);
  }
  fs.writeFileSync(destPath, content);
  console.log('Created ' + destPath);
}

const dir = 'client/src/features/deployments/pages';

// 1. Ready to Invoice -> Ready for Sub Invoice
duplicateAndReplace(
  path.join(dir, 'ReadyToInvoicePage.jsx'),
  path.join(dir, 'ReadyForSubInvoicePage.jsx'),
  [
    ['ReadyToInvoicePage', 'ReadyForSubInvoicePage'],
    ['getReadyToInvoice', 'getReadyForSubInvoice'],
    ['/api/deployments/ready-to-invoice', '/api/deployments/ready-for-sub-invoice'],
    ['readyToInvoice', 'readyForSubInvoice'],
    ['sendInvoice', 'recordSubInvoice'],
    ['/api/deployments/\\$\\{deploymentId\\}/monthly-hours/\\$\\{entryId\\}/send-invoice', '/api/deployments/${deploymentId}/monthly-hours/${entryId}/sub-invoice'],
    ['staffDeployments.readyToInvoice', 'staffDeployments.readyForSubInvoice'],
    ['Send Invoice', 'Record Invoice'],
    ['invoiceDate', 'subcontractorInvoiceDate'],
    ['invoiceNumber', 'subcontractorInvoiceNumber'],
    ['clientInvoiceAmount', 'subContractorInvoiceAmount'], // the frontend uses the breakdown
    ['Client', 'Subcontractor'],
    ['client', 'subcontractor'],
  ]
);

// 2. Payments Due -> Subcontractor Payments Due
duplicateAndReplace(
  path.join(dir, 'PaymentsDuePage.jsx'),
  path.join(dir, 'SubcontractorPaymentsDuePage.jsx'),
  [
    ['PaymentsDuePage', 'SubcontractorPaymentsDuePage'],
    ['getPaymentsDue', 'getSubPaymentsDue'],
    ['/api/deployments/payments-due', '/api/deployments/sub-payments-due'],
    ['staffDeployments.paymentsDue', 'staffDeployments.subPaymentsDue'],
    ['Client', 'Subcontractor'],
    ['clientName', 'subcontractorName'],
    ['clientId', 'subcontractorId'],
    ['client', 'subcontractor'],
    ['getClientPaymentDetail', 'getSubcontractorPaymentDetail'],
    ['recordClientPayment', 'recordSubcontractorPayment']
  ]
);

// 3. Paid Invoices -> Paid Subcontractor Invoices
duplicateAndReplace(
  path.join(dir, 'PaidInvoicesPage.jsx'),
  path.join(dir, 'PaidSubcontractorInvoicesPage.jsx'),
  [
    ['PaidInvoicesPage', 'PaidSubcontractorInvoicesPage'],
    ['getPaidInvoices', 'getPaidSubInvoices'],
    ['/api/deployments/paid-invoices', '/api/deployments/paid-sub-invoices'],
    ['staffDeployments.paidInvoices', 'staffDeployments.paidSubInvoices'],
    ['Client', 'Subcontractor'],
    ['clientName', 'subcontractorName'],
    ['client', 'subcontractor'],
  ]
);
