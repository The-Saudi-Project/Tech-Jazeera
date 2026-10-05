import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { root, auditDir, isolatedEnv } from './audit-env.mjs';
const checks = [
  ['server-tests','server',['node_modules/vitest/vitest.mjs','run']],
  ['server-lint','server',['node_modules/eslint/bin/eslint.js','.']],
  ['client-lint','client',['node_modules/eslint/bin/eslint.js','.']],
  ['client-build','client',['node_modules/vite/bin/vite.js','build','--outDir',path.join(auditDir,'web-build')]],
];
await Promise.all(checks.map(([name,dir,args])=>new Promise(resolve=>{
  const start=Date.now(); const log=fs.createWriteStream(path.join(auditDir,name+'.log'));
  const proc=spawn(process.execPath,args,{cwd:path.join(root,dir),env:{...isolatedEnv('development'),VITE_API_URL:'http://127.0.0.1:5015/api',VITE_SENTRY_DSN:''},windowsHide:true});
  proc.stdout.pipe(log);proc.stderr.pipe(log);
  proc.on('close',code=>{const result={name,code,ms:Date.now()-start};fs.writeFileSync(path.join(auditDir,name+'.result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));resolve();});
})));
