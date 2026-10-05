import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {root,auditDir,isolatedEnv} from './audit-env.mjs';
const require=createRequire(path.join(root,'server/package.json')), jwt=require('jsonwebtoken');
const fx=JSON.parse(fs.readFileSync(path.join(auditDir,'local-fixture.json'))), routes=JSON.parse(fs.readFileSync(path.join(auditDir,'routes.json')));
const tokens=Object.fromEntries(Object.entries(fx.users).map(([role,u])=>[role,jwt.sign({sub:u.id,tokenVersion:0},isolatedEnv().JWT_ACCESS_SECRET,{expiresIn:'1h'})]));
const base='http://127.0.0.1:5015';let counter=0;const evidence=[];
async function req(method,url,role,body,extra={}){const ip='198.18.'+Math.floor(counter/240)+'.'+(Object.keys(fx.users).indexOf(role)+2);counter++;const headers={'X-Forwarded-For':ip,...(role?{Authorization:'Bearer '+tokens[role]}:{}),...extra};if(body!==undefined)headers['Content-Type']='application/json';const start=performance.now();const r=await fetch(base+url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=text.slice(0,150)}return{status:r.status,ms:Math.round(performance.now()-start),data,headers:Object.fromEntries(r.headers)};}
async function check(name,method,url,role,body,extra){const r=await req(method,url,role,body,extra);evidence.push({name,method,url,role,status:r.status,body:r.data});console.log(JSON.stringify({name,status:r.status,body:r.data}));return r;}
await check('worker-outsourced-list','GET','/api/outsourced-employees','Worker');
await check('worker-outsourced-detail','GET','/api/outsourced-employees/'+fx.outsourced,'Worker');
await check('worker-employee-directory-denied','GET','/api/employees','Worker');
await check('worker-foreign-document-denied','GET','/api/me/documents/'+fx.foreignDocument+'/file','Worker');
await check('worker-mass-assignment','PATCH','/api/me','Worker',{role:'Admin',salary:999999,fullName:'MASS-ASSIGN-MARKER'});
await check('outsourced-unvalidated-query','GET','/api/outsourced-employees?limit=999999&workerType[$ne]=Freelancer','Worker');
await check('outsourced-invalid-limit','GET','/api/outsourced-employees?limit=Infinity','Admin');
await check('login-operator-injection','POST','/api/auth/login',null,{email:{$ne:null},password:{$ne:null}});
await check('login-untrusted-origin','POST','/api/auth/login',null,{}, {Origin:'https://audit-untrusted.invalid'});
const login=await req('POST','/api/auth/login',null,{email:fx.users.Worker.email,password:fx.password},{Origin:'http://localhost:5175'});
evidence.push({name:'real-http-login',status:login.status,user:login.data.data?.user,cookieAttributes:login.headers['set-cookie']?.replace(/refreshToken=[^;]+/,'refreshToken=[REDACTED]')});
const cookie=login.headers['set-cookie']?.split(';')[0];
if(cookie){const fresh=await req('POST','/api/auth/refresh',null,{}, {Cookie:cookie,Origin:'http://localhost:5175'});evidence.push({name:'refresh-rotation',status:fresh.status,newCookie:fresh.headers['set-cookie']?.split(';')[0]!==cookie});const nextCookie=fresh.headers['set-cookie']?.split(';')[0];await req('POST','/api/auth/logout',null,{}, {Cookie:nextCookie,Origin:'http://localhost:5175'});const loggedout=await req('POST','/api/auth/refresh',null,{}, {Cookie:nextCookie,Origin:'http://localhost:5175'});evidence.push({name:'logout-refresh-rejected',status:loggedout.status});}
const sweep=[];
for(const role of [null,...Object.keys(fx.users).filter(r=>r!=='CoordinatorB')]){
  for(const route of routes){if(!route.path.startsWith('/api'))continue;const url=route.path.replace(/:[A-Za-z]+/g,'000000000000000000000001');if(route.path.startsWith('/api/auth')&&role!==null)continue;
    try{const r=await req(route.method,url,role,['GET','HEAD'].includes(route.method)?undefined:{});sweep.push({role:role??'anonymous',method:route.method,path:route.path,status:r.status,message:r.data?.message??'',ms:r.ms});}catch(e){sweep.push({role:role??'anonymous',method:route.method,path:route.path,error:e.message});}
  }
  fs.writeFileSync(path.join(auditDir,'role-sweep.json'),JSON.stringify(sweep,null,2));console.log('Role sweep complete:',role??'anonymous');
}
fs.writeFileSync(path.join(auditDir,'http-evidence.json'),JSON.stringify(evidence,null,2));
console.log('Rows',sweep.length,'5xx',sweep.filter(x=>x.status>=500).length);
