const fs = require('fs');

// Update ess.api.js
let apiCode = fs.readFileSync('client/src/features/ess/ess.api.js', 'utf8');
const apiAdd = `
export async function submitAnnualVacation(data) {
  return fetchJson('/api/financial-requests/annual-vacation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
`;
fs.writeFileSync('client/src/features/ess/ess.api.js', apiCode + apiAdd);

console.log('Updated ess.api.js');
