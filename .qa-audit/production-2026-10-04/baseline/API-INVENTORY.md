# API inventory — source snapshot

Authorization is listed exactly as declared. Ownership must be traced in the linked handler/service; a role gate alone does not prove ownership. All /api routes inherit apiLimiter (600 requests per IP per 15 minutes). Authenticated routes also inherit userLimiter (1200 per user per 15 minutes).

| Method | Path | Router guards | Route handlers and validation | Source |
|---|---|---|---|---|
| GET | /api/approvals/roles | requireAuth | requireStaffOrExecutive; canReadApprovalHierarchy; asyncHandler(approvalsController.listRoles) | server/src/modules/approvals/approvals.routes.js:49 |
| POST | /api/approvals/roles | requireAuth | canManageApprovalHierarchy; validate({ body: createApprovalRoleSchema }); asyncHandler(approvalsController.createRole) | server/src/modules/approvals/approvals.routes.js:50 |
| PATCH | /api/approvals/roles/:id | requireAuth | canManageApprovalHierarchy; validate({ params: approvalRoleIdParamSchema, body: updateApprovalRoleSchema }); asyncHandler(approvalsController.updateRole) | server/src/modules/approvals/approvals.routes.js:56 |
| GET | /api/approvals/workflows | requireAuth | requireStaffOrExecutive; canReadApprovalHierarchy; asyncHandler(approvalsController.listWorkflows) | server/src/modules/approvals/approvals.routes.js:63 |
| POST | /api/approvals/workflows | requireAuth | canManageApprovalHierarchy; validate({ body: createApprovalWorkflowSchema }); asyncHandler(approvalsController.createWorkflow) | server/src/modules/approvals/approvals.routes.js:64 |
| PATCH | /api/approvals/workflows/:id | requireAuth | canManageApprovalHierarchy; validate({ params: approvalWorkflowIdParamSchema, body: updateApprovalWorkflowSchema }); asyncHandler(approvalsController.updateWorkflow) | server/src/modules/approvals/approvals.routes.js:70 |
| GET | /api/approvals/log | requireAuth | requireStaffOrExecutive; validate({ query: approvalLogQuerySchema }); asyncHandler(approvalsController.log) | server/src/modules/approvals/approvals.routes.js:79 |
| GET | /api/assets | requireAuth, requireStaff | canRead; validate({ query: listAssetsSchema }); asyncHandler(assetController.list) | server/src/modules/assets/asset.routes.js:39 |
| GET | /api/assets/by-employee/:employeeId | requireAuth, requireStaff | canRead; validate({ params: employeeIdParamSchema }); asyncHandler(assetController.listByEmployee) | server/src/modules/assets/asset.routes.js:41 |
| GET | /api/assets/:id | requireAuth, requireStaff | canRead; validate({ params: assetIdParamSchema }); asyncHandler(assetController.get) | server/src/modules/assets/asset.routes.js:47 |
| POST | /api/assets | requireAuth, requireStaff | canWrite; validate({ body: createAssetSchema }); asyncHandler(assetController.create) | server/src/modules/assets/asset.routes.js:48 |
| PATCH | /api/assets/:id | requireAuth, requireStaff | canWrite; validate({ params: assetIdParamSchema, body: updateAssetSchema }); asyncHandler(assetController.update) | server/src/modules/assets/asset.routes.js:49 |
| PATCH | /api/assets/:id/status | requireAuth, requireStaff | canWrite; validate({ params: assetIdParamSchema, body: setAssetStatusSchema }); asyncHandler(assetController.setStatus) | server/src/modules/assets/asset.routes.js:55 |
| POST | /api/assets/:id/assign | requireAuth, requireStaff | canWrite; validate({ params: assetIdParamSchema, body: assignAssetSchema }); asyncHandler(assetController.assign) | server/src/modules/assets/asset.routes.js:61 |
| POST | /api/assets/:id/return | requireAuth, requireStaff | canWrite; validate({ params: assetIdParamSchema, body: returnAssetSchema }); asyncHandler(assetController.returnAsset) | server/src/modules/assets/asset.routes.js:67 |
| DELETE | /api/assets/:id | requireAuth, requireStaff | canDelete; validate({ params: assetIdParamSchema }); asyncHandler(assetController.remove) | server/src/modules/assets/asset.routes.js:73 |
| POST | /api/attendance/bulk | requireAuth, requireStaff | canManageAttendance; validate({ body: markBulkSchema }); asyncHandler(attendanceController.markBulk) | server/src/modules/attendance/attendance.routes.js:34 |
| PATCH | /api/attendance/adjust | requireAuth, requireStaff | canManageAttendance; validate({ body: adjustAttendanceSchema }); asyncHandler(attendanceController.adjust) | server/src/modules/attendance/attendance.routes.js:40 |
| GET | /api/attendance | requireAuth, requireStaff | canReadAttendance; validate({ query: listAttendanceSchema }); asyncHandler(attendanceController.list) | server/src/modules/attendance/attendance.routes.js:46 |
| GET | /api/attendance/summary | requireAuth, requireStaff | canReadAttendance; validate({ query: summarySchema }); asyncHandler(attendanceController.summary) | server/src/modules/attendance/attendance.routes.js:47 |
| GET | /api/attendance/export | requireAuth, requireStaff | canReadAttendance; validate({ query: exportSchema }); asyncHandler(attendanceController.exportSummary) | server/src/modules/attendance/attendance.routes.js:53 |
| GET | /api/attendance/office-location | requireAuth, requireStaff | canReadOfficeLocation; asyncHandler(attendanceController.getOfficeLocation) | server/src/modules/attendance/attendance.routes.js:65 |
| PATCH | /api/attendance/office-location | requireAuth, requireStaff | canManageOfficeLocation; validate({ body: officeLocationSchema }); asyncHandler(attendanceController.updateOfficeLocation) | server/src/modules/attendance/attendance.routes.js:66 |
| GET | /api/audit |  | requireAuth; requireSectionAccess('auditLog', 'read'); validate({ query: listAuditSchema }); asyncHandler(auditController.list) | server/src/modules/audit/audit.routes.js:15 |
| POST | /api/auth/login | requireTrustedOrigin | loginLimiter; validate({ body: loginSchema }); asyncHandler(authController.login) | server/src/modules/auth/auth.routes.js:25 |
| POST | /api/auth/refresh | requireTrustedOrigin | asyncHandler(authController.refresh) | server/src/modules/auth/auth.routes.js:26 |
| POST | /api/auth/logout | requireTrustedOrigin | asyncHandler(authController.logout) | server/src/modules/auth/auth.routes.js:27 |
| PATCH | /api/auth/password | requireTrustedOrigin | requireAuth; validate({ body: changePasswordSchema }); asyncHandler(authController.changePassword) | server/src/modules/auth/auth.routes.js:32 |
| PATCH | /api/auth/avatar | requireTrustedOrigin | requireAuth; uploadAvatarImage; asyncHandler(authController.uploadAvatar) | server/src/modules/auth/auth.routes.js:40 |
| DELETE | /api/auth/avatar | requireTrustedOrigin | requireAuth; asyncHandler(authController.removeAvatar) | server/src/modules/auth/auth.routes.js:41 |
| GET | /api/clients | requireAuth, requireStaff | canReadClients; validate({ query: listClientsSchema }); asyncHandler(clientController.list) | server/src/modules/clients/client.routes.js:41 |
| GET | /api/clients/:id | requireAuth, requireStaff | canReadClients; validate({ params: clientIdParamSchema }); asyncHandler(clientController.get) | server/src/modules/clients/client.routes.js:42 |
| POST | /api/clients | requireAuth, requireStaff | canManageClients; validate({ body: createClientSchema }); asyncHandler(clientController.create) | server/src/modules/clients/client.routes.js:43 |
| PATCH | /api/clients/:id | requireAuth, requireStaff | canManageClients; validate({ params: clientIdParamSchema, body: updateClientSchema }); asyncHandler(clientController.update) | server/src/modules/clients/client.routes.js:49 |
| PATCH | /api/clients/:id/decide | requireAuth, requireStaff | canManageClients; validate({ params: clientIdParamSchema, body: decideClientSchema }); asyncHandler(clientController.decide) | server/src/modules/clients/client.routes.js:55 |
| DELETE | /api/clients/:id | requireAuth, requireStaff | requireRoles('Admin', 'Manager'); validate({ params: clientIdParamSchema }); asyncHandler(clientController.remove) | server/src/modules/clients/client.routes.js:61 |
| GET | /api/company-settings/branding |  | asyncHandler(companySettingsController.getBranding) | server/src/modules/companySettings/companySettings.routes.js:35 |
| GET | /api/company-settings | requireAuth, requireStaff | asyncHandler(companySettingsController.get) | server/src/modules/companySettings/companySettings.routes.js:39 |
| PATCH | /api/company-settings | requireAuth, requireStaff | validate({ body: updateCompanySettingsSchema }); asyncHandler(companySettingsController.update) | server/src/modules/companySettings/companySettings.routes.js:40 |
| POST | /api/company-settings/logo | requireAuth, requireStaff | uploadLogoImage; asyncHandler(companySettingsController.uploadLogo) | server/src/modules/companySettings/companySettings.routes.js:41 |
| DELETE | /api/company-settings/logo | requireAuth, requireStaff | asyncHandler(companySettingsController.removeLogo) | server/src/modules/companySettings/companySettings.routes.js:42 |
| GET | /api/daily-updates/coordinators | requireAuth, requireStaff | asyncHandler(dailyUpdateController.coordinators) | server/src/modules/dailyUpdates/dailyUpdate.routes.js:34 |
| GET | /api/daily-updates | requireAuth, requireStaff | validate({ query: listDailyUpdatesSchema }); asyncHandler(dailyUpdateController.list) | server/src/modules/dailyUpdates/dailyUpdate.routes.js:35 |
| POST | /api/daily-updates | requireAuth, requireStaff | validate({ body: createDailyUpdateSchema }); asyncHandler(dailyUpdateController.create) | server/src/modules/dailyUpdates/dailyUpdate.routes.js:36 |
| PATCH | /api/daily-updates/:id | requireAuth, requireStaff | validate({ params: dailyUpdateIdParamSchema, body: updateDailyUpdateSchema }); asyncHandler(dailyUpdateController.update) | server/src/modules/dailyUpdates/dailyUpdate.routes.js:37 |
| PATCH | /api/daily-updates/:id/status | requireAuth, requireStaff | validate({ params: dailyUpdateIdParamSchema, body: setStatusSchema }); asyncHandler(dailyUpdateController.setStatus) | server/src/modules/dailyUpdates/dailyUpdate.routes.js:42 |
| DELETE | /api/daily-updates/:id | requireAuth, requireStaff | validate({ params: dailyUpdateIdParamSchema }); asyncHandler(dailyUpdateController.remove) | server/src/modules/dailyUpdates/dailyUpdate.routes.js:47 |
| GET | /api/dashboard |  | requireAuth; requireStaffOrExecutive; validate({ query: dashboardQuerySchema }); asyncHandler(dashboardController.overview) | server/src/modules/dashboard/dashboard.routes.js:21 |
| GET | /api/dashboard/standby-analysis |  | requireAuth; requireStaffOrExecutive; asyncHandler(dashboardController.standbyAnalysis) | server/src/modules/dashboard/dashboard.routes.js:29 |
| GET | /api/dashboard/coordinator-leaderboard |  | requireAuth; requireStaffOrExecutive; validate({ query: monthQuerySchema }); asyncHandler(dashboardController.coordinatorLeaderboard) | server/src/modules/dashboard/dashboard.routes.js:38 |
| GET | /api/dashboard/coordinator-drill-down/:id |  | requireAuth; requireStaffOrExecutive; validate({ params: coordinatorIdParamSchema, query: monthQuerySchema }); asyncHandler(dashboardController.coordinatorDrillDown) | server/src/modules/dashboard/dashboard.routes.js:46 |
| GET | /api/deployments | requireAuth, requireStaff | canReadDeployments; validate({ query: listDeploymentsSchema }); asyncHandler(deploymentController.list) | server/src/modules/deployments/deployment.routes.js:89 |
| GET | /api/deployments/standby | requireAuth, requireStaff | canReadDeployments; asyncHandler(deploymentController.standby) | server/src/modules/deployments/deployment.routes.js:91 |
| GET | /api/deployments/payments-due | requireAuth, requireStaff | asyncHandler(deploymentController.paymentsDue) | server/src/modules/deployments/deployment.routes.js:95 |
| GET | /api/deployments/paid-invoices | requireAuth, requireStaff | asyncHandler(deploymentController.paidInvoices) | server/src/modules/deployments/deployment.routes.js:96 |
| GET | /api/deployments/payments-due/:clientId | requireAuth, requireStaff | validate({ params: clientIdParamSchema }); asyncHandler(deploymentController.clientPaymentDetail) | server/src/modules/deployments/deployment.routes.js:98 |
| POST | /api/deployments/payments-due/:clientId/payments | requireAuth, requireStaff | validate({ params: clientIdParamSchema, body: recordClientPaymentSchema }); asyncHandler(deploymentController.recordClientPayment) | server/src/modules/deployments/deployment.routes.js:106 |
| GET | /api/deployments/pending-payments | requireAuth, requireStaff | canDecidePayment; asyncHandler(deploymentController.pendingPaymentsQueue) | server/src/modules/deployments/deployment.routes.js:111 |
| PATCH | /api/deployments/client-payments/:paymentId/decide | requireAuth, requireStaff | canDecidePayment; validate({ params: clientPaymentIdParamSchema, body: decideClientPaymentSchema }); asyncHandler(deploymentController.decideClientPayment) | server/src/modules/deployments/deployment.routes.js:112 |
| GET | /api/deployments/ready-to-invoice | requireAuth, requireStaff | asyncHandler(deploymentController.readyToInvoice) | server/src/modules/deployments/deployment.routes.js:120 |
| GET | /api/deployments/pending-hours | requireAuth, requireStaff | asyncHandler(deploymentController.pendingHoursQueue) | server/src/modules/deployments/deployment.routes.js:121 |
| GET | /api/deployments/export | requireAuth, requireStaff | canReadDeployments; validate({ query: exportDeploymentsSchema }); asyncHandler(deploymentController.exportAll) | server/src/modules/deployments/deployment.routes.js:122 |
| GET | /api/deployments/:id | requireAuth, requireStaff | canReadDeployments; validate({ params: deploymentIdParamSchema }); asyncHandler(deploymentController.get) | server/src/modules/deployments/deployment.routes.js:128 |
| PATCH | /api/deployments/:id | requireAuth, requireStaff | requireSectionAccess('deploymentsEdit', 'write'); validate({ params: deploymentIdParamSchema, body: updateDeploymentSchema }); asyncHandler(deploymentController.update) | server/src/modules/deployments/deployment.routes.js:134 |
| POST | /api/deployments/:id/monthly-hours | requireAuth, requireStaff | validate({ params: deploymentIdParamSchema, body: addMonthlyHoursSchema }); asyncHandler(deploymentController.addMonthlyHours) | server/src/modules/deployments/deployment.routes.js:140 |
| PATCH | /api/deployments/:id/monthly-hours/:entryId | requireAuth, requireStaff | validate({ params: monthlyHoursEntryParamSchema, body: updateMonthlyHoursSchema }); asyncHandler(deploymentController.updateMonthlyHours) | server/src/modules/deployments/deployment.routes.js:145 |
| PATCH | /api/deployments/:id/monthly-hours/:entryId/decide | requireAuth, requireStaff | canDecideHours; validate({ params: monthlyHoursEntryParamSchema, body: decideMonthlyHoursSchema }); asyncHandler(deploymentController.decideMonthlyHours) | server/src/modules/deployments/deployment.routes.js:150 |
| POST | /api/deployments/:id/monthly-hours/:entryId/send-invoice | requireAuth, requireStaff | canInvoice; uploadSingle; validate({ params: monthlyHoursEntryParamSchema, body: sendInvoiceSchema }); asyncHandler(deploymentController.sendInvoice) | server/src/modules/deployments/deployment.routes.js:156 |
| GET | /api/deployments/:id/monthly-hours/:entryId/invoice-file | requireAuth, requireStaff | canReadDeployments; validate({ params: monthlyHoursEntryParamSchema }); asyncHandler(deploymentController.invoiceFile) | server/src/modules/deployments/deployment.routes.js:163 |
| POST | /api/deployments/:id/demobilise | requireAuth, requireStaff | canRelease; validate({ params: deploymentIdParamSchema, body: demobiliseDeploymentSchema }); asyncHandler(deploymentController.demobilise) | server/src/modules/deployments/deployment.routes.js:173 |
| GET | /api/documents | requireAuth, requireStaff | canRead; validate({ query: listDocumentsSchema }); asyncHandler(documentController.list) | server/src/modules/documents/document.routes.js:41 |
| GET | /api/documents/:id | requireAuth, requireStaff | canRead; validate({ params: documentIdParamSchema }); asyncHandler(documentController.get) | server/src/modules/documents/document.routes.js:42 |
| GET | /api/documents/:id/file | requireAuth, requireStaff | canRead; validate({ params: documentIdParamSchema, query: fileQuerySchema }); asyncHandler(documentController.file) | server/src/modules/documents/document.routes.js:48 |
| POST | /api/documents | requireAuth, requireStaff | canWrite; uploadSingle; validate({ body: createDocumentSchema }); asyncHandler(documentController.create) | server/src/modules/documents/document.routes.js:54 |
| POST | /api/documents/:id/versions | requireAuth, requireStaff | canWrite; validate({ params: documentIdParamSchema }); uploadSingle; asyncHandler(documentController.addVersion) | server/src/modules/documents/document.routes.js:61 |
| DELETE | /api/documents/:id | requireAuth, requireStaff | canDelete; validate({ params: documentIdParamSchema }); asyncHandler(documentController.remove) | server/src/modules/documents/document.routes.js:68 |
| GET | /api/employees | requireAuth, requireStaff | canReadEmployees; validate({ query: listEmployeesSchema }); asyncHandler(employeeController.list) | server/src/modules/employees/employee.routes.js:50 |
| GET | /api/employees/:id | requireAuth, requireStaff | canReadEmployees; validate({ params: employeeIdParamSchema }); asyncHandler(employeeController.get) | server/src/modules/employees/employee.routes.js:51 |
| POST | /api/employees | requireAuth, requireStaff | requireSectionAccess('employeeCreate', 'write'); validate({ body: createEmployeeSchema }); asyncHandler(employeeController.create) | server/src/modules/employees/employee.routes.js:57 |
| PATCH | /api/employees/:id | requireAuth, requireStaff | requireRoles('Admin', 'Manager', 'HR'); validate({ params: employeeIdParamSchema, body: updateEmployeeSchema }); asyncHandler(employeeController.update) | server/src/modules/employees/employee.routes.js:63 |
| DELETE | /api/employees/:id | requireAuth, requireStaff | requireRoles('Admin', 'HR'); validate({ params: employeeIdParamSchema }); asyncHandler(employeeController.remove) | server/src/modules/employees/employee.routes.js:69 |
| POST | /api/employees/:id/user | requireAuth, requireStaff | requireRoles('Admin', 'HR'); validate({ params: employeeIdParamSchema, body: createLoginSchema }); asyncHandler(employeeController.createLogin) | server/src/modules/employees/employee.routes.js:80 |
| POST | /api/employees/:id/user/reset-password | requireAuth, requireStaff | requireRoles('Admin', 'HR'); validate({ params: employeeIdParamSchema }); asyncHandler(employeeController.resetLoginPassword) | server/src/modules/employees/employee.routes.js:89 |
| PATCH | /api/employees/:id/user/role | requireAuth, requireStaff | requireRoles('Admin', 'HR'); validate({ params: employeeIdParamSchema, body: updateLoginRoleSchema }); asyncHandler(employeeController.updateLoginRole) | server/src/modules/employees/employee.routes.js:100 |
| GET | /api/outsourced-employees | requireAuth | asyncHandler(controller.list) | server/src/modules/employees/outsourcedEmployee.routes.js:29 |
| POST | /api/outsourced-employees | requireAuth | canWrite; validate({ body: createOutsourcedEmployeeSchema }); asyncHandler(controller.create) | server/src/modules/employees/outsourcedEmployee.routes.js:30 |
| GET | /api/outsourced-employees/:id | requireAuth | validate({ params: outsourcedEmployeeIdParamSchema }); asyncHandler(controller.get) | server/src/modules/employees/outsourcedEmployee.routes.js:31 |
| PATCH | /api/outsourced-employees/:id | requireAuth | canWrite; validate({ params: outsourcedEmployeeIdParamSchema, body: updateOutsourcedEmployeeSchema }); asyncHandler(controller.update) | server/src/modules/employees/outsourcedEmployee.routes.js:32 |
| DELETE | /api/outsourced-employees/:id | requireAuth | canWrite; validate({ params: outsourcedEmployeeIdParamSchema }); asyncHandler(controller.remove) | server/src/modules/employees/outsourcedEmployee.routes.js:38 |
| POST | /api/outsourced-employees/:id/documents | requireAuth | canWrite; validate({ params: outsourcedEmployeeIdParamSchema }); uploadSingle; validate({ body: outsourcedEmployeeDocumentBodySchema }); asyncHandler(controller.addDocument) | server/src/modules/employees/outsourcedEmployee.routes.js:47 |
| DELETE | /api/outsourced-employees/:id/documents/:fileId | requireAuth | canWrite; validate({ params: outsourcedEmployeeDocumentParamSchema }); asyncHandler(controller.removeDocument) | server/src/modules/employees/outsourcedEmployee.routes.js:55 |
| GET | /api/outsourced-employees/:id/documents/:fileId/file | requireAuth | validate({ params: outsourcedEmployeeDocumentParamSchema }); asyncHandler(controller.documentFile) | server/src/modules/employees/outsourcedEmployee.routes.js:61 |
| GET | /api/eosb | requireAuth | canRead; validate({ query: listSettlementsSchema }); asyncHandler(settlementController.list) | server/src/modules/eosb/settlement.routes.js:28 |
| GET | /api/eosb/:id | requireAuth | canRead; validate({ params: settlementIdParamSchema }); asyncHandler(settlementController.get) | server/src/modules/eosb/settlement.routes.js:29 |
| GET | /api/eosb/:id/pdf | requireAuth | canRead; validate({ params: settlementIdParamSchema }); asyncHandler(settlementController.pdf) | server/src/modules/eosb/settlement.routes.js:30 |
| POST | /api/eosb | requireAuth | canWrite; validate({ body: createSettlementSchema }); asyncHandler(settlementController.create) | server/src/modules/eosb/settlement.routes.js:31 |
| DELETE | /api/eosb/:id | requireAuth | canWrite; validate({ params: settlementIdParamSchema }); asyncHandler(settlementController.remove) | server/src/modules/eosb/settlement.routes.js:32 |
| GET | /api/exit-documents/exit-reentry | requireAuth | canRead; validate({ query: listExitReentrySchema }); asyncHandler(exitReentryController.list) | server/src/modules/exitDocuments/exitDocuments.routes.js:51 |
| POST | /api/exit-documents/exit-reentry | requireAuth | canWrite; validate({ body: submitExitReentrySchema }); asyncHandler(exitReentryController.submit) | server/src/modules/exitDocuments/exitDocuments.routes.js:52 |
| PATCH | /api/exit-documents/exit-reentry/:id/decide | requireAuth | canWrite; validate({ params: exitReentryIdParamSchema, body: decideExitReentrySchema }); asyncHandler(exitReentryController.decide) | server/src/modules/exitDocuments/exitDocuments.routes.js:58 |
| PATCH | /api/exit-documents/exit-reentry/:id/issue | requireAuth | requireRoles('Admin', 'Manager', 'HR'); validate({ params: exitReentryIdParamSchema, body: markExitReentryIssuedSchema }); asyncHandler(exitReentryController.markIssued) | server/src/modules/exitDocuments/exitDocuments.routes.js:64 |
| GET | /api/exit-documents/certificates | requireAuth | canRead; validate({ query: listCertificatesSchema }); asyncHandler(certificateController.list) | server/src/modules/exitDocuments/exitDocuments.routes.js:71 |
| POST | /api/exit-documents/certificates | requireAuth | canWrite; validate({ body: submitCertificateSchema }); asyncHandler(certificateController.submit) | server/src/modules/exitDocuments/exitDocuments.routes.js:72 |
| GET | /api/exit-documents/certificates/:id/pdf | requireAuth | canRead; validate({ params: certificateIdParamSchema }); asyncHandler(certificateController.pdf) | server/src/modules/exitDocuments/exitDocuments.routes.js:78 |
| PATCH | /api/exit-documents/certificates/:id/decide | requireAuth | canWrite; validate({ params: certificateIdParamSchema, body: decideCertificateSchema }); asyncHandler(certificateController.decide) | server/src/modules/exitDocuments/exitDocuments.routes.js:84 |
| PATCH | /api/exit-documents/certificates/:id/issue | requireAuth | requireRoles('Admin', 'Manager', 'HR'); validate({ params: certificateIdParamSchema }); asyncHandler(certificateController.markIssued) | server/src/modules/exitDocuments/exitDocuments.routes.js:90 |
| GET | /api/expenses | requireAuth | canRead; validate({ query: listExpensesSchema }); asyncHandler(expenseController.list) | server/src/modules/expenses/expense.routes.js:32 |
| GET | /api/expenses/summary | requireAuth | canRead; validate({ query: summaryQuerySchema }); asyncHandler(expenseController.summary) | server/src/modules/expenses/expense.routes.js:33 |
| GET | /api/expenses/:id | requireAuth | canRead; validate({ params: expenseIdParamSchema }); asyncHandler(expenseController.get) | server/src/modules/expenses/expense.routes.js:34 |
| GET | /api/expenses/:id/receipt | requireAuth | canRead; validate({ params: expenseIdParamSchema }); asyncHandler(expenseController.receipt) | server/src/modules/expenses/expense.routes.js:35 |
| POST | /api/expenses | requireAuth | canWrite; uploadSingle; validate({ body: createExpenseSchema }); asyncHandler(expenseController.create) | server/src/modules/expenses/expense.routes.js:36 |
| PATCH | /api/expenses/:id | requireAuth | canWrite; validate({ params: expenseIdParamSchema, body: updateExpenseSchema }); asyncHandler(expenseController.update) | server/src/modules/expenses/expense.routes.js:37 |
| DELETE | /api/expenses/:id | requireAuth | canWrite; validate({ params: expenseIdParamSchema }); asyncHandler(expenseController.remove) | server/src/modules/expenses/expense.routes.js:43 |
| GET | /api/financial-requests/advances | requireAuth | requireStaffOrExecutive; validate({ query: listAdvancesSchema }); asyncHandler(advanceController.list) | server/src/modules/financialRequests/financialRequests.routes.js:67 |
| POST | /api/financial-requests/advances | requireAuth | requireStaffOrExecutive; validate({ body: submitAdvanceSchema }); asyncHandler(advanceController.submit) | server/src/modules/financialRequests/financialRequests.routes.js:73 |
| PATCH | /api/financial-requests/advances/:id/decide | requireAuth | canDecideFinancialRequests; validate({ params: advanceIdParamSchema, body: decideAdvanceSchema }); asyncHandler(advanceController.decide) | server/src/modules/financialRequests/financialRequests.routes.js:79 |
| POST | /api/financial-requests/advances/:id/repayments | requireAuth | canHandleMoney; validate({ params: advanceIdParamSchema, body: addRepaymentSchema }); asyncHandler(advanceController.addRepayment) | server/src/modules/financialRequests/financialRequests.routes.js:85 |
| GET | /api/financial-requests/reimbursements | requireAuth | requireStaffOrExecutive; validate({ query: listReimbursementsSchema }); asyncHandler(reimbursementController.list) | server/src/modules/financialRequests/financialRequests.routes.js:92 |
| POST | /api/financial-requests/reimbursements | requireAuth | requireStaffOrExecutive; uploadSingle; validate({ body: submitReimbursementSchema }); asyncHandler(reimbursementController.submit) | server/src/modules/financialRequests/financialRequests.routes.js:98 |
| GET | /api/financial-requests/reimbursements/:id/receipt | requireAuth | canHandleMoney; validate({ params: reimbursementIdParamSchema }); asyncHandler(reimbursementController.receipt) | server/src/modules/financialRequests/financialRequests.routes.js:110 |
| PATCH | /api/financial-requests/reimbursements/:id/decide | requireAuth | canDecideFinancialRequests; validate({ params: reimbursementIdParamSchema, body: decideReimbursementSchema }); asyncHandler(reimbursementController.decide) | server/src/modules/financialRequests/financialRequests.routes.js:116 |
| PATCH | /api/financial-requests/reimbursements/:id/pay | requireAuth | canHandleMoney; validate({ params: reimbursementIdParamSchema }); asyncHandler(reimbursementController.markPaid) | server/src/modules/financialRequests/financialRequests.routes.js:122 |
| GET | /api/holidays | requireAuth | validate({ query: listHolidaysSchema }); asyncHandler(holidayController.list) | server/src/modules/holidays/holiday.routes.js:28 |
| POST | /api/holidays | requireAuth | canManageHolidays; validate({ body: createHolidaySchema }); asyncHandler(holidayController.create) | server/src/modules/holidays/holiday.routes.js:29 |
| PATCH | /api/holidays/:id | requireAuth | canManageHolidays; validate({ params: holidayIdParamSchema, body: updateHolidaySchema }); asyncHandler(holidayController.update) | server/src/modules/holidays/holiday.routes.js:30 |
| DELETE | /api/holidays/:id | requireAuth | canManageHolidays; validate({ params: holidayIdParamSchema }); asyncHandler(holidayController.remove) | server/src/modules/holidays/holiday.routes.js:36 |
| GET | /api/job-titles | requireAuth, requireStaff | validate({ query: listJobTitlesSchema }); asyncHandler(jobTitleController.list) | server/src/modules/jobTitles/jobTitle.routes.js:25 |
| POST | /api/job-titles | requireAuth, requireStaff | validate({ body: createJobTitleSchema }); asyncHandler(jobTitleController.create) | server/src/modules/jobTitles/jobTitle.routes.js:26 |
| PATCH | /api/job-titles/:id | requireAuth, requireStaff | validate({ params: jobTitleIdParamSchema, body: updateJobTitleSchema }); asyncHandler(jobTitleController.update) | server/src/modules/jobTitles/jobTitle.routes.js:27 |
| DELETE | /api/job-titles/:id | requireAuth, requireStaff | validate({ params: jobTitleIdParamSchema }); asyncHandler(jobTitleController.remove) | server/src/modules/jobTitles/jobTitle.routes.js:32 |
| GET | /api/leave | requireAuth | canReadLeaveRequests; validate({ query: listLeaveRequestsSchema }); asyncHandler(leaveController.list) | server/src/modules/leave/leaveRequest.routes.js:37 |
| POST | /api/leave | requireAuth | canWriteLeaveRequests; uploadSingle; validate({ body: submitLeaveRequestSchema }); asyncHandler(leaveController.submit) | server/src/modules/leave/leaveRequest.routes.js:41 |
| GET | /api/leave/:id/attachment | requireAuth | canReadLeaveRequests; validate({ params: leaveRequestIdParamSchema }); asyncHandler(leaveController.attachment) | server/src/modules/leave/leaveRequest.routes.js:42 |
| PATCH | /api/leave/:id/decide | requireAuth | canWriteLeaveRequests; validate({ params: leaveRequestIdParamSchema, body: decideLeaveRequestSchema }); asyncHandler(leaveController.decide) | server/src/modules/leave/leaveRequest.routes.js:56 |
| PATCH | /api/leave/:id/acknowledge | requireAuth | requireRoles('Admin', 'Manager', 'HR', 'Coordinator'); validate({ params: leaveRequestIdParamSchema }); asyncHandler(leaveController.acknowledge) | server/src/modules/leave/leaveRequest.routes.js:62 |
| GET | /api/leave-types | requireAuth | validate({ query: listLeaveTypesSchema }); asyncHandler(leaveController.listTypes) | server/src/modules/leave/leaveType.routes.js:30 |
| POST | /api/leave-types | requireAuth | requireRoles('Admin', 'HR'); validate({ body: createLeaveTypeSchema }); asyncHandler(leaveController.createType) | server/src/modules/leave/leaveType.routes.js:31 |
| PATCH | /api/leave-types/:id | requireAuth | requireRoles('Admin', 'HR'); validate({ params: leaveTypeIdParamSchema, body: updateLeaveTypeSchema }); asyncHandler(leaveController.updateType) | server/src/modules/leave/leaveType.routes.js:32 |
| GET | /api/locations | requireAuth, requireStaff | asyncHandler(locationController.list) | server/src/modules/locations/location.routes.js:23 |
| POST | /api/locations | requireAuth, requireStaff | validate({ body: createLocationSchema }); asyncHandler(locationController.create) | server/src/modules/locations/location.routes.js:24 |
| DELETE | /api/locations/:id | requireAuth, requireStaff | requireRoles('Admin'); validate({ params: locationIdParamSchema }); asyncHandler(locationController.remove) | server/src/modules/locations/location.routes.js:25 |
| GET | /api/me | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | asyncHandler(meController.getProfile) | server/src/modules/me/me.routes.js:64 |
| PATCH | /api/me | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ body: updateMyProfileSchema }); asyncHandler(meController.updateProfile) | server/src/modules/me/me.routes.js:65 |
| GET | /api/me/documents | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | asyncHandler(meController.listDocuments) | server/src/modules/me/me.routes.js:66 |
| GET | /api/me/documents/:id/file | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ params: documentIdParamSchema, query: fileQuerySchema }); asyncHandler(meController.documentFile) | server/src/modules/me/me.routes.js:67 |
| GET | /api/me/leave | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ query: listMyLeaveRequestsSchema }); asyncHandler(meController.listLeave) | server/src/modules/me/me.routes.js:72 |
| POST | /api/me/leave | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | uploadSingle; validate({ body: submitLeaveRequestSchema }); asyncHandler(meController.submitLeave) | server/src/modules/me/me.routes.js:73 |
| GET | /api/me/leave/:id/attachment | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ params: leaveRequestIdParamSchema }); asyncHandler(meController.leaveAttachment) | server/src/modules/me/me.routes.js:79 |
| PATCH | /api/me/leave/:id/cancel | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ params: leaveRequestIdParamSchema }); asyncHandler(meController.cancelLeave) | server/src/modules/me/me.routes.js:84 |
| POST | /api/me/attendance/punch | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ body: selfMarkSchema }); asyncHandler(meController.punch) | server/src/modules/me/me.routes.js:90 |
| GET | /api/me/attendance | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ query: listMyAttendanceSchema }); asyncHandler(meController.listAttendance) | server/src/modules/me/me.routes.js:95 |
| GET | /api/me/advances | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ query: listMyAdvancesSchema }); asyncHandler(meController.listAdvances) | server/src/modules/me/me.routes.js:101 |
| POST | /api/me/advances | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ body: submitAdvanceSchema }); asyncHandler(meController.submitAdvance) | server/src/modules/me/me.routes.js:102 |
| PATCH | /api/me/advances/:id/cancel | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ params: advanceIdParamSchema }); asyncHandler(meController.cancelAdvance) | server/src/modules/me/me.routes.js:103 |
| GET | /api/me/reimbursements | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ query: listMyReimbursementsSchema }); asyncHandler(meController.listReimbursements) | server/src/modules/me/me.routes.js:109 |
| POST | /api/me/reimbursements | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | uploadSingle; validate({ body: submitReimbursementSchema }); asyncHandler(meController.submitReimbursement) | server/src/modules/me/me.routes.js:114 |
| GET | /api/me/reimbursements/:id/receipt | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ params: reimbursementIdParamSchema }); asyncHandler(meController.reimbursementReceipt) | server/src/modules/me/me.routes.js:120 |
| PATCH | /api/me/reimbursements/:id/cancel | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ params: reimbursementIdParamSchema }); asyncHandler(meController.cancelReimbursement) | server/src/modules/me/me.routes.js:125 |
| GET | /api/me/exit-reentry | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ query: listMyExitReentrySchema }); asyncHandler(meController.listExitReentry) | server/src/modules/me/me.routes.js:131 |
| POST | /api/me/exit-reentry | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ body: submitExitReentrySchema }); asyncHandler(meController.submitExitReentry) | server/src/modules/me/me.routes.js:136 |
| PATCH | /api/me/exit-reentry/:id/cancel | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ params: exitReentryIdParamSchema }); asyncHandler(meController.cancelExitReentry) | server/src/modules/me/me.routes.js:141 |
| GET | /api/me/certificates | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ query: listMyCertificatesSchema }); asyncHandler(meController.listCertificates) | server/src/modules/me/me.routes.js:147 |
| POST | /api/me/certificates | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ body: submitCertificateSchema }); asyncHandler(meController.submitCertificate) | server/src/modules/me/me.routes.js:152 |
| GET | /api/me/certificates/:id/pdf | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ params: certificateIdParamSchema }); asyncHandler(meController.certificatePdf) | server/src/modules/me/me.routes.js:157 |
| PATCH | /api/me/certificates/:id/cancel | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ params: certificateIdParamSchema }); asyncHandler(meController.cancelCertificate) | server/src/modules/me/me.routes.js:162 |
| GET | /api/me/assets | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | asyncHandler(meController.listAssets) | server/src/modules/me/me.routes.js:168 |
| GET | /api/me/timesheets | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ query: listMyTimesheetsSchema }); asyncHandler(meController.listTimesheets) | server/src/modules/me/me.routes.js:170 |
| POST | /api/me/timesheets | requireAuth, requireRoles('Worker', 'Staff'), asyncHandler(async (req, res, next) => {
    if (!req.user.employee) return next();
    const employee = await Employee.findById(req.user.employee).select('type').lean();
    if (employee && employee.type !== 'Own') {
      throw new ApiError(403, 'This portal is only available to internal staff.');
    }
    next();
  }) | validate({ body: submitTimesheetSchema }); asyncHandler(meController.submitTimesheet) | server/src/modules/me/me.routes.js:175 |
