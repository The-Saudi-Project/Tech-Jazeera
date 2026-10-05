const fs = require('fs');
let code = fs.readFileSync('client/src/features/deployments/deployments.api.js', 'utf8');

code += `
export async function getReadyForSubInvoice() {
  const res = await fetchJson('/api/deployments/ready-for-sub-invoice');
  return res.items || res;
}

export async function recordSubInvoice(deploymentId, entryId, data) {
  const formData = new FormData();
  if (data.invoiceNumber) formData.append('invoiceNumber', data.invoiceNumber);
  if (data.invoiceDate) formData.append('invoiceDate', data.invoiceDate);
  if (data.file) formData.append('file', data.file);
  return fetchJson('/api/deployments/' + deploymentId + '/monthly-hours/' + entryId + '/sub-invoice', {
    method: 'POST',
    body: formData,
  });
}

export async function getSubPaymentsDue() {
  const res = await fetchJson('/api/deployments/sub-payments-due');
  return res.items;
}

export async function getPaidSubInvoices() {
  const res = await fetchJson('/api/deployments/paid-sub-invoices');
  return res.items;
}

export async function getSubcontractorPaymentDetail(subcontractorId) {
  return fetchJson('/api/deployments/sub-payments-due/' + subcontractorId);
}

export async function recordSubcontractorPayment(subcontractorId, data) {
  return fetchJson('/api/deployments/sub-payments-due/' + subcontractorId + '/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function decideSubcontractorPayment(paymentId, data) {
  return fetchJson('/api/deployments/sub-payments/' + paymentId + '/decide', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
`;

fs.writeFileSync('client/src/features/deployments/deployments.api.js', code);
console.log('Appended to deployments.api.js');
