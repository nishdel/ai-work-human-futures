'use strict';
(function(root){
const M=typeof module!=='undefined'&&module.exports?require('./model.js'):root.FuturesModel;
const D=typeof module!=='undefined'&&module.exports?require('./data.js'):root.FuturesData;
const RESILIENCE_WEIGHTS={preparedness:.75,remainingTasks:.25};
function normalizeTasks(tasks){
 const sum=tasks.reduce((s,t)=>s+t.weight,0);
 if(!(sum>0)||tasks.some(t=>!Number.isFinite(t.weight)||t.weight<0||t.weight>100||!M.domains.some(d=>d.id===t.domain)))return null;
 return tasks.map(t=>({...t,share:t.weight/sum}));
}
function exposure(tasks,scenario,year){
 const normalized=normalizeTasks(tasks);if(!normalized)return null;
 return normalized.reduce((r,t)=>{const d=M.domains.find(d=>d.id===t.domain),p=M.computeParams(d,scenario);
 r.technical+=t.share*M.domainValues(d,year,p,'technical');
 r.actual+=t.share*M.domainValues(d,year,p,'actual');return r;},{technical:0,actual:0});
}
function preparedness(answers){
 const missing=Object.entries(D.questions).filter(([k,q])=>q.required&&answers[k]==null).map(([k])=>k);
 const answered=Object.entries(D.questions).filter(([k])=>answers[k]!=null);
 const denominator=answered.reduce((s,[,q])=>s+q.weight,0);
 const components=answered.map(([key,q])=>({key,label:q.label,value:answers[key],weight:q.weight/denominator,contribution:answers[key]*q.weight/denominator}));
 return {score:missing.length||!denominator?null:components.reduce((s,c)=>s+c.contribution,0),missing,denominator,components,omitted:Object.keys(D.questions).filter(k=>answers[k]==null)};
}
function resilience(prep,exp,confirmed){
 if(prep.score==null||!exp||!confirmed)return null;
 return Math.round(RESILIENCE_WEIGHTS.preparedness*prep.score+RESILIENCE_WEIGHTS.remainingTasks*100*(1-exp.actual));
}
function actions(role,tasks,answers,exp){
 const focus=[...tasks].sort((a,b)=>b.weight-a.weight)[0]?.label.toLowerCase()||'your work';
 const candidates=[
 {key:'verify',title:'Build a checking routine',text:'For '+focus+', write a short checklist of trusted references, tests and when a human should take over.'},
 {key:'use',title:'Try one bounded AI workflow',text:'Choose a low-risk part of '+focus+'. Compare time and quality with your usual process; follow workplace rules.'},
 {key:'skills',title:'Make transferable skills visible',text:'Create one small example showing how your '+role.name.toLowerCase()+' skills solve a problem in another setting.'},
 {key:'learning',title:'Make learning time practical',text:'Pick one skill connected to '+focus+' and a realistic practice slot. If time is limited, ask about paid learning or shared resources.'},
 {key:'support',title:'Find one useful source of support',text:'Identify a peer, professional group or practical service that can help with changes in '+role.name.toLowerCase()+'.'},
 {key:'buffer',title:'Map transition constraints',text:'Privately review essential expenses and available benefits or support. Use this to choose feasible learning steps; no investment choice is implied.'},
 {key:'role',title:'Review how the task mix could change',text:'Discuss '+focus+' with someone doing the work. Identify what can be assisted, what needs review and which human responsibilities remain.'}
 ];
 return candidates.map(c=>({...c,priority:c.key==='role'?(.1+(exp?.actual||0)*.3):(100-(answers[c.key]??50))/100*D.questions[c.key].weight,reason:c.key==='role'?'Based on modeled task substitution':answers[c.key]==null?'Unanswered: explore this, no deficit inferred':'Based on your selected answer'})).sort((a,b)=>b.priority-a.priority).slice(0,3);
}
function strictObject(v,keys,name){
 if(!v||typeof v!=='object'||Array.isArray(v))throw new Error(name+' must be an object.');
 for(const k of Object.keys(v))if(!keys.includes(k))throw new Error('Unknown key in '+name+': '+k);
}
function numberMap(v,keys,name){
 strictObject(v,keys,name);
 for(const k of keys)if(typeof v[k]!=='number'||!Number.isFinite(v[k])||v[k]<0||v[k]>100)throw new Error(name+'.'+k+' must be a number from 0 to 100.');
 return Object.fromEntries(keys.map(k=>[k,v[k]]));
}
function profilePayload(p){
 strictObject(p,['roleId','alternativeId','tasks','confirmed','answers','note'],'profile');
 if(!D.roles.some(r=>r.id===p.roleId)&&p.roleId!=='')throw new Error('Unknown role.');
 if(!D.roles.some(r=>r.id===p.alternativeId&&r.id!=='custom')&&p.alternativeId!=='')throw new Error('Unknown alternative role.');
 if(typeof p.confirmed!=='boolean'||typeof p.note!=='string'||p.note.length>400)throw new Error('Invalid profile confirmation or note.');
 if(!Array.isArray(p.tasks)||p.tasks.length>15||(p.roleId&&p.tasks.length===0))throw new Error('Invalid task groups.');
 const tasks=p.tasks.map(t=>{
 strictObject(t,['label','domain','weight'],'task');
 if(typeof t.label!=='string'||!t.label.trim()||t.label.length>80||!M.domains.some(d=>d.id===t.domain)||typeof t.weight!=='number'||!Number.isFinite(t.weight)||t.weight<0||t.weight>100)throw new Error('Invalid task group.');
 return {label:t.label,domain:t.domain,weight:t.weight};});
 if(p.confirmed&&(!p.roleId||!normalizeTasks(tasks)))throw new Error('Confirmed tasks must have a positive total.');
 strictObject(p.answers,Object.keys(D.questions),'answers');
 const answers=Object.fromEntries(Object.entries(D.questions).map(([k,q])=>{
 const v=p.answers[k]??null;
 if(v!==null&&!q.options.some(([score])=>score===v))throw new Error('Invalid answer for '+k);
 return [k,v];}));
 return {roleId:p.roleId,alternativeId:p.alternativeId,tasks,confirmed:p.confirmed,answers,note:p.note};
}
function parseScenario(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>65536)throw new Error('Scenario file must be at most 64 KiB.');
 const p=JSON.parse(text);
 const legacy=p?.version===2;
 strictObject(p,legacy?['version','exportedAt','scenario','outcomes','profile']:['schema','version','modelVersion','careerVersion','evidenceVersion','exportedAt','scenario','outcomes','horizon','seed','timeline','originPreset','profile'],'scenario file');
 if(!legacy&&(p.schema!=='ai-work-human-futures'||p.version!==3))throw new Error('Unsupported scenario schema/version.');
 if(!legacy&&(p.modelVersion!==D.MODEL_VERSION||p.careerVersion!==D.CAREER_VERSION))throw new Error('This model/score version cannot be replayed. Open the matching release; no values were changed.');
 if(p.exportedAt!==undefined&&(typeof p.exportedAt!=='string'||p.exportedAt.length>40||!Number.isFinite(Date.parse(p.exportedAt))))throw new Error('Invalid export date.');
 const scenario=numberMap(p.scenario,Object.keys(M.presets.central),'technology assumptions');
 const outcomes=numberMap(p.outcomes|| (legacy?M.outcomePresets.balanced:null),Object.keys(M.outcomePresets.balanced),'social assumptions');
 let horizon=2035,seed=D.SEED,timeline={metric:'actual',threshold:.8,sort:'date'},originPreset='central',profile;
 if(legacy){
 if(p.profile)numberMap(p.profile,['ai','domain','runway','assets','legal','income','community','health','civic','offline'],'legacy profile');
 }else{
 if(![2030,2035,2040].includes(p.horizon))throw new Error('Unsupported planning year.');
 if(!Number.isInteger(p.seed)||p.seed<0||p.seed>4294967295)throw new Error('Invalid seed.');
 if(typeof p.evidenceVersion!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p.evidenceVersion))throw new Error('Invalid evidence version.');
 if(!Object.hasOwn(D.scenarioInfo,p.originPreset))throw new Error('Unknown source preset.');
 strictObject(p.timeline,['metric','threshold','sort'],'timeline');
 if(!['actual','technical'].includes(p.timeline.metric)||![.5,.8,.9].includes(p.timeline.threshold)||!['date','weight','original'].includes(p.timeline.sort))throw new Error('Invalid timeline selection.');
 ({horizon,seed,timeline,originPreset}=p);
 if(p.profile!==undefined)profile=profilePayload(p.profile);
 }
 return {scenario,outcomes,horizon,seed,timeline,originPreset,profile,notice:legacy?'Legacy v2 assumptions migrated without changing their 0–100 scales. Personal v2 scores were discarded; model v3 uses censored date quantiles, so milestone summaries may differ.':p.evidenceVersion!==D.EVIDENCE_VERSION?'Loaded with current evidence snapshot; numerical model version matches.':'Scenario imported. Profile answers unchanged unless explicitly included.'};
}
const api={RESILIENCE_WEIGHTS,normalizeTasks,exposure,preparedness,resilience,actions,parseScenario,profilePayload};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FuturesCareer=api;
})(globalThis);
