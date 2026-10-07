import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {initial,execute,actions} from '../skills/woia-organization-knowledge/scripts/provider.mjs';
 const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
 const department="Data";
 function request(s,action,payload,approved=false,target='subject',overrides={}){return {organization:s.organization,action,target,payload,operation_id:'op-'+s.revision,expected_revision:s.revision,evidence:{source:'synthetic-source',reference:'synthetic-reference',recorded_at:'2026-10-07T00:00:00Z'},authority:{authenticated:true,current:true,organization:s.organization,actor:'synthetic-actor',policy_revision:'synthetic-policy-1',actions,resources:['subject','other'],fields:['kind','display_name','contact_identifiers'],source_fields:['kind','display_name','contact_identifiers'],department,owner:'Synthetic owner',identity_verified:true,relationship_conflicts_checked:true,...(approved?{approval:{approved:true,current:true,principal:'synthetic-independent-owner',payload_digest:hash(payload),action,target,organization:s.organization,policy_revision:'synthetic-policy-1'}}:{}),...overrides}}}
 function run(s,a,p,approved=false,target='subject',overrides={}){return execute(s,request(s,a,p,approved,target,overrides))}
test('knowledge proposal publication versioning and archival remain distinct',()=>{
 let s=initial('synthetic-org');const p={version:'1',content:'Synthetic SOP',kind:'SOP',owner:'Synthetic owner'};
 s=run(s,'knowledge.propose-change',p).state;
 assert.throws(()=>run(s,'knowledge.read',{}),/NOT_PUBLISHED/);
 s=run(s,'knowledge.publish-approved',{version:'1'},true).state;
 assert.equal(run(s,'knowledge.read',{}).result.content,p.content);
 assert.equal(run(s,'knowledge.version.read',{version:'1'}).result.status,'published');
 assert.equal(run(s,'knowledge.list',{}).result.length,1);
 assert.equal(run(s,'knowledge.search',{query:'SOP'}).result.length,1);
 assert.throws(()=>run(s,'knowledge.propose-change',p),/VERSION_IMMUTABLE/);
 s=run(s,'knowledge.archive-approved',{version:'1'},true).state;
 assert.equal(run(s,'knowledge.list',{}).result.length,0);
 assert.equal(run(s,'knowledge.version.read',{version:'1'}).result.content,p.content);
});
test('knowledge owner approval is exact and does not accept business-state master',()=>{
 let s=run(initial('synthetic-org'),'knowledge.propose-change',{version:'1',content:'SOP',kind:'SOP',owner:'Synthetic owner'}).state;
 assert.throws(()=>run(s,'knowledge.publish-approved',{version:'1'}),/OWNER_AUTHORITY|APPROVAL/);
 assert.throws(()=>run(s,'knowledge.publish-approved',{version:'1'},true,'subject',{owner:'other'}),/OWNER_AUTHORITY/);
 assert.throws(()=>run(s,'knowledge.propose-change',{version:'2',content:'cash',kind:'Payment',owner:'Synthetic owner'}),/CORPUS_FIELDS/);
});
test('organization authentication action resource and provenance guards fail closed',()=>{const s=initial('synthetic-org');const q=request(s,'knowledge.propose-change',{"version":"1","content":"Synthetic SOP","kind":"SOP","owner":"Synthetic owner"});assert.throws(()=>execute(s,{...q,organization:'other-org'}),/ORGANIZATION_SCOPE/);for(const authority of [{...q.authority,authenticated:false},{...q.authority,revoked:true},{...q.authority,current:false},{...q.authority,hold:true}])assert.throws(()=>execute(s,{...q,authority}),/AUTHORITY_REQUIRED/);assert.throws(()=>execute(s,{...q,authority:{...q.authority,resources:[]}}),/RESOURCE_SCOPE/);assert.throws(()=>execute(s,{...q,authority:{...q.authority,actions:[]}}),/ACTION_DENIED/);assert.throws(()=>execute(s,{...q,evidence:{}}),/PROVENANCE_REQUIRED/)});
test('idempotent receipt collision and stale concurrent revision preserve original state',()=>{const s=initial('synthetic-org');const q=request(s,'knowledge.propose-change',{"version":"1","content":"Synthetic SOP","kind":"SOP","owner":"Synthetic owner"});const out=execute(s,q);assert.equal(s.revision,0);assert.deepEqual(execute(out.state,q),out);assert.throws(()=>execute(out.state,{...q,payload:{...q.payload,unexpected:true}}),/OPERATION_CONFLICT/);assert.throws(()=>execute(out.state,{...q,operation_id:'concurrent'}),/REVISION_CONFLICT/);assert.equal(out.state.history.length,1)});

test('caller mutation cannot alter accepted state or saved operation result',()=>{const s=initial('synthetic-org');const q=request(s,'knowledge.propose-change',{version: '1', content: 'Synthetic',kind: 'SOP',owner: 'Synthetic owner'});const out=execute(s,q);const accepted=JSON.stringify(out.state);q.evidence.reference='changed-after';q.payload.injected='changed-after';if(q.payload.contact_identifiers)q.payload.contact_identifiers[0].id='changed-after';out.result.injected='changed-after';assert.equal(JSON.stringify(out.state),accepted)});