| GET | /api/profile | requireAuth, requireRoles('Manager', 'HR', 'Accounts', 'Coordinator', 'Executive', 'Office Secretary') | asyncHandler(meController.getProfile) | server/src/modules/me/profile.routes.js:29 |
| PATCH | /api/profile | requireAuth, requireRoles('Manager', 'HR', 'Accounts', 'Coordinator', 'Executive', 'Office Secretary') | validate({ body: updateMyProfileSchema }); asyncHandler(meController.updateProfile) | server/src/modules/me/profile.routes.js:30 |
| GET | /api/mobilisations | requireAuth, requireStaff | validate({ query: listMobilisationsSchema }); asyncHandler(mobilisationController.list) | server/src/modules/mobilisations/mobilisation.routes.js:43 |
| GET | /api/mobilisations/coordinators | requireAuth, requireStaff | asyncHandler(mobilisationController.listCoordinatorCandidates) | server/src/modules/mobilisations/mobilisation.routes.js:45 |
| GET | /api/mobilisations/lookup-by-iqama | requireAuth, requireStaff | validate({ query: mobilisationIqamaLookupQuerySchema }); asyncHandler(mobilisationController.lookupByIqama) | server/src/modules/mobilisations/mobilisation.routes.js:46 |
| GET | /api/mobilisations/previous-workers | requireAuth, requireStaff | validate({ query: mobilisationPreviousWorkersQuerySchema }); asyncHandler(mobilisationController.previousWorkers) | server/src/modules/mobilisations/mobilisation.routes.js:51 |
| GET | /api/mobilisations/worker-history | requireAuth, requireStaff | requireRoles('Admin'); validate({ query: workerHistoryQuerySchema }); asyncHandler(mobilisationController.getWorkerHistory) | server/src/modules/mobilisations/mobilisation.routes.js:60 |
| POST | /api/mobilisations/worker-history/archive | requireAuth, requireStaff | requireRoles('Admin'); validate({ body: workerIqamaBodySchema }); asyncHandler(mobilisationController.archiveWorker) | server/src/modules/mobilisations/mobilisation.routes.js:66 |
| POST | /api/mobilisations/worker-history/unarchive | requireAuth, requireStaff | requireRoles('Admin'); validate({ body: workerIqamaBodySchema }); asyncHandler(mobilisationController.unarchiveWorker) | server/src/modules/mobilisations/mobilisation.routes.js:72 |
| GET | /api/mobilisations/export | requireAuth, requireStaff | validate({ query: exportMobilisationsSchema }); asyncHandler(mobilisationController.exportAll) | server/src/modules/mobilisations/mobilisation.routes.js:78 |
| GET | /api/mobilisations/:id | requireAuth, requireStaff | validate({ params: mobilisationIdParamSchema }); asyncHandler(mobilisationController.get) | server/src/modules/mobilisations/mobilisation.routes.js:83 |
| GET | /api/mobilisations/:id/export | requireAuth, requireStaff | validate({ params: mobilisationIdParamSchema }); asyncHandler(mobilisationController.exportOne) | server/src/modules/mobilisations/mobilisation.routes.js:84 |
| POST | /api/mobilisations | requireAuth, requireStaff | validate({ body: createMobilisationSchema }); asyncHandler(mobilisationController.create) | server/src/modules/mobilisations/mobilisation.routes.js:89 |
| PATCH | /api/mobilisations/:id | requireAuth, requireStaff | validate({ params: mobilisationIdParamSchema, body: updateMobilisationSchema }); asyncHandler(mobilisationController.update) | server/src/modules/mobilisations/mobilisation.routes.js:90 |
| POST | /api/mobilisations/:id/coordinators | requireAuth, requireStaff | validate({ params: mobilisationIdParamSchema, body: addCoordinatorSchema }); asyncHandler(mobilisationController.addCoordinator) | server/src/modules/mobilisations/mobilisation.routes.js:96 |
| DELETE | /api/mobilisations/:id/coordinators/:userId | requireAuth, requireStaff | validate({ params: mobilisationCoordinatorParamSchema }); asyncHandler(mobilisationController.removeCoordinator) | server/src/modules/mobilisations/mobilisation.routes.js:101 |
| PATCH | /api/mobilisations/:id/coordinators/:userId/confirm | requireAuth, requireStaff | validate({ params: mobilisationCoordinatorParamSchema }); asyncHandler(mobilisationController.confirmCoordinator) | server/src/modules/mobilisations/mobilisation.routes.js:106 |
| PUT | /api/mobilisations/:id/coordinator-shares | requireAuth, requireStaff | validate({ params: mobilisationIdParamSchema, body: setCoordinatorSharesSchema }); asyncHandler(mobilisationController.setCoordinatorShares) | server/src/modules/mobilisations/mobilisation.routes.js:111 |
| DELETE | /api/mobilisations/:id/coordinator-shares | requireAuth, requireStaff | validate({ params: mobilisationIdParamSchema }); asyncHandler(mobilisationController.clearCoordinatorShares) | server/src/modules/mobilisations/mobilisation.routes.js:116 |
| POST | /api/mobilisations/:id/submit | requireAuth, requireStaff | validate({ params: mobilisationIdParamSchema }); asyncHandler(mobilisationController.submit) | server/src/modules/mobilisations/mobilisation.routes.js:121 |
| PATCH | /api/mobilisations/:id/commercial-details | requireAuth, requireStaff | validate({ params: mobilisationIdParamSchema, body: commercialDetailsSchema }); asyncHandler(mobilisationController.saveCommercialDetails) | server/src/modules/mobilisations/mobilisation.routes.js:128 |
| PATCH | /api/mobilisations/:id/decide | requireAuth, requireStaff | validate({ params: mobilisationIdParamSchema, body: decideMobilisationSchema }); asyncHandler(mobilisationController.decide) | server/src/modules/mobilisations/mobilisation.routes.js:133 |
| POST | /api/mobilisations/:id/documents | requireAuth, requireStaff | validate({ params: mobilisationIdParamSchema }); uploadMultiple; validate({ body: mobilisationDocumentCategorySchema }); asyncHandler(mobilisationController.addDocuments) | server/src/modules/mobilisations/mobilisation.routes.js:140 |
| DELETE | /api/mobilisations/:id/documents/:fileId | requireAuth, requireStaff | validate({ params: mobilisationDocumentParamSchema }); asyncHandler(mobilisationController.removeDocument) | server/src/modules/mobilisations/mobilisation.routes.js:147 |
| GET | /api/mobilisations/:id/documents/:fileId/file | requireAuth, requireStaff | validate({ params: mobilisationDocumentParamSchema }); asyncHandler(mobilisationController.documentFile) | server/src/modules/mobilisations/mobilisation.routes.js:152 |
| GET | /api/mobilisation-settings | requireAuth, requireRoles('Admin') | asyncHandler(settingsController.get) | server/src/modules/mobilisationSettings/mobilisationSettings.routes.js:17 |
| PATCH | /api/mobilisation-settings | requireAuth, requireRoles('Admin') | validate({ body: updateMobilisationSettingsSchema }); asyncHandler(settingsController.update) | server/src/modules/mobilisationSettings/mobilisationSettings.routes.js:18 |
| GET | /api/mobilisation-targets/my | requireAuth, requireStaff | validate({ query: getMyTargetSchema }); asyncHandler(targetController.getMy) | server/src/modules/mobilisationTargets/mobilisationTarget.routes.js:27 |
| GET | /api/mobilisation-targets/semi-annual/my | requireAuth, requireStaff | validate({ query: getSemiAnnualSchema }); asyncHandler(targetController.getMySemiAnnual) | server/src/modules/mobilisationTargets/mobilisationTarget.routes.js:28 |
| GET | /api/mobilisation-targets/progress | requireAuth, requireStaff | validate({ query: getProgressSchema }); asyncHandler(targetController.getProgress) | server/src/modules/mobilisationTargets/mobilisationTarget.routes.js:31 |
| GET | /api/mobilisation-targets/semi-annual | requireAuth, requireStaff | validate({ query: getSemiAnnualSchema }); asyncHandler(targetController.getSemiAnnual) | server/src/modules/mobilisationTargets/mobilisationTarget.routes.js:32 |
| GET | /api/mobilisation-targets | requireAuth, requireStaff | asyncHandler(targetController.listAll) | server/src/modules/mobilisationTargets/mobilisationTarget.routes.js:33 |
| POST | /api/mobilisation-targets | requireAuth, requireStaff | validate({ body: setTargetSchema }); asyncHandler(targetController.set) | server/src/modules/mobilisationTargets/mobilisationTarget.routes.js:36 |
| DELETE | /api/mobilisation-targets/:id | requireAuth, requireStaff | validate({ params: targetIdParamSchema }); asyncHandler(targetController.remove) | server/src/modules/mobilisationTargets/mobilisationTarget.routes.js:37 |
| GET | /c/:token | (req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
}, helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      'default-src': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
      'frame-ancestors': ["'self'"],
      'form-action': ["'self'"],
      'img-src': ["'self'", 'data:', 'https://res.cloudinary.com'],
      // Inline styles are used by the page, and we load an external font from Google Fonts.
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'script-src': ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      'connect-src': ["'self'"], // the click beacon posts back here
    },
  }), publicCardLimiter | asyncHandler(async (req, res) => { const { token } = req.params; if (!TOKEN_RE.test(token)) return notFound(res); const data = await getPublicCardByToken(token); if (!data) return notFound(res); const html = renderProfilePage({ ...data, cardUrl: cardUrl(token), vcardUrl: `${cardUrl(token)}/vcard`, cardImageUrl: `${cardUrl(token)}/card.png`, token, nonce: res.locals.nonce, }); res.status(200).type('html').send(html); // After the response — a slow analytics write must not delay the card. recordTapEvent({ ref: data.ref, type: 'view', req }); }) | server/src/modules/nfc/nfc.public.routes.js:66 |
| GET | /c/:token/vcard | (req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
}, helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      'default-src': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
      'frame-ancestors': ["'self'"],
      'form-action': ["'self'"],
      'img-src': ["'self'", 'data:', 'https://res.cloudinary.com'],
      // Inline styles are used by the page, and we load an external font from Google Fonts.
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'script-src': ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      'connect-src': ["'self'"], // the click beacon posts back here
    },
  }), publicCardLimiter | asyncHandler(async (req, res) => { const { token } = req.params; if (!TOKEN_RE.test(token)) return notFound(res); const data = await getPublicCardByToken(token); if (!data) return notFound(res); const safeName = (data.employee.name \|\| 'contact').replace(/[^\w]+/g, '_'); res.setHeader('Content-Type', 'text/vcard; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${safeName}.vcf"`); res.send(buildVCard(data)); recordTapEvent({ ref: data.ref, type: 'save', req }); }) | server/src/modules/nfc/nfc.public.routes.js:87 |
| GET | /c/:token/card.png | (req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
}, helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      'default-src': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
      'frame-ancestors': ["'self'"],
      'form-action': ["'self'"],
      'img-src': ["'self'", 'data:', 'https://res.cloudinary.com'],
      // Inline styles are used by the page, and we load an external font from Google Fonts.
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'script-src': ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      'connect-src': ["'self'"], // the click beacon posts back here
    },
  }), publicCardLimiter | asyncHandler(async (req, res) => { const { token } = req.params; if (!TOKEN_RE.test(token)) return notFound(res); const data = await getPublicCardByToken(token); if (!data) return notFound(res); const lang = req.query.lang === 'ar' ? 'ar' : 'en'; const png = await buildCardImagePng({ employee: data.employee, company: data.company, lang, cardUrl: cardUrl(token), logoUrl: data.logoUrl, photoUrl: data.photoUrl, }); const safeName = (data.employee.name \|\| 'card').replace(/[^\w]+/g, '_'); res.setHeader('Content-Type', 'image/png'); res.setHeader('Content-Disposition', `attachment; filename="${safeName}_card_${lang}.png"`); res.send(png); recordTapEvent({ ref: data.ref, type: 'image', req }); }) | server/src/modules/nfc/nfc.public.routes.js:106 |
