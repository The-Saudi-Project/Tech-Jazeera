import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {root,auditDir} from './audit-env.mjs';
const require=createRequire(path.join(root,'server/package.json'));const espree=require('espree');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const parse=s=>espree.parse(s,{ecmaVersion:'latest',sourceType:'module',range:true,loc:true,ecmaFeatures:{jsx:true}});
function walk(n,cb){if(!n||typeof n!=='object')return;if(n.type)cb(n);for(const [k,v]of Object.entries(n)){if(['loc','range'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,cb));else if(v&&typeof v==='object')walk(v,cb);}}
function files(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(dir+'/'+d.name):[dir+'/'+d.name]);}
const source=read('server/src/app.js'),ast=parse(source),imports={};for(const n of ast.body)if(n.type==='ImportDeclaration')for(const s of n.specifiers)imports[s.local.name]=path.posix.normalize('server/src/'+n.source.value);
const mounts={};walk(ast,n=>{if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object.name==='app'&&n.callee.property.name==='use'&&typeof n.arguments[0]?.value==='string'){const name=n.arguments[1]?.name;if(imports[name])mounts[imports[name]]=n.arguments[0].value;}});
const result=[];
for(const f of files('server/src/modules').filter(f=>f.endsWith('.routes.js'))){const s=read(f),a=parse(s),common=[],nodes=[];walk(a,n=>{if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object.name==='router')nodes.push(n);});nodes.sort((a,b)=>a.range[0]-b.range[0]);for(const n of nodes){const method=n.callee.property.name;const args=n.arguments.map(a=>s.slice(...a.range));if(method==='use'){common.push(...args);continue;}if(!['get','post','patch','put','delete','head','options'].includes(method))continue;result.push({method:method.toUpperCase(),path:(mounts[f]??'UNMOUNTED')+(n.arguments[0].value==='/'?'':n.arguments[0].value),file:f,line:n.loc.start.line,routerGuards:[...common],handlers:args.slice(1),mounted:Boolean(mounts[f])});}}
for(const n of ast.body){walk(n,x=>{if(x.type==='CallExpression'&&x.callee.type==='MemberExpression'&&x.callee.object.name==='app'&&['get','post'].includes(x.callee.property.name))result.push({method:x.callee.property.name.toUpperCase(),path:x.arguments[0].value,file:'server/src/app.js',line:x.loc.start.line,routerGuards:[],handlers:x.arguments.slice(1).map(a=>source.slice(...a.range)),mounted:true});});}
fs.writeFileSync(path.join(auditDir,'routes.json'),JSON.stringify(result,null,2));
const lines=['# API inventory — source snapshot','', 'Authorization is listed exactly as declared. Ownership must be traced in the linked handler/service; a role gate alone does not prove ownership. All /api routes inherit apiLimiter (600 requests per IP per 15 minutes). Authenticated routes also inherit userLimiter (1200 per user per 15 minutes).','', '| Method | Path | Router guards | Route handlers and validation | Source |','|---|---|---|---|---|'];
for(const r of result)lines.push('| '+[r.method,r.path,r.routerGuards.join(', '),r.handlers.join('; ').replace(/\s+/g,' '),r.file+':'+r.line].map(x=>x.replaceAll('|','\\|')).join(' | ')+' |');
fs.writeFileSync(path.join(auditDir,'API-INVENTORY.md'),lines.join('\n'));
console.log(JSON.stringify({routes:result.length,modules:Object.keys(mounts).length,unmounted:result.filter(r=>!r.mounted),mutationsWithoutRouteGate:result.filter(r=>!['GET','HEAD','OPTIONS'].includes(r.method)&&!r.routerGuards.concat(r.handlers).some(h=>/requireRoles|requireStaff|requireSectionAccess|requireMe|requireOwn/.test(h))).map(r=>({method:r.method,path:r.path,handlers:r.handlers}))},null,2));
