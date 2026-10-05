const fs = require('fs');

// 1. Update App.jsx
let appCode = fs.readFileSync('client/src/App.jsx', 'utf8');

const importsToAdd = `import ReadyForSubInvoicePage from './features/deployments/pages/ReadyForSubInvoicePage.jsx';
import SubcontractorPaymentsDuePage from './features/deployments/pages/SubcontractorPaymentsDuePage.jsx';
import PaidSubcontractorInvoicesPage from './features/deployments/pages/PaidSubcontractorInvoicesPage.jsx';
`;
appCode = appCode.replace("import PaymentsReviewPage from './features/deployments/pages/PaymentsReviewPage.jsx';",
  "import PaymentsReviewPage from './features/deployments/pages/PaymentsReviewPage.jsx';\n" + importsToAdd);

const routesToAdd = `          <Route path="financial/ready-for-sub-invoice" element={<ReadyForSubInvoicePage />} />
          <Route path="financial/sub-payments-due" element={<SubcontractorPaymentsDuePage />} />
          <Route path="financial/paid-sub-invoices" element={<PaidSubcontractorInvoicesPage />} />`;

appCode = appCode.replace(
  "<Route path=\"financial/payments-due\" element={<PaymentsDuePage />} />",
  "<Route path=\"financial/payments-due\" element={<PaymentsDuePage />} />\n" + routesToAdd
);
fs.writeFileSync('client/src/App.jsx', appCode);

// 2. Update Sidebar.jsx
let sidebarCode = fs.readFileSync('client/src/components/layout/Sidebar.jsx', 'utf8');
const subInvoiceMenu = `
          {
            name: 'staffNavigation.readyForSubInvoice',
            to: '/financial/ready-for-sub-invoice',
            icon: DocumentTextIcon,
            roles: ['*'], // Relies on page-level auth
          },
          {
            name: 'staffNavigation.subPaymentsDue',
            to: '/financial/sub-payments-due',
            icon: ClockIcon,
            roles: ['*'], // Relies on page-level auth
          },
          {
            name: 'staffNavigation.paidSubInvoices',
            to: '/financial/paid-sub-invoices',
            icon: BanknotesIcon,
            roles: ['*'], // Relies on page-level auth
          },`;
sidebarCode = sidebarCode.replace(
  /{ name: 'staffNavigation.paidInvoices', to: '\/financial\/paid-invoices', icon: CheckBadgeIcon, roles: \['\*'\] },/,
  "{ name: 'staffNavigation.paidInvoices', to: '/financial/paid-invoices', icon: CheckBadgeIcon, roles: ['*'] }," + subInvoiceMenu
);
fs.writeFileSync('client/src/components/layout/Sidebar.jsx', sidebarCode);
console.log('Updated App.jsx and Sidebar.jsx');
