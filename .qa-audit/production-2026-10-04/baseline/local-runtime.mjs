import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {root,auditDir,isolatedEnv} from './audit-env.mjs';
Object.assign(process.env,isolatedEnv());
const require=createRequire(path.join(root,'server/package.json'));
const {MongoMemoryReplSet}=require('mongodb-memory-server');
const mongoose=require('mongoose');const bcrypt=require('bcryptjs');
const db=await MongoMemoryReplSet.create({binary:{systemBinary:process.env.MONGOMS_SYSTEM_BINARY},replSet:{count:1,storageEngine:'wiredTiger'}});
process.env.MONGODB_URI=db.getUri('crm_isolated_audit');
await mongoose.connect(process.env.MONGODB_URI);
const mod=async p=>(await import(pathToFileURL(path.join(root,'server/src',p)))).default;
const User=await mod('modules/auth/user.model.js');const Employee=await mod('modules/employees/employee.model.js');
const Client=await mod('modules/clients/client.model.js');const Outsourced=await mod('modules/employees/outsourcedEmployee.model.js');
const ApprovalRole=await mod('modules/approvals/approvalRole.model.js');const Section=await mod('modules/sectionAccess/sectionAccess.model.js');
const Document=await mod('modules/documents/document.model.js');
const password='AuditOnly-Local-2026!';const passwordHash=await bcrypt.hash(password,12);const users={};
for(const role of ['Admin','Manager','HR','Accounts','Coordinator','Executive','Office Secretary','Staff','Worker','CoordinatorB']){
  const name=role.replaceAll(' ','').toLowerCase();const employee=role==='Admin'?null:await Employee.create({employeeId:'AUDIT-'+name,fullName:'Audit '+role,type:'Own',designation:'Audit fixture',joiningDate:new Date('2024-01-01'),salary:4000});
  const user=await User.create({name:'Audit '+role,email:name+'@audit.invalid',role:role==='CoordinatorB'?'Coordinator':role,passwordHash,employee:employee?._id});
  users[role]={id:String(user._id),employee:employee?String(employee._id):null,email:user.email};
}
await Employee.updateOne({_id:users.Worker.employee},{$set:{coordinator:users.Coordinator.id,iqamaNumber:'AUDIT-PRIVATE-A'}});
await Employee.updateOne({_id:users.Staff.employee},{$set:{coordinator:users.CoordinatorB.id,iqamaNumber:'AUDIT-PRIVATE-B'}});
const client=await Client.create({companyName:'Audit Client',createdBy:users.Admin.id});
const outsourced=await Outsourced.create({name:'Private External Worker',workerType:'Freelancer',iqamaNumber:'AUDIT-OUT-PRIVATE',phone:'0000000000',agreedRate:123,createdBy:users.Admin.id,documents:[{title:'Private fixture',fileName:'audit/private-file',resourceType:'raw',originalName:'audit-private.pdf',mimeType:'application/pdf',size:20,uploadedBy:users.Admin.id}]});
const doc=await Document.create({title:'Foreign employee private document',category:'Other',ownerType:'Employee',owner:users.Staff.employee,versions:[{version:1,fileName:'audit-private.txt',originalName:'audit-private.txt',mimeType:'text/plain',size:20,storage:'local',uploadedBy:users.Admin.id}]});
fs.mkdirSync(process.env.UPLOAD_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.UPLOAD_DIR,'audit-private.txt'),'private audit fixture');
await Promise.all(Object.values(mongoose.models).map(m=>m.init()));
const fixture={uri:process.env.MONGODB_URI,users,password,client:String(client._id),outsourced:String(outsourced._id),outsourcedFile:String(outsourced.documents[0]._id),foreignDocument:String(doc._id)};
fs.writeFileSync(path.join(auditDir,'local-fixture.json'),JSON.stringify(fixture,null,2));
const log=fs.createWriteStream(path.join(auditDir,'local-server.log'));
const server=spawn(process.execPath,['src/server.js'],{cwd:path.join(root,'server'),env:process.env,windowsHide:true});server.stdout.pipe(log);server.stderr.pipe(log);
let stopping=false;async function stop(){if(stopping)return;stopping=true;server.kill();await mongoose.disconnect();await db.stop();console.log('Isolated MongoDB stopped; only disposable fixtures existed.');process.exit();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);server.on('exit',code=>{if(!stopping){console.log('API exited',code);stop();}});
for(let i=0;i<60;i++){try{const r=await fetch('http://127.0.0.1:5015/api/health');if(r.ok){console.log('ISOLATED_API_READY http://127.0.0.1:5015; 10 disposable role accounts seeded');break;}}catch{}await new Promise(r=>setTimeout(r,500));}
setInterval(()=>{},60000);
