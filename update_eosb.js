const fs = require('fs');

function replaceFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  let newContent = content;
  for (const [from, to] of replacements) {
    newContent = newContent.replaceAll(from, to);
  }
  if (content !== newContent) {
    fs.writeFileSync(path, newContent);
    console.log('Updated ' + path);
  }
}

// 1. client/src/lib/constants.js
replaceFile('client/src/lib/constants.js', [
  ['export const EXIT_REASONS = [\'Resignation\', \'TerminationByEmployer\', \'EndOfContract\', \'SponsorshipTransfer\'];', 'export const EXIT_REASONS = [\'Resignation\', \'TerminationByEmployer\', \'EndOfContract\', \'SponsorshipTransfer\', \'CurrentEmployee\'];'],
  ['SponsorshipTransfer: \'Sponsorship transfer (Tanazel)\',', 'SponsorshipTransfer: \'Sponsorship transfer (Tanazel)\',\n  CurrentEmployee: \'Current Employee (Simulation)\',']
]);

// 2. server/src/modules/eosb/settlement.model.js
replaceFile('server/src/modules/eosb/settlement.model.js', [
  ['export const EXIT_REASONS = [\'Resignation\', \'TerminationByEmployer\', \'EndOfContract\', \'SponsorshipTransfer\'];', 'export const EXIT_REASONS = [\'Resignation\', \'TerminationByEmployer\', \'EndOfContract\', \'SponsorshipTransfer\', \'CurrentEmployee\'];']
]);

// 3. server/src/modules/eosb/settlement.service.js
replaceFile('server/src/modules/eosb/settlement.service.js', [
  ['const existing = await Settlement.findOne({ employee: employee._id }).lean();', 'const existing = await Settlement.findOne({ employee: employee._id, exitReason: { $ne: \'CurrentEmployee\' } }).lean();']
]);
