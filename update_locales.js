const fs = require('fs');

const path = 'client/src/i18n/locales/en.json';
let enJson = fs.readFileSync(path, 'utf8');

const additions = `
    "readyForSubInvoice": "Ready for Sub Invoice",
    "subPaymentsDue": "Subcontractor Payments Due",
    "paidSubInvoices": "Paid Sub Invoices",
`;

enJson = enJson.replace(
  /"readyToInvoice": "Ready to Invoice",/,
  "\"readyToInvoice\": \"Ready to Invoice\",\n" + additions
);

fs.writeFileSync(path, enJson);
console.log('Updated en.json');
