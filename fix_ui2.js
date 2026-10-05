const fs = require('fs');
const pages = [
  'client/src/features/mobilisationTargets/pages/TargetsListPage.jsx',
  'client/src/features/locations/pages/LocationsSettingsPage.jsx',
  'client/src/features/approvals/pages/ApprovalLogPage.jsx'
];

for (const p of pages) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/max-w-3xl|max-w-4xl|max-w-5xl|max-w-6xl|max-w-7xl/g, 'max-w-[1600px]');
    
    if (p.includes('TargetsListPage')) {
      content = content.replace(/title=\{t\('targets\.pageTitle'\)\}/, 'title={t(\'targets.pageTitle\')} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg>}');
      content = content.replace(/h-\[300px\]|h-\[400px\]|h-64/g, 'h-[500px]');
    }
    
    if (p.includes('LocationsSettingsPage')) {
      if (!content.includes('onBack')) {
        content = content.replace(/title=\{t\('locations\.pageTitle'\)\}/, 'title={t(\'locations.pageTitle\')} onBack={() => window.history.back()}');
      }
    }
    if (p.includes('ApprovalLogPage')) {
      if (!content.includes('onBack')) {
        content = content.replace(/title=\{t\('approvals\.log\.pageTitle'\)\}/, 'title={t(\'approvals.log.pageTitle\')} onBack={() => window.history.back()}');
      }
    }

    fs.writeFileSync(p, content);
    console.log('Fixed ' + p);
  } else {
    console.log('Not found: ' + p);
  }
}
