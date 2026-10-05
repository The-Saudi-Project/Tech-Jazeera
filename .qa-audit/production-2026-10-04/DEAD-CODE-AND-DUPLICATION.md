# Dead code, duplication and documentation review

No deletions were made. Duplicate detection compares normalized function bodies; it does not establish that their meaning or lifetime is identical. Export analysis is a candidate scan, not whole-program reachability proof.

## Duplicate function bodies

| Locations | Treatment |
|---|---|
| [server/src/modules/companySettings/companySettings.validation.js:17](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/companySettings/companySettings.validation.js:17>) isValidIban; [client/src/features/companySettings/companySettings.schema.js:17](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/features/companySettings/companySettings.schema.js:17>) isValidIban | Intentional client/server IBAN validation. Share fixtures; retain both trust boundaries. |
| [server/src/modules/mobilisations/mobilisation.validation.js:323](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/mobilisations/mobilisation.validation.js:323>) (anonymous); [client/src/features/mobilisations/mobilisations.schema.js:251](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/features/mobilisations/mobilisations.schema.js:251>) (anonymous) | Client/server mobilisation refinement. Contract tests avoid drift; do not remove server checks. |
| [client/src/features/deployments/pages/DeploymentListPage.jsx:135](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/features/deployments/pages/DeploymentListPage.jsx:135>) (anonymous); [client/src/features/mobilisations/pages/MobilisationListPage.jsx:70](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/features/mobilisations/pages/MobilisationListPage.jsx:70>) (anonymous) | Repeated table preference effect. Consider a small shared hook after behavior tests. |
| [server/src/modules/employees/outsourcedEmployee.validation.js:53](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/employees/outsourcedEmployee.validation.js:53>) (anonymous); [server/src/modules/employees/outsourcedEmployee.validation.js:62](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/employees/outsourcedEmployee.validation.js:62>) (anonymous) | Repeated outsourced create/update cross-field refinement. Use one refinement helper. |
| [client/src/app/pages/AdminToolsHubPage.jsx:6](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/app/pages/AdminToolsHubPage.jsx:6>) AdminToolsHubPage; [client/src/app/pages/SalesHubPage.jsx:6](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/app/pages/SalesHubPage.jsx:6>) SalesHubPage; [client/src/app/pages/WorkforceHubPage.jsx:6](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/app/pages/WorkforceHubPage.jsx:6>) WorkforceHubPage | Tiny hub wrappers with different imported module groups. Negligible runtime cost; optional layout consolidation. |

Additional duplicate: [client/src/main.jsx:30](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/main.jsx:30>) and its second await at line 40. Same promise awaited twice, no measured performance penalty.

## Export candidates

Most functions/constants below are used locally: retain implementation. Only PAYROLL_STATUS_VARIANT and the client lineAmount had no additional AST code identifiers. Comments do not count as runtime usage.

