import {begin,finish,requireValue,ownKeys,approval,digest} from './guard.mjs';
export const actions=["knowledge.search","knowledge.read","knowledge.list","knowledge.version.read","knowledge.propose-change","knowledge.publish-approved","knowledge.archive-approved"];
const writes=actions.filter(a=>!["knowledge.search","knowledge.read","knowledge.list","knowledge.version.read"].includes(a));
export const initial=organization=>({organization,revision:0,operations:{},history:[],corpus:{}});
export function execute(state,q){const c=begin(state,q,actions,writes);if(c.replay)return {state:c.next,result:c.replay};
 const corpus=c.next.corpus??={};const r=corpus[q.target];
 if(['knowledge.list','knowledge.search'].includes(q.action))return finish(c,q,Object.values(corpus).filter(x=>q.authority.resources.includes(x.id)&&x.published&&!x.archived&&(!q.payload?.query||x.versions[x.published].content.includes(q.payload.query))).map(x=>({id:x.id,version:x.published})));
 if(['knowledge.read','knowledge.version.read'].includes(q.action)){requireValue(r,'KNOWLEDGE_NOT_FOUND');requireValue(q.action==='knowledge.version.read'||!r.archived,'ARCHIVED');const version=q.action==='knowledge.version.read'?q.payload?.version:r.published;requireValue(version&&r.versions[version]&&r.versions[version].status==='published','NOT_PUBLISHED');return finish(c,q,structuredClone(r.versions[version]))}
 if(q.action==='knowledge.propose-change'){ownKeys(q.payload,['version','content','kind','owner']);requireValue(q.payload.version&&typeof q.payload.content==='string'&&['SOP','FAQ','template','manual','criteria','policy'].includes(q.payload.kind)&&q.payload.owner,'CORPUS_FIELDS');const entry=corpus[q.target]??={id:q.target,owner:q.payload.owner,versions:{}};requireValue(entry.owner===q.payload.owner&&!entry.versions[q.payload.version],'VERSION_IMMUTABLE');entry.versions[q.payload.version]={...q.payload,status:'proposed',evidence:q.evidence};return finish(c,q,{id:entry.id,version:q.payload.version,status:'proposed'})}
 requireValue(r&&q.authority.owner===r.owner,'OWNER_AUTHORITY');approval(q);
 if(q.action==='knowledge.publish-approved'){ownKeys(q.payload,['version']);requireValue(r.versions[q.payload.version]?.status==='proposed','PROPOSAL_REQUIRED');r.versions[q.payload.version].status='published';r.published=q.payload.version;r.archived=false;}
 else {ownKeys(q.payload,['version']);requireValue(q.payload.version===r.published,'CURRENT_VERSION_REQUIRED');r.archived=true;}
 return finish(c,q,{id:r.id,published:r.published,archived:r.archived??false});
}