| POST | /c/:token/e | (req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
}, helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      'default-src': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
      'frame-ancestors': ["'self'"],
      'form-action': ["'self'"],
      'img-src': ["'self'", 'data:', 'https://res.cloudinary.com'],
      // Inline styles are used by the page, and we load an external font from Google Fonts.
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'script-src': ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      'connect-src': ["'self'"], // the click beacon posts back here
    },
  }), publicCardLimiter | publicEventLimiter; async (req, res) => { res.status(204).end(); // Deliberately NOT wrapped in asyncHandler: the response has already gone // out, so a failure here has nowhere to be reported except the log. try { const { token } = req.params; if (!TOKEN_RE.test(token)) return; const target = req.body?.target; if (!NFC_CLICK_TARGETS.includes(target)) return; const data = await getPublicCardByToken(token); if (!data) return; await recordTapEvent({ ref: data.ref, type: 'click', target, req }); } catch (err) { logger.warn(`[nfc] click beacon failed: ${err.message}`); } } | server/src/modules/nfc/nfc.public.routes.js:142 |
| GET | /api/nfc/analytics | requireAuth | canRead; validate({ query: analyticsQuerySchema }); asyncHandler(nfc.overviewAnalytics) | server/src/modules/nfc/nfc.routes.js:39 |
| GET | /api/nfc/cards/:id/analytics | requireAuth | canRead; validate({ params: idParamSchema, query: analyticsQuerySchema }); asyncHandler(nfc.cardAnalytics) | server/src/modules/nfc/nfc.routes.js:40 |
| GET | /api/nfc/companies/:id/analytics | requireAuth | canRead; validate({ params: idParamSchema, query: analyticsQuerySchema }); asyncHandler(nfc.companyAnalytics) | server/src/modules/nfc/nfc.routes.js:41 |
| GET | /api/nfc/companies | requireAuth | canRead; validate({ query: listCompaniesSchema }); asyncHandler(nfc.listCompanies) | server/src/modules/nfc/nfc.routes.js:44 |
| POST | /api/nfc/companies | requireAuth | canWrite; validate({ body: createCompanySchema }); asyncHandler(nfc.createCompany) | server/src/modules/nfc/nfc.routes.js:45 |
| GET | /api/nfc/companies/:id | requireAuth | canRead; validate({ params: idParamSchema }); asyncHandler(nfc.getCompany) | server/src/modules/nfc/nfc.routes.js:46 |
| PATCH | /api/nfc/companies/:id | requireAuth | canWrite; validate({ params: idParamSchema, body: updateCompanySchema }); asyncHandler(nfc.updateCompany) | server/src/modules/nfc/nfc.routes.js:47 |
| DELETE | /api/nfc/companies/:id | requireAuth | canWrite; validate({ params: idParamSchema }); asyncHandler(nfc.deleteCompany) | server/src/modules/nfc/nfc.routes.js:48 |
| POST | /api/nfc/companies/:id/logo | requireAuth | canWrite; validate({ params: idParamSchema }); uploadNfcImage; asyncHandler(nfc.uploadCompanyLogo) | server/src/modules/nfc/nfc.routes.js:49 |
| DELETE | /api/nfc/companies/:id/logo | requireAuth | canWrite; validate({ params: idParamSchema }); asyncHandler(nfc.removeCompanyLogo) | server/src/modules/nfc/nfc.routes.js:50 |
| POST | /api/nfc/employees | requireAuth | canWrite; validate({ body: createEmployeeSchema }); asyncHandler(nfc.createEmployee) | server/src/modules/nfc/nfc.routes.js:53 |
| PATCH | /api/nfc/employees/:id | requireAuth | canWrite; validate({ params: idParamSchema, body: updateEmployeeSchema }); asyncHandler(nfc.updateEmployee) | server/src/modules/nfc/nfc.routes.js:54 |
| DELETE | /api/nfc/employees/:id | requireAuth | canWrite; validate({ params: idParamSchema }); asyncHandler(nfc.deleteEmployee) | server/src/modules/nfc/nfc.routes.js:55 |
| POST | /api/nfc/employees/:id/photo | requireAuth | canWrite; validate({ params: idParamSchema }); uploadNfcImage; asyncHandler(nfc.uploadEmployeePhoto) | server/src/modules/nfc/nfc.routes.js:56 |
| DELETE | /api/nfc/employees/:id/photo | requireAuth | canWrite; validate({ params: idParamSchema }); asyncHandler(nfc.removeEmployeePhoto) | server/src/modules/nfc/nfc.routes.js:57 |
| POST | /api/nfc/batches | requireAuth | canWrite; validate({ body: generateBatchSchema }); asyncHandler(nfc.generateBatch) | server/src/modules/nfc/nfc.routes.js:60 |
| GET | /api/nfc/batches | requireAuth | canRead; asyncHandler(nfc.listBatches) | server/src/modules/nfc/nfc.routes.js:61 |
| GET | /api/nfc/batches/:id/cards.csv | requireAuth | canRead; validate({ params: idParamSchema }); asyncHandler(nfc.batchCsv) | server/src/modules/nfc/nfc.routes.js:62 |
| GET | /api/nfc/cards | requireAuth | canRead; validate({ query: listCardsSchema }); asyncHandler(nfc.listCards) | server/src/modules/nfc/nfc.routes.js:65 |
| GET | /api/nfc/cards/:id | requireAuth | canRead; validate({ params: idParamSchema }); asyncHandler(nfc.getCard) | server/src/modules/nfc/nfc.routes.js:66 |
| GET | /api/nfc/cards/:id/qr.png | requireAuth | canRead; validate({ params: idParamSchema }); asyncHandler(nfc.cardQr) | server/src/modules/nfc/nfc.routes.js:67 |
| GET | /api/nfc/cards/:id/qr-offline.png | requireAuth | canRead; validate({ params: idParamSchema }); asyncHandler(nfc.cardQrOffline) | server/src/modules/nfc/nfc.routes.js:68 |
| PATCH | /api/nfc/cards/:id | requireAuth | canWrite; validate({ params: idParamSchema, body: updateCardSchema }); asyncHandler(nfc.updateCard) | server/src/modules/nfc/nfc.routes.js:69 |
| DELETE | /api/nfc/cards/:id | requireAuth | canWrite; validate({ params: idParamSchema }); asyncHandler(nfc.deleteCard) | server/src/modules/nfc/nfc.routes.js:70 |
| POST | /api/nfc/cards/:id/assign | requireAuth | canWrite; validate({ params: idParamSchema, body: assignCardSchema }); asyncHandler(nfc.assignCard) | server/src/modules/nfc/nfc.routes.js:71 |
| POST | /api/nfc/cards/:id/assign-company | requireAuth | canWrite; validate({ params: idParamSchema, body: assignCardToCompanySchema }); asyncHandler(nfc.assignCardToCompany) | server/src/modules/nfc/nfc.routes.js:72 |
| POST | /api/nfc/cards/:id/unassign | requireAuth | canWrite; validate({ params: idParamSchema }); asyncHandler(nfc.unassignCard) | server/src/modules/nfc/nfc.routes.js:73 |
| POST | /api/nfc/cards/:id/lost | requireAuth | canWrite; validate({ params: idParamSchema }); asyncHandler(nfc.markLost) | server/src/modules/nfc/nfc.routes.js:74 |
| POST | /api/nfc/cards/:id/return | requireAuth | canWrite; validate({ params: idParamSchema }); asyncHandler(nfc.markReturned) | server/src/modules/nfc/nfc.routes.js:75 |
| POST | /api/nfc/cards/:id/disable | requireAuth | canWrite; validate({ params: idParamSchema }); asyncHandler(nfc.disableCard) | server/src/modules/nfc/nfc.routes.js:76 |
| POST | /api/nfc/cards/:id/rotate | requireAuth | canWrite; validate({ params: idParamSchema }); asyncHandler(nfc.rotateToken) | server/src/modules/nfc/nfc.routes.js:77 |
| GET | /api/notifications | requireAuth | validate({ query: listNotificationsSchema }); asyncHandler(notificationController.list) | server/src/modules/notifications/notification.routes.js:23 |
| GET | /api/notifications/unread-count | requireAuth | asyncHandler(notificationController.unreadCount) | server/src/modules/notifications/notification.routes.js:26 |
| GET | /api/notifications/vapid-public-key | requireAuth | asyncHandler(notificationController.vapidPublicKey) | server/src/modules/notifications/notification.routes.js:27 |
| PATCH | /api/notifications/:id/read | requireAuth | validate({ params: notificationIdParamSchema }); asyncHandler(notificationController.markRead) | server/src/modules/notifications/notification.routes.js:28 |
| POST | /api/notifications/read-all | requireAuth | asyncHandler(notificationController.markAllRead) | server/src/modules/notifications/notification.routes.js:29 |
| POST | /api/notifications/subscribe | requireAuth | validate({ body: subscribePushSchema }); asyncHandler(notificationController.subscribe) | server/src/modules/notifications/notification.routes.js:30 |
| POST | /api/notifications/unsubscribe | requireAuth | validate({ body: unsubscribePushSchema }); asyncHandler(notificationController.unsubscribe) | server/src/modules/notifications/notification.routes.js:31 |
| GET | /api/ramadan-periods | requireAuth | canReadRamadan; validate({ query: listRamadanPeriodsSchema }); asyncHandler(ramadanPeriodController.list) | server/src/modules/ramadan/ramadanPeriod.routes.js:32 |
| POST | /api/ramadan-periods | requireAuth | canManageRamadan; validate({ body: createRamadanPeriodSchema }); asyncHandler(ramadanPeriodController.create) | server/src/modules/ramadan/ramadanPeriod.routes.js:33 |
| PATCH | /api/ramadan-periods/:id | requireAuth | canManageRamadan; validate({ params: ramadanPeriodIdParamSchema, body: updateRamadanPeriodSchema }); asyncHandler(ramadanPeriodController.update) | server/src/modules/ramadan/ramadanPeriod.routes.js:39 |
| DELETE | /api/ramadan-periods/:id | requireAuth | canManageRamadan; validate({ params: ramadanPeriodIdParamSchema }); asyncHandler(ramadanPeriodController.remove) | server/src/modules/ramadan/ramadanPeriod.routes.js:45 |
| GET | /api/reconciliation |  | requireAuth; requireSectionAccess('reconciliation', 'read'); asyncHandler(reconciliationController.run) | server/src/modules/reconciliation/reconciliation.routes.js:15 |
| GET | /api/requirements/board | requireAuth, requireStaff | validate({ query: boardQuerySchema }); asyncHandler(controller.board) | server/src/modules/requirements/requirement.routes.js:43 |
| GET | /api/requirements/export | requireAuth, requireStaff | validate({ query: boardQuerySchema }); asyncHandler(controller.exportAll) | server/src/modules/requirements/requirement.routes.js:44 |
| GET | /api/requirements/lost | requireAuth, requireStaff | validate({ query: boardQuerySchema }); asyncHandler(controller.lost) | server/src/modules/requirements/requirement.routes.js:45 |
| GET | /api/requirements/lost/export | requireAuth, requireStaff | validate({ query: boardQuerySchema }); asyncHandler(controller.exportLost) | server/src/modules/requirements/requirement.routes.js:46 |
| GET | /api/requirements/coordinators | requireAuth, requireStaff | asyncHandler(controller.coordinators) | server/src/modules/requirements/requirement.routes.js:47 |
| POST | /api/requirements/stages/defaults | requireAuth, requireStaff | canManageStages; asyncHandler(controller.createSuggestedStages) | server/src/modules/requirements/requirement.routes.js:49 |
| PUT | /api/requirements/stages/order | requireAuth, requireStaff | canManageStages; validate({ body: reorderStagesSchema }); asyncHandler(controller.reorderStages) | server/src/modules/requirements/requirement.routes.js:50 |
| POST | /api/requirements/stages | requireAuth, requireStaff | canManageStages; validate({ body: createStageSchema }); asyncHandler(controller.createStage) | server/src/modules/requirements/requirement.routes.js:51 |
| PATCH | /api/requirements/stages/:id | requireAuth, requireStaff | canManageStages; validate({ params: stageIdParamSchema, body: updateStageSchema }); asyncHandler(controller.updateStage) | server/src/modules/requirements/requirement.routes.js:52 |
| DELETE | /api/requirements/stages/:id | requireAuth, requireStaff | canManageStages; validate({ params: stageIdParamSchema }); asyncHandler(controller.removeStage) | server/src/modules/requirements/requirement.routes.js:58 |
| POST | /api/requirements | requireAuth, requireStaff | validate({ body: createRequirementSchema }); asyncHandler(controller.create) | server/src/modules/requirements/requirement.routes.js:60 |
| GET | /api/requirements/:id | requireAuth, requireStaff | validate({ params: requirementIdParamSchema }); asyncHandler(controller.get) | server/src/modules/requirements/requirement.routes.js:61 |
| PATCH | /api/requirements/:id | requireAuth, requireStaff | validate({ params: requirementIdParamSchema, body: updateRequirementSchema }); asyncHandler(controller.update) | server/src/modules/requirements/requirement.routes.js:62 |
| PATCH | /api/requirements/:id/stage | requireAuth, requireStaff | validate({ params: requirementIdParamSchema, body: moveStageSchema }); asyncHandler(controller.move) | server/src/modules/requirements/requirement.routes.js:67 |
| DELETE | /api/requirements/:id | requireAuth, requireStaff | validate({ params: requirementIdParamSchema }); asyncHandler(controller.remove) | server/src/modules/requirements/requirement.routes.js:72 |
| POST | /api/requirements/:id/candidates | requireAuth, requireStaff | validate({ params: requirementIdParamSchema, body: createCandidateSchema }); asyncHandler(controller.addCandidate) | server/src/modules/requirements/requirement.routes.js:75 |
| PATCH | /api/requirements/:id/candidates/:candidateId | requireAuth, requireStaff | validate({ params: candidateParamSchema, body: updateCandidateSchema }); asyncHandler(controller.updateCandidate) | server/src/modules/requirements/requirement.routes.js:80 |
| DELETE | /api/requirements/:id/candidates/:candidateId | requireAuth, requireStaff | validate({ params: candidateParamSchema }); asyncHandler(controller.removeCandidate) | server/src/modules/requirements/requirement.routes.js:85 |
| GET | /api/section-access/:sectionKey/mine |  | requireAuth; validate({ params: sectionKeyParamSchema }); asyncHandler(sectionAccessController.mine) | server/src/modules/sectionAccess/sectionAccess.routes.js:18 |
| GET | /api/section-access | requireAuth, requireRoles('Admin') | asyncHandler(sectionAccessController.list) | server/src/modules/sectionAccess/sectionAccess.routes.js:27 |
| PATCH | /api/section-access/:sectionKey | requireAuth, requireRoles('Admin') | validate({ params: sectionKeyParamSchema, body: updateSectionAccessSchema }); asyncHandler(sectionAccessController.update) | server/src/modules/sectionAccess/sectionAccess.routes.js:28 |
| POST | /api/staff-attendance/punch | requireAuth | canSelfMark; validate({ body: selfMarkSchema }); asyncHandler(staffAttendanceController.punch) | server/src/modules/staffAttendance/staffAttendance.routes.js:38 |
| GET | /api/staff-attendance/all | requireAuth | canReadSignInOut; validate({ query: listAllStaffAttendanceSchema }); asyncHandler(staffAttendanceController.listAll) | server/src/modules/staffAttendance/staffAttendance.routes.js:39 |
| GET | /api/staff-attendance | requireAuth | canSelfMark; validate({ query: listMyAttendanceSchema }); asyncHandler(staffAttendanceController.listMine) | server/src/modules/staffAttendance/staffAttendance.routes.js:45 |
| GET | /api/subcontractors | requireAuth, requireStaff | canRead; validate({ query: listSubcontractorsSchema }); asyncHandler(subcontractorController.list) | server/src/modules/subcontractors/subcontractor.routes.js:35 |
| GET | /api/subcontractors/:id | requireAuth, requireStaff | canRead; validate({ params: subcontractorIdParamSchema }); asyncHandler(subcontractorController.get) | server/src/modules/subcontractors/subcontractor.routes.js:36 |
| POST | /api/subcontractors | requireAuth, requireStaff | canWrite; validate({ body: createSubcontractorSchema }); asyncHandler(subcontractorController.create) | server/src/modules/subcontractors/subcontractor.routes.js:37 |
| PATCH | /api/subcontractors/:id | requireAuth, requireStaff | canWrite; validate({ params: subcontractorIdParamSchema, body: updateSubcontractorSchema }); asyncHandler(subcontractorController.update) | server/src/modules/subcontractors/subcontractor.routes.js:43 |
| DELETE | /api/subcontractors/:id | requireAuth, requireStaff | canWrite; validate({ params: subcontractorIdParamSchema }); asyncHandler(subcontractorController.remove) | server/src/modules/subcontractors/subcontractor.routes.js:49 |
| POST | /api/timesheet-processor/preview | requireAuth, requireSectionAccess('timesheetProcessor') | uploadTimesheet; validate({ body: processTimesheetSchema }); asyncHandler(timesheetController.preview) | server/src/modules/timesheetProcessor/timesheet.routes.js:53 |
| POST | /api/timesheet-processor/export | requireAuth, requireSectionAccess('timesheetProcessor') | uploadTimesheet; validate({ body: processTimesheetSchema }); asyncHandler(timesheetController.exportXlsx) | server/src/modules/timesheetProcessor/timesheet.routes.js:59 |
| GET | /api/timesheets | requireAuth | canRead; validate({ query: listTimesheetsSchema }); asyncHandler(timesheetController.list) | server/src/modules/timesheets/timesheet.routes.js:38 |
| POST | /api/timesheets | requireAuth | canWrite; validate({ body: submitTimesheetSchema }); asyncHandler(timesheetController.submit) | server/src/modules/timesheets/timesheet.routes.js:39 |
| PATCH | /api/timesheets/:id/decide | requireAuth | canWrite; validate({ params: timesheetIdParamSchema, body: decideTimesheetSchema }); asyncHandler(timesheetController.decide) | server/src/modules/timesheets/timesheet.routes.js:40 |
| POST | /api/timesheets/bulk-approve | requireAuth | canWrite; validate({ body: bulkApproveTimesheetSchema }); asyncHandler(timesheetController.bulkApprove) | server/src/modules/timesheets/timesheet.routes.js:46 |
| GET | /api/timesheets/monthly-report | requireAuth | canRead; validate({ query: generateMonthlyReportSchema }); asyncHandler(timesheetController.getMonthlyReport) | server/src/modules/timesheets/timesheet.routes.js:56 |
| POST | /api/timesheets/monthly-report | requireAuth | canRead; validate({ body: generateMonthlyReportSchema }); asyncHandler(timesheetController.generateMonthlyReport) | server/src/modules/timesheets/timesheet.routes.js:62 |
| GET | /api/users | requireAuth | requireSectionAccess('team', 'read'); validate({ query: listStaffUsersSchema }); asyncHandler(userController.list) | server/src/modules/users/user.routes.js:30 |
| PATCH | /api/users/:id | requireAuth | requireRoles('Admin'); validate({ params: userIdParamSchema, body: updateStaffUserSchema }); asyncHandler(userController.update) | server/src/modules/users/user.routes.js:36 |
| POST | /api/users/:id/reset-password | requireAuth | requireRoles('Admin'); validate({ params: userIdParamSchema }); asyncHandler(userController.resetPassword) | server/src/modules/users/user.routes.js:42 |
| DELETE | /api/users/:id | requireAuth | requireRoles('Admin'); validate({ params: userIdParamSchema }); asyncHandler(userController.remove) | server/src/modules/users/user.routes.js:48 |
| GET | /api/health |  | (req, res) => { res.json(new ApiResponse('OK', { status: 'up' })); } | server/src/app.js:99 |
| GET | /nfc-media/:filename |  | serveNfcMedia | server/src/app.js:160 |