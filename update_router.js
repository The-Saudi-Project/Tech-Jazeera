const fs = require('fs');

// 1. Update router.jsx
let routerCode = fs.readFileSync('client/src/app/router.jsx', 'utf8');

const importsToAdd = `import ReadyForSubInvoicePage from '../features/deployments/pages/ReadyForSubInvoicePage.jsx';
import SubcontractorPaymentsDuePage from '../features/deployments/pages/SubcontractorPaymentsDuePage.jsx';
import PaidSubcontractorInvoicesPage from '../features/deployments/pages/PaidSubcontractorInvoicesPage.jsx';
`;
routerCode = routerCode.replace("import PaymentsReviewPage from '../features/deployments/pages/PaymentsReviewPage.jsx';",
  "import PaymentsReviewPage from '../features/deployments/pages/PaymentsReviewPage.jsx';\n" + importsToAdd);

const routesToAdd = `          { path: 'ready-for-sub-invoice', element: <ReadyForSubInvoicePage /> },
          { path: 'sub-payments-due', element: <SubcontractorPaymentsDuePage /> },
          { path: 'paid-sub-invoices', element: <PaidSubcontractorInvoicesPage /> },`;

routerCode = routerCode.replace(
  "{ path: 'payments-due', element: <PaymentsDuePage /> },",
  "{ path: 'payments-due', element: <PaymentsDuePage /> },\n" + routesToAdd
);
fs.writeFileSync('client/src/app/router.jsx', routerCode);

// 2. Update navConfig.js
let navCode = fs.readFileSync('client/src/app/navConfig.js', 'utf8');
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
navCode = navCode.replace(
  /{ name: 'staffNavigation.paidInvoices', to: '\/financial\/paid-invoices', icon: CheckBadgeIcon, roles: \['\*'\] },/,
  "{ name: 'staffNavigation.paidInvoices', to: '/financial/paid-invoices', icon: CheckBadgeIcon, roles: ['*'] }," + subInvoiceMenu
);
fs.writeFileSync('client/src/app/navConfig.js', navCode);
console.log('Updated router.jsx and navConfig.js');
