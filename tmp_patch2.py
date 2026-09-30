import re

# 1. Add getPendingHoursQueue to deployment.service.js
service_path = r'c:\Users\JARVIS\Desktop\Al Jazeera CRM\server\src\modules\deployments\deployment.service.js'
with open(service_path, 'r', encoding='utf-8') as f:
    svc = f.read()

# Find a good insertion point — after the currentMonthStr function
insert_after = 'async function decidersOfDeploymentsHours() {'
new_fn = '''
/**
 * All Pending monthly-hours entries across every deployment the caller can
 * see — the manager's approval queue. Gated by 'deploymentsHoursDecide'
 * write access (same as decideMonthlyHours); returns enriched rows ready
 * for the front-end review table (workerName, clientName, site, month, hours
 * summary, deployment id, entry id so the decider can Approve/Reject in one
 * click without opening the full detail page first).
 */
export async function getPendingHoursQueue(actor) {
  const allowed = await canAccessSection('deploymentsHoursDecide', actor);
  if (!allowed && actor.role !== 'Admin') {
    throw new ApiError(403, 'You do not have permission to view the hours approval queue.');
  }
  const deployments = await Deployment.find({
    'monthlyHours.status': 'Pending',
  })
    .select('workerName clientName site workerType monthlyHours mobilisation')
    .populate('mobilisation', 'otClientRate')
    .lean();

  const rows = [];
  for (const dep of deployments) {
    for (const entry of dep.monthlyHours) {
      if (entry.status !== 'Pending') continue;
      rows.push({
        deploymentId: dep._id,
        entryId: entry._id,
        workerName: dep.workerName,
        clientName: dep.clientName,
        site: dep.site,
        workerType: dep.workerType,
        month: entry.month,
        contractHours: entry.contractHours,
        actualHours: entry.actualHours,
        supplierHours: entry.supplierHours,
        otHours: entry.otHours,
        otAmount: entry.otAmount,
        deductionAmount: entry.deductionAmount,
        notes: entry.notes,
        enteredAt: entry.createdAt,
      });
    }
  }
  // Newest entry first
  rows.sort((a, b) => new Date(b.enteredAt) - new Date(a.enteredAt));
  return rows;
}

async function decidersOfDeploymentsHours() {'''

svc = svc.replace('async function decidersOfDeploymentsHours() {', new_fn)
with open(service_path, 'w', encoding='utf-8') as f:
    f.write(svc)

print('service done')

# 2. Add controller function
ctrl_path = r'c:\Users\JARVIS\Desktop\Al Jazeera CRM\server\src\modules\deployments\deployment.controller.js'
with open(ctrl_path, 'r', encoding='utf-8') as f:
    ctrl = f.read()

ctrl = ctrl.replace(
    "/** GET /api/deployments/ready-to-invoice — 200 → data: [{...}] */",
    """/** GET /api/deployments/pending-hours — 200 → data: [{...}] manager review queue */
export async function pendingHoursQueue(req, res) {
  const data = await deploymentService.getPendingHoursQueue(actor(req));
  res.json(new ApiResponse('Pending hours queue.', data));
}

/** GET /api/deployments/ready-to-invoice — 200 → data: [{...}] */"""
)
with open(ctrl_path, 'w', encoding='utf-8') as f:
    f.write(ctrl)

print('controller done')

# 3. Add route
routes_path = r'c:\Users\JARVIS\Desktop\Al Jazeera CRM\server\src\modules\deployments\deployment.routes.js'
with open(routes_path, 'r', encoding='utf-8') as f:
    routes = f.read()

routes = routes.replace(
    "// Same reasoning — visibility (deploymentsInvoicing/mobilisationsViewer read)\r\n// is computed in the service, not this route-level gate.\r\nrouter.get('/ready-to-invoice'",
    "// Pending hours approval queue — gated by canDecideHours (same key as decide endpoint).\r\nrouter.get('/pending-hours', canDecideHours, asyncHandler(deploymentController.pendingHoursQueue));\r\n// Same reasoning — visibility (deploymentsInvoicing/mobilisationsViewer read)\r\n// is computed in the service, not this route-level gate.\r\nrouter.get('/ready-to-invoice'"
)
with open(routes_path, 'w', encoding='utf-8') as f:
    f.write(routes)

print('routes done')
