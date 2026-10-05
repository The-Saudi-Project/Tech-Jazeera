const fs = require('fs');
let code = fs.readFileSync('server/src/modules/deployments/subcontractorInvoice.service.js', 'utf8');
code += `
export async function getReadyForSubInvoice(actor) {
  const allowed =
    (await canAccessSection('deploymentsInvoicing', actor, 'read')) ||
    (await canAccessSection('mobilisationsViewer', actor, 'read'));
  if (!allowed) return [];

  const deployments = await Deployment.find({
    archived: { $ne: true },
    workerType: 'SupplierEmployee',
    monthlyHours: { $elemMatch: { status: 'Approved', subcontractorInvoiceReceivedAt: null } },
  })
    .select('workerName clientName subcontractorName mobilisation monthlyHours workerType worker')
    .populate('mobilisation')
    .populate('worker', 'salary')
    .lean();

  const rows = [];
  for (const dep of deployments) {
    for (const entry of dep.monthlyHours) {
      if (entry.status !== 'Approved' || entry.subcontractorInvoiceReceivedAt) continue;
      
      const revExp = computeMonthlyRevenueAndExpenses(entry, dep.mobilisation, dep.monthlyHours, dep.worker);
      const invoiceAmount = revExp ? revExp.breakdown.subContractorInvoiceAmount + (revExp.breakdown.otCalculations ?? 0) : null;
      
      rows.push({
        deploymentId: dep._id,
        entryId: entry._id,
        mobilisationSerial: dep.mobilisation?.serialNumber,
        workerName: dep.workerName,
        workerType: dep.workerType,
        subcontractorName: dep.subcontractorName,
        clientName: dep.clientName,
        month: entry.month,
        actualHours: entry.actualHours,
        supplierHours: entry.supplierHours,
        otHours: entry.otHours,
        hoursApprovedAt: entry.decidedAt,
        invoiceAmount,
        breakdown: revExp ? revExp.breakdown : null,
      });
    }
  }

  return rows.sort((a, b) => new Date(a.hoursApprovedAt) - new Date(b.hoursApprovedAt));
}
`;
fs.writeFileSync('server/src/modules/deployments/subcontractorInvoice.service.js', code);
console.log('Appended getReadyForSubInvoice');
