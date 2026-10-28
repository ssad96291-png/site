import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';
import { createApp } from './app.js';
const cookie = (r:Response)=>r.headers.get('set-cookie')?.split(';')[0]||'';
const secret = ()=>randomBytes(24).toString('base64url');
async function pdf(){const doc=new PDFDocument();const chunks:Buffer[]=[];const ready=new Promise<Buffer>(r=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>r(Buffer.concat(chunks)));});doc.text('Synthetic private proposal.');doc.end();return ready;}

test('Independent portal receipt, document, account and role isolation',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'kilinc-portal-boundaries-'));const adminPassword=secret(),alicePassword=secret(),bobPassword=secret();
 const old=process.env.ADMIN_PASSWORD;process.env.ADMIN_PASSWORD=adminPassword;const app=createApp({dataDir:dir,production:false});if(old===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=old;
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const base=`http://127.0.0.1:${(server.address() as any).port}`;
 const req=(path:string,method='GET',body?:unknown,auth='')=>fetch(base+path,{method,headers:{...(auth?{Cookie:auth}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const lead=async(name:string,mail:string,auth='',district='Etimesgut')=>{const r=await req('/api/inquiries','POST',{name,email:mail,phone:'05000000000',message:'Synthetic security regression enquiry.',district,consent:true},auth);assert.equal(r.status,201);return r.json();};
 let admin='',alice='',bob='',scoped='',aliceId='',aliceInquiry='',bobInquiry='',dealerAuth='',dealerStaff='';
 try{
  const login=await req('/api/admin/login','POST',{username:'admin',password:adminPassword});assert.equal(login.status,200);admin=cookie(login);
  await t.test('Email reuse does not link old enquiries; one-use receipt remains scoped',async()=>{
   const historical=await lead('Historical anonymous Alice','boundary-alice@example.com');
   const ar=await req('/api/customer/register','POST',{name:'Alice Boundary',email:'boundary-alice@example.com',password:alicePassword});assert.equal(ar.status,201);alice=cookie(ar);aliceId=(await ar.json()).customer.id;
   assert.equal((await(await req('/api/customer/inquiries','GET',undefined,alice)).json()).inquiries.length,0);
   assert.equal((await req('/api/customer/inquiries/'+historical.id,'GET',undefined,alice)).status,404);
   aliceInquiry=(await lead('Alice owned','boundary-alice@example.com',alice)).id;
   const br=await req('/api/customer/register','POST',{name:'Bob Boundary',email:'boundary-bob@example.com',password:bobPassword});assert.equal(br.status,201);bob=cookie(br);bobInquiry=(await lead('Bob owned','boundary-bob@example.com',bob,'Çankaya')).id;
   const fresh=await lead('Same email pending','boundary-alice@example.com');assert.match(fresh.trackingUrl,/^\/hesabim#claim=/);
   const stored=app.locals.db.prepare("SELECT token FROM portal_tokens WHERE inquiryId=? AND purpose='claim'").get(fresh.id) as any;
   assert.equal(stored.token,createHash('sha256').update(fresh.trackingToken).digest('hex'));assert.notEqual(stored.token,fresh.trackingToken);
   const claimed=await req('/api/customer/claim','POST',{token:fresh.trackingToken});assert.equal(claimed.status,200);scoped=cookie(claimed);assert.equal((await claimed.json()).scoped,true);
   const list=await(await req('/api/customer/inquiries','GET',undefined,scoped)).json();assert.deepEqual(list.inquiries.map((i:any)=>i.id),[fresh.id]);
   for(const id of [aliceInquiry,bobInquiry])assert.equal((await req('/api/customer/inquiries/'+id,'GET',undefined,scoped)).status,404);
   assert.equal((await req('/api/customer/claim','POST',{token:fresh.trackingToken})).status,400);
   assert.equal((await req('/api/customer/profile','PUT',{name:'Injected full member'},scoped)).status,403);
   assert.equal((await req('/api/customer/inquiries/'+aliceInquiry,'GET',undefined,bob)).status,404);
   assert.equal((await req('/api/customer/inquiries/'+bobInquiry+'/messages','POST',{message:'Cross-account forged support message'},alice)).status,404);
  });
  await t.test('Private notes stay hidden and private PDF requires the matching owner',async()=>{
   assert.equal((await req('/api/admin/pipeline/'+aliceInquiry,'PATCH',{notes:'PRIVATE_INTERNAL_CANARY',customerMessage:'Safe update',stage:'surveyed'},admin)).status,200);
   const detail=await(await req('/api/customer/inquiries/'+aliceInquiry,'GET',undefined,alice)).json();assert.equal(detail.inquiry.customerMessage,'Safe update');assert.doesNotMatch(JSON.stringify(detail),/PRIVATE_INTERNAL_CANARY/);
   const profile=await req('/api/customer/profile','PUT',{name:'Alice Boundary',role:'admin',status:'suspended',password:'INJECTED_PASSWORD'},alice);assert.equal(profile.status,200);const p=await profile.json();assert.equal(p.customer.status,'active');assert.equal(p.customer.role,undefined);assert.doesNotMatch(JSON.stringify(p),/INJECTED_PASSWORD/);
   const form=new FormData();form.set('document',new Blob([new Uint8Array(await pdf())],{type:'application/pdf'}),'Private-proposal.pdf');
   const upload=await fetch(base+'/api/admin/pipeline/'+aliceInquiry+'/documents?kind=quote',{method:'POST',headers:{Cookie:admin},body:form});assert.equal(upload.status,201);const id=(await upload.json()).document.id;const path='/api/customer/documents/'+id+'/download';
   assert.equal((await req(path)).status,401);for(const auth of [bob,scoped])assert.equal((await req(path,'GET',undefined,auth)).status,404);
   const owned=await req(path,'GET',undefined,alice);assert.equal(owned.status,200);assert.equal(Buffer.from(await owned.arrayBuffer()).subarray(0,5).toString(),'%PDF-');assert.match(owned.headers.get('content-disposition')!,/attachment/);assert.match(owned.headers.get('content-security-policy')!,/sandbox/);assert.match(owned.headers.get('cache-control')!,/no-store/);
   const file=app.locals.db.prepare('SELECT filename FROM portal_documents WHERE id=?').get(id) as any;
   for(const prefix of ['/uploads/','/private-documents/'])assert.equal((await req(prefix+file.filename)).status,404);
  });
  await t.test('Dealer role cannot cross assignments, read account-wide activity or use legacy admin powers',async()=>{
   const dealerIds:string[]=[];for(const [name,region]of [['Boundary dealer one','Etimesgut'],['Boundary dealer two','Çankaya']]){const r=await req('/api/admin/dealers','POST',{name,regions:[region],active:true},admin);assert.equal(r.status,201);dealerIds.push((await r.json()).dealer.id);}
   assert.equal((await req('/api/admin/pipeline/'+aliceInquiry,'PATCH',{dealerId:dealerIds[0]},admin)).status,200);assert.equal((await req('/api/admin/pipeline/'+bobInquiry,'PATCH',{dealerId:dealerIds[1]},admin)).status,200);
   const other=(await lead('Alice other region','boundary-alice@example.com',alice,'Çankaya')).id;assert.equal((await req('/api/admin/pipeline/'+other,'PATCH',{dealerId:dealerIds[1]},admin)).status,200);
   const staffPassword=secret();const staff=await req('/api/admin/staff','POST',{username:'boundary_dealer',password:staffPassword,role:'dealer',dealerId:dealerIds[0]},admin);assert.equal(staff.status,201);dealerStaff=(await staff.json()).staff.id;
   const session=await req('/api/staff/login','POST',{username:'boundary_dealer',password:staffPassword});assert.equal(session.status,200);dealerAuth=cookie(session);
   const list=await(await req('/api/admin/pipeline','GET',undefined,dealerAuth)).json();assert.deepEqual(list.inquiries.map((i:any)=>i.id),[aliceInquiry]);
   assert.equal((await req('/api/admin/pipeline/'+bobInquiry,'PATCH',{stage:'completed'},dealerAuth)).status,403);
   assert.equal((await req('/api/admin/pipeline/'+aliceInquiry,'PATCH',{dealerId:dealerIds[1]},dealerAuth)).status,403);
   for(const path of ['/api/admin/export','/api/admin/inquiries','/api/admin/staff','/api/admin/security'])assert.equal((await req(path,'GET',undefined,dealerAuth)).status,403,path);
   assert.equal((await req('/api/admin/settings','PUT',{companyName:'Unauthorized'},dealerAuth)).status,403);
   assert.equal((await req('/api/admin/staff/'+dealerStaff,'PATCH',{role:'manager',region:'Çankaya'},dealerAuth)).status,403);
   app.locals.db.prepare('INSERT INTO portal_activity(id,customerId,action,detail,createdAt) VALUES(?,?,?,?,?)').run(randomBytes(16).toString('hex'),aliceId,'download','OTHER_REGION_ACTIVITY_CANARY',new Date().toISOString());
   const timeline=await req('/api/admin/customers/'+aliceId+'/activity','GET',undefined,dealerAuth);assert.ok([200,403].includes(timeline.status));if(timeline.status===200)assert.doesNotMatch(await timeline.text(),/OTHER_REGION_ACTIVITY_CANARY/);
  });
  await t.test('Suspension revokes access; recovery is one-use and old sessions/passwords remain invalid',async()=>{
   assert.equal((await req('/api/admin/customers/'+aliceId,'PATCH',{status:'suspended'},admin)).status,200);
   assert.equal((await req('/api/customer/me','GET',undefined,alice)).status,401);
   assert.equal((await req('/api/customer/login','POST',{email:'boundary-alice@example.com',password:alicePassword})).status,401);
   assert.equal((await req('/api/admin/customers/'+aliceId+'/recovery','POST',{},admin)).status,400);
   assert.equal((await req('/api/admin/customers/'+aliceId,'PATCH',{status:'active'},admin)).status,200);assert.equal((await req('/api/customer/me','GET',undefined,alice)).status,401);
   const recovery=await req('/api/admin/customers/'+aliceId+'/recovery','POST',{},admin);assert.equal(recovery.status,200);const payload=await recovery.json();assert.match(payload.url,/^\/hesabim#reset=/);const token=payload.url.split('#reset=')[1];
   const stored=app.locals.db.prepare("SELECT token FROM portal_tokens WHERE customerId=? AND purpose='reset' AND used=0").get(aliceId) as any;assert.notEqual(stored.token,token);
   const freshPassword=secret();const reset=await req('/api/customer/reset','POST',{token,newPassword:freshPassword});assert.equal(reset.status,200);assert.ok(!JSON.stringify(await reset.json()).includes(freshPassword));
   assert.equal((await req('/api/customer/reset','POST',{token,newPassword:freshPassword})).status,400);
   assert.equal((await req('/api/customer/login','POST',{email:'boundary-alice@example.com',password:alicePassword})).status,401);assert.equal((await req('/api/customer/login','POST',{email:'boundary-alice@example.com',password:freshPassword})).status,200);
   assert.notEqual((app.locals.db.prepare('SELECT password FROM portal_customers WHERE id=?').get(aliceId) as any).password,freshPassword);
   assert.equal((await req('/api/admin/staff/'+dealerStaff,'PATCH',{status:'suspended'},admin)).status,200);assert.equal((await req('/api/admin/pipeline','GET',undefined,dealerAuth)).status,401);
  });
 }finally{await new Promise<void>(r=>server.close(()=>r()));app.locals.close();rmSync(dir,{recursive:true,force:true});}
});
