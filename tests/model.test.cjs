'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('../src/model.js'),D=require('../src/data.js'),C=require('../src/career.js');
const baseline=require('./baseline.json');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-11,a+' != '+b);
const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
function payload(){return {schema:'ai-work-human-futures',version:3,modelVersion:D.MODEL_VERSION,careerVersion:D.CAREER_VERSION,evidenceVersion:D.EVIDENCE_VERSION,exportedAt:'2026-10-11T10:00:00.000Z',scenario:{...M.presets.central},outcomes:{...M.outcomePresets.balanced},horizon:2035,seed:D.SEED,timeline:{metric:'actual',threshold:.8,sort:'date'},originPreset:'central'};}
for(const name of Object.keys(M.presets))test('seeded continuous curves match private-input numeric baseline: '+name,()=>{
 const result=M.simulate(M.presets[name]);
 for(const kind of ['actual','technical','human'])for(const q of ['q10','q50','q90'])result.curveQ[kind][q].forEach((v,i)=>near(v,baseline[name].curves[kind][q][i]));
 for(const group of [result.milestoneQ,result.domainQ])for(const q of Object.values(group)){assert.ok(q.q10<=q.q50&&q.q50<=q.q90);assert.ok(q.q50===Infinity||Number.isInteger(q.q50));}
});
test('same inputs and seed reproduce every result; another seed changes paths',()=>{
 const a=M.simulate(M.presets.central,{seed:12});assert.deepEqual(a,M.simulate(M.presets.central,{seed:12}));assert.notDeepEqual(a.curveQ,M.simulate(M.presets.central,{seed:13}).curveQ);
});
test('15 valid domains and all prescribed presets',()=>{assert.equal(M.domains.length,15);assert.equal(M.domains.reduce((s,d)=>s+d.weight,0),100);assert.equal(Object.keys(M.presets).length,6);assert.equal(Object.keys(M.outcomePresets).length,4);for(const d of M.domains)near(d.digital+d.physical,1);});
for(const key of Object.keys(D.controlMeta))test('whole-curve direction and no-effect relationships: '+key,()=>{
 const lo=M.deterministicCurves({...M.presets.central,[key]:0}),hi=M.deterministicCurves({...M.presets.central,[key]:100});
 const dt=avg(hi.technical)-avg(lo.technical),da=avg(hi.actual)-avg(lo.actual),dh=avg(hi.human)-avg(lo.human);
 if(['capability','reliability','feedback','compute','robotics'].includes(key)){assert.ok(dt>0);assert.ok(da>0);assert.ok(dh<0);}
 if(key==='supply'){assert.ok(dt<0);assert.ok(da<0);assert.ok(dh>0);}
 if(key==='adoption'){near(dt,0);assert.ok(da>0);assert.ok(dh<0);}
 if(key==='regulation'){near(dt,0);assert.ok(da<0);assert.ok(dh>0);}
 if(key==='humanPref'){near(dt,0);assert.ok(da<0);assert.ok(dh>0);}
 if(key==='newTasks'){near(dt,0);near(da,0);assert.ok(dh>0);}
});
test('censored quantiles never create fabricated dates',()=>{assert.equal(M.dateQuantile([2099,Infinity],.9),Infinity);assert.equal(M.dateQuantile([2099,2100],.5),2099);assert.equal(M.firstYear([0,0],x=>x>0),Infinity);assert.equal(M.formatYear(Infinity),'Not by 2100');});
test('every career has valid normalized task mapping and provenance',()=>{
 assert.equal(D.roles.length,18);assert.equal(new Set(D.roles.map(r=>r.id)).size,18);
 for(const r of D.roles){const t=C.normalizeTasks(r.tasks);near(t.reduce((s,x)=>s+x.share,0),1);if(r.id!=='custom'){assert.match(r.provenance.sourceId,/^\d{2}-\d{4}\.\d{2}$/);assert.ok(r.provenance.sourceURL.startsWith('https://www.onetonline.org/'));assert.equal(r.provenance.accessDate,'2026-10-11');}for(const year of [2030,2035,2040]){const e=C.exposure(r.tasks,M.presets.central,year);assert.ok(e.actual>=0&&e.actual<=e.technical&&e.technical<=1);}}
 assert.equal(C.normalizeTasks([{label:'test',domain:'software',weight:0}]),null);
 assert.equal(C.normalizeTasks([{label:'test',domain:'software',weight:NaN}]),null);
});
test('preparation weights, missing answers, optional denominator and worked example',()=>{
 near(Object.values(D.questions).reduce((s,q)=>s+q.weight,0),1);near(Object.values(C.RESILIENCE_WEIGHTS).reduce((a,b)=>a+b,0),1);
 assert.equal(C.preparedness({}).score,null);
 const answers={use:50,verify:50,skills:50,learning:50};
 const p=C.preparedness(answers);near(p.score,50);near(p.denominator,.85);
 assert.equal(C.resilience(p,{actual:.6},true),48);assert.equal(C.resilience(p,{actual:.6},false),null);
 assert.equal(C.preparedness({...answers,verify:null}).score,null);
 for(const value of [0,100])near(C.preparedness(Object.fromEntries(Object.keys(D.questions).map(k=>[k,value]))).score,value);
 near(C.preparedness({...answers,buffer:0,support:0}).score,42.5);
});
test('career changes exposure and advice, but not personal preparedness',()=>{
 const a=D.roles[0],b=D.roles.find(r=>r.id==='construction'),answers={use:75,verify:50,skills:50,learning:25};
 const ae=C.exposure(a.tasks,M.presets.central,2035),be=C.exposure(b.tasks,M.presets.central,2035);
 assert.ok(ae.actual>be.actual);
 assert.notDeepEqual(C.actions(a,a.tasks,answers,ae),C.actions(b,b.tasks,answers,be));
 assert.equal(C.actions(a,a.tasks,answers,ae).length,3);
 const best=C.preparedness({use:100,verify:100,skills:100,learning:100}),worst=C.preparedness({use:0,verify:0,skills:0,learning:0});
 assert.equal(best.score,100);assert.equal(worst.score,0);assert.ok(C.resilience(worst,be,true)<=25);assert.ok(C.resilience(best,{actual:.99},true)<80);
});
test('strict import round trip, explicit legacy migration and model replay gate',()=>{
 const p=payload(),parsed=C.parseScenario(JSON.stringify(p));assert.deepEqual(parsed.scenario,p.scenario);assert.equal(parsed.horizon,2035);
 const legacy=C.parseScenario(JSON.stringify({version:2,scenario:p.scenario,outcomes:p.outcomes,profile:Object.fromEntries(['ai','domain','runway','assets','legal','income','community','health','civic','offline'].map(k=>[k,0]))}));
 assert.deepEqual(legacy.scenario,p.scenario);assert.equal(legacy.profile,undefined);assert.match(legacy.notice,/discarded/);
 assert.throws(()=>C.parseScenario(JSON.stringify({...p,modelVersion:'2.0'})),/cannot be replayed/);
});
test('invalid structures and values reject before application',()=>{
 const cases=[null,[],{}, {...payload(),junk:1},{...payload(),version:99},{...payload(),seed:-1},{...payload(),horizon:2036},{...payload(),timeline:{metric:'invalid',threshold:.8,sort:'date'}},{...payload(),scenario:{...payload().scenario,capability:'70'}},{...payload(),scenario:{...payload().scenario,supply:101}},{...payload(),scenario:{...payload().scenario,supply:null}}];
 for(const p of cases)assert.throws(()=>C.parseScenario(JSON.stringify(p)));
 assert.throws(()=>C.parseScenario('x'.repeat(65537)),/64 KiB/);
 assert.throws(()=>C.parseScenario(JSON.stringify(payload()).replace('"capability":55','"capability":1e400')));
 assert.throws(()=>C.parseScenario(JSON.stringify(payload()).replace('"scenario":{','"scenario":{"__proto__":{},')));
});
test('profile schema accepts unscored hostile text as data, rejects bad task/answer shapes',()=>{
 const r=D.roles[0],p={roleId:r.id,alternativeId:'',tasks:r.tasks,confirmed:true,answers:{use:50,verify:50,skills:50,learning:50},note:'<img src=x onerror=alert(1)>'};
 assert.equal(C.parseScenario(JSON.stringify({...payload(),profile:p})).profile.note,p.note);
 assert.throws(()=>C.profilePayload({...p,answers:{use:12}}));
 assert.throws(()=>C.profilePayload({...p,tasks:[{label:'x',domain:'unknown',weight:20}]}));
 assert.throws(()=>C.profilePayload({...p,note:'x'.repeat(401)}));
});
test('build is offline and has no networking or private source copies',()=>{
 const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 assert.equal(html,fs.readFileSync(require('node:path').join(__dirname,'../ai-work-human-futures-offline.html'),'utf8'));
 assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+href=["']https?:|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|WebSocket/);
 assert.doesNotMatch(html,/profileMeta|profileState|personalized to|Sources checked 10 October|Loading model/);
 assert.match(html,/not a prediction of keeping your job/);
});