| Symbol | Location | Classification |
|---|---|---|
| DOCUMENT_DELIVERY_TYPE | [server/src/middleware/upload.js:66](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/middleware/upload.js:66>) | Locally used; only export appears redundant |
| ASSET_ASSIGNMENT_STATUSES | [server/src/modules/assets/assetAssignment.model.js:11](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/assets/assetAssignment.model.js:11>) | Locally used; only export appears redundant |
| ATTENDANCE_SOURCES | [server/src/modules/attendance/attendance.model.js:34](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/attendance/attendance.model.js:34>) | Locally used; only export appears redundant |
| ATTENDANCE_VERIFICATION_METHODS | [server/src/modules/attendance/attendance.model.js:35](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/attendance/attendance.model.js:35>) | Locally used; only export appears redundant |
| CLIENT_PAYMENT_DECISION_STATUSES | [server/src/modules/deployments/clientPayment.model.js:20](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/deployments/clientPayment.model.js:20>) | Locally used; only export appears redundant |
| MONTHLY_HOURS_STATUSES | [server/src/modules/deployments/deployment.model.js:42](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/deployments/deployment.model.js:42>) | Locally used; only export appears redundant |
| DAILY_ENTRY_STATUSES | [server/src/modules/deployments/deployment.model.js:91](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/deployments/deployment.model.js:91>) | Locally used; only export appears redundant |
| deductionsForEmployeesMonth | [server/src/modules/deployments/deployment.service.js:1814](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/deployments/deployment.service.js:1814>) | Locally used; only export appears redundant |
| PROFIT_RATE_FIELDS | [server/src/modules/deployments/deployment.service.js:1851](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/deployments/deployment.service.js:1851>) | Locally used; only export appears redundant |
| computeOutstanding | [server/src/modules/financialRequests/advance.service.js:34](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/financialRequests/advance.service.js:34>) | Locally used; only export appears redundant |
| streamReceipt | [server/src/modules/financialRequests/reimbursement.controller.js:54](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/financialRequests/reimbursement.controller.js:54>) | Locally used; only export appears redundant |
| streamAttachment | [server/src/modules/leave/leave.controller.js:64](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/leave/leave.controller.js:64>) | Locally used; only export appears redundant |
| activeMobilisationIqamas | [server/src/modules/mobilisations/mobilisation.service.js:323](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/mobilisations/mobilisation.service.js:323>) | Locally used; only export appears redundant |
| ensureQrSafeColour | [server/src/modules/nfc/nfc.qr.js:65](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/nfc/nfc.qr.js:65>) | Locally used; only export appears redundant |
| mediaUrl | [server/src/modules/nfc/nfc.service.js:24](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/nfc/nfc.service.js:24>) | Locally used; only export appears redundant |
| NFC_MEDIA_DIR | [server/src/modules/nfc/nfc.upload.js:12](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/nfc/nfc.upload.js:12>) | Locally used; only export appears redundant |
| countryFrom | [server/src/modules/nfc/nfc.visitor.js:74](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/nfc/nfc.visitor.js:74>) | Locally used; only export appears redundant |
| deviceFrom | [server/src/modules/nfc/nfc.visitor.js:85](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/nfc/nfc.visitor.js:85>) | Locally used; only export appears redundant |
| platformFrom | [server/src/modules/nfc/nfc.visitor.js:96](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/nfc/nfc.visitor.js:96>) | Locally used; only export appears redundant |
| referrerHostFrom | [server/src/modules/nfc/nfc.visitor.js:111](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/nfc/nfc.visitor.js:111>) | Locally used; only export appears redundant |
| visitorHash | [server/src/modules/nfc/nfc.visitor.js:147](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/nfc/nfc.visitor.js:147>) | Locally used; only export appears redundant |
| NFC_EVENT_TYPES | [server/src/modules/nfc/nfcTapEvent.model.js:27](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/nfc/nfcTapEvent.model.js:27>) | Locally used; only export appears redundant |
| RETENTION_DAYS | [server/src/modules/nfc/nfcTapEvent.model.js:38](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/nfc/nfcTapEvent.model.js:38>) | Locally used; only export appears redundant |
| NOTIFICATION_TYPES | [server/src/modules/notifications/notification.model.js:14](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/notifications/notification.model.js:14>) | Locally used; only export appears redundant |
| CANDIDATE_STATUSES | [server/src/modules/requirements/requirement.model.js:46](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/requirements/requirement.model.js:46>) | Locally used; only export appears redundant |
| STAFF_ASSIGNABLE_ROLES | [server/src/modules/users/user.validation.js:16](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/modules/users/user.validation.js:16>) | Locally used; only export appears redundant |
| csvRow | [server/src/utils/csv.js:42](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/utils/csv.js:42>) | Locally used; only export appears redundant |
| IMAGE_MIME_TYPES | [server/src/utils/imageUpload.js:7](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/server/src/utils/imageUpload.js:7>) | Locally used; only export appears redundant |
| FALLBACK_BRAND_NAME | [client/src/components/shared/BrandLogo.jsx:13](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/components/shared/BrandLogo.jsx:13>) | Locally used; only export appears redundant |
| toDateKey | [client/src/features/attendance/attendance.dates.js:9](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/features/attendance/attendance.dates.js:9>) | Locally used; only export appears redundant |
| emptyCompanySettingsForm | [client/src/features/companySettings/companySettings.schema.js:51](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/features/companySettings/companySettings.schema.js:51>) | Locally used; only export appears redundant |
| RANGES | [client/src/features/nfc/components/NfcAnalyticsBits.jsx:13](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/features/nfc/components/NfcAnalyticsBits.jsx:13>) | Locally used; only export appears redundant |
| RTL_LANGUAGES | [client/src/i18n/index.js:36](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/i18n/index.js:36>) | Locally used; only export appears redundant |
| applyDocumentDirection | [client/src/i18n/index.js:71](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/i18n/index.js:71>) | Locally used; only export appears redundant |
| ACTION_LABELS | [client/src/lib/auditActions.js:12](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/lib/auditActions.js:12>) | Locally used; only export appears redundant |
| PAYROLL_STATUS_VARIANT | [client/src/lib/constants.js:170](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/lib/constants.js:170>) | No code references found |
| lineAmount | [client/src/lib/utils.js:127](<C:/Users/JARVIS/Desktop/Al Jazeera CRM/client/src/lib/utils.js:127>) | No code references found |

## Cleanup order

1. Resolve lint-blocking one-off client fix scripts and the unused server target variable (saved lint logs).
2. Remove truly unused declarations after checking dynamic/tool consumers; lint/build/smoke suffice, no implementation-mirroring tests.
3. Consolidate shared refinement/effect helpers if it reduces future drift.
4. Correct README CI claims and shared-IP limiter comments. Keep operational migration scripts until confirmed obsolete; archive old history rather than delete blindly.
5. Measure target-report batching first if the goal is speed. None of these small dead declarations explains a measured production slowdown.
