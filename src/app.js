'use strict';
(()=>{
const M=FuturesModel,D=FuturesData,C=FuturesCareer;
const {START_YEAR,END_YEAR,NEVER,SIMS,domains,presets,outcomePresets,clamp,yearRange,computeParams,domainValues,deterministicCurves,deterministicMilestone,firstYear,formatYear,formatRange,describeValue}=M;
const {controlMeta,outcomeMeta,scenarioInfo,socialInfo}=D;
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let IS_COMPACT=matchMedia('(max-width:720px)').matches;
let state={...presets.central},outcomeState={...outcomePresets.balanced},originPreset='central',socialPreset='balanced';
let selectedDomain='software',lastResults=null,revision=0,updateTimer,resizeTimer,seed=D.SEED,horizon=2035;
let profile=blankProfile(),cache=new Map(),simulationRuns=0,renderCount=0,lastDuration=0,returnFocus=null;
function blankProfile(){return {roleId:'',alternativeId:'',tasks:[],confirmed:false,answers:Object.fromEntries(Object.keys(D.questions).map(k=>[k,null])),note:''};}
function scenarioName(){return (Object.keys(state).some(k=>state[k]!==presets[originPreset][k])?'Custom scenario — modified from ':'')+scenarioInfo[originPreset].name;}
function interpretation(v,m){return v<35?m.low:v>65?m.high:'Middle setting';}
function rangeMarkup(key,m,value){
 return '<div class="control" id="control-'+key+'"><div class="control-head"><label for="'+key+'">'+escapeHTML(m.label)+'</label><output id="'+key+'-value" class="value-pill" for="'+key+'"></output></div><input id="'+key+'" type="range" min="0" max="100" step="1" value="'+value+'" aria-describedby="'+key+'-meaning '+key+'-ends"><div class="endpoints" id="'+key+'-ends"><span>'+escapeHTML(m.low)+'</span><span>'+escapeHTML(m.high)+'</span></div><small id="'+key+'-meaning">'+escapeHTML(m.meaning)+'</small><a class="explain" href="#glossary-'+key+'">Explain<span class="sr-only"> '+escapeHTML(m.label)+'</span></a></div>';
}
function syncRange(key,m,v){
 $('#'+key).value=v;
 $('#'+key+'-value').textContent=v+' / 100 · '+interpretation(v,m);
 $('#'+key).setAttribute('aria-valuetext',v+' out of 100, '+interpretation(v,m));
}
function syncControlUI(){Object.entries(controlMeta).forEach(([k,m])=>syncRange(k,m,state[k]));renderScenarioSummary();}
function renderOutcomeControls(){
 $('#outcome-controls').innerHTML=Object.entries(outcomeMeta).map(([k,m])=>rangeMarkup('outcome-'+k,m,outcomeState[k])).join('');
 Object.entries(outcomeMeta).forEach(([k,m])=>{
 syncRange('outcome-'+k,m,outcomeState[k]);
 $('#outcome-'+k).addEventListener('input',e=>{outcomeState[k]=+e.target.value;syncRange('outcome-'+k,m,outcomeState[k]);socialPreset='';renderSocialSummary();renderOutcomes();});
 });
}
function renderScenarioSummary(){
 $$('.preset').forEach(b=>{b.classList.toggle('active',b.dataset.preset===originPreset&&Object.keys(state).every(k=>state[k]===presets[originPreset][k]));b.setAttribute('aria-pressed',b.classList.contains('active'));});
 const changes=Object.keys(state).filter(k=>state[k]!==presets.central[k]).map(k=>'<li>'+escapeHTML(controlMeta[k].label)+': '+state[k]+' (reference '+presets.central[k]+', '+(state[k]>presets.central[k]?'+':'')+(state[k]-presets.central[k])+')</li>');
 $('#scenario-summary').innerHTML='<h4>'+scenarioName()+'</h4><p class="privacy">'+scenarioInfo[originPreset].description+'</p><details><summary>Actual settings compared with reference</summary>'+(changes.length?'<ul>'+changes.join('')+'</ul>':'<p>All ten settings equal the reference preset.</p>')+'</details><button id="restore-preset" class="btn small">Restore '+scenarioInfo[originPreset].name+'</button><p class="privacy">Technology presets change technology assumptions only. Your social settings and career profile stay as entered.</p>';
 $('#restore-preset').onclick=()=>selectPreset(originPreset);
}
function selectPreset(id){originPreset=id;state={...presets[id]};syncControlUI();renderCareer();updateAll();}
function renderSocialSummary(){
 $$('.outcome-preset').forEach(b=>{b.classList.toggle('active',b.dataset.outcomePreset===socialPreset);b.setAttribute('aria-pressed',b.classList.contains('active'));});
 $('#social-summary').textContent=(socialPreset?socialInfo[socialPreset].name+' — '+socialInfo[socialPreset].description:'Custom social assumptions.')+' These buttons change social assumptions only, not technology or your profile.';
}
function renderGlossary(){
 const all=[...Object.entries(controlMeta),...Object.entries(outcomeMeta).map(([k,m])=>['outcome-'+k,m])];
 $('#glossary').innerHTML=all.map(([k,m])=>'<details id="glossary-'+k+'" class="glossary-entry"><summary>'+escapeHTML(m.label)+'</summary><p><b>Technical term:</b> '+escapeHTML(m.term)+'. '+escapeHTML(m.meaning)+'</p><p><b>Example:</b> '+escapeHTML(m.example)+'</p><p><b>Left → right:</b> '+escapeHTML(m.low)+' → '+escapeHTML(m.high)+'. '+escapeHTML(m.effect)+'</p><p><b>Limitation:</b> '+escapeHTML(m.limit)+'</p><a href="#control-'+k+'" data-return="'+k+'">Return to control</a></details>').join('');
}
function questionMarkup(k,q){
 return '<label class="field">'+escapeHTML(q.label)+'<select id="answer-'+k+'"><option value="">'+(q.required?'Not answered':'Prefer not to answer / skip')+'</option>'+q.options.map(([v,l])=>'<option value="'+v+'">'+escapeHTML(l)+'</option>').join('')+'</select></label>';
}
function renderProfileForm(){
 $('#career-role').value=profile.roleId;$('#alternative-role').value=profile.alternativeId;$('#planning-year').value=horizon;
 $('#profile-note').value=profile.note;$('#note-preview').textContent=profile.note;
 Object.keys(D.questions).forEach(k=>$('#answer-'+k).value=profile.answers[k]??'');
 renderTaskEditor();renderCareer();
}
function renderTaskEditor(){
 const role=D.roles.find(r=>r.id===profile.roleId);$('#task-step').hidden=!role;
 $('#role-intro').textContent=role?role.intro:'No career or preparation answers are assumed.';
 $('#task-editor').innerHTML=profile.tasks.map((t,i)=>'<div class="task-row"><label class="field task-label">Task group '+(i+1)+'<input maxlength="80" type="text" data-task-label="'+i+'" value="'+escapeHTML(t.label)+'"></label><label class="field">Model domain<select data-task-domain="'+i+'">'+domains.map(d=>'<option value="'+d.id+'"'+(t.domain===d.id?' selected':'')+'>'+d.name+'</option>').join('')+'</select></label><label class="field">Relative amount<input type="number" min="0" max="100" step="1" data-task-weight="'+i+'" value="'+t.weight+'"><span class="task-share" data-share="'+i+'"></span></label></div>').join('');
 $$('[data-task-weight]').forEach(el=>el.oninput=()=>{profile.tasks[+el.dataset.taskWeight].weight=el.value===''?NaN:+el.value;profile.confirmed=false;renderCareer();});
 $$('[data-task-label]').forEach(el=>el.oninput=()=>{profile.tasks[+el.dataset.taskLabel].label=el.value;profile.confirmed=false;renderCareer();});
 $$('[data-task-domain]').forEach(el=>el.onchange=()=>{profile.tasks[+el.dataset.taskDomain].domain=el.value;profile.confirmed=false;renderCareer();});
 if(role){const p=role.provenance;
 $('#role-provenance').innerHTML='<p><b>Published context:</b> '+(p.sourceURL?'<a href="'+p.sourceURL+'" target="_blank" rel="noopener noreferrer">'+p.sourceTitle+' · '+p.sourceId+'</a>':'No occupation source for a custom role')+'</p><p>'+escapeHTML(p.scope)+'. '+escapeHTML(p.version)+'. '+(p.accessDate?'Accessed '+p.accessDate+'. Publication date not asserted.':'')+'</p><p><b>Mapping:</b> '+escapeHTML(p.mapping)+'</p><p>Descriptions are adapted from linked occupation context. Source providers do not endorse these mappings or scores.</p>';
 }
}
function renderCareer(){
 const role=D.roles.find(r=>r.id===profile.roleId);
 if(!role){$('#career-results').innerHTML='<p class="notice">Choose a role to explore exposure. Scores remain incomplete until you confirm tasks and answer the required questions.</p>';$('#career-comparison').textContent='';return;}
 const tasksValid=profile.tasks.every(t=>t.label.trim().length>0);
 const normalized=tasksValid?C.normalizeTasks(profile.tasks):null;
 $('#confirm-tasks').checked=profile.confirmed;$('#confirm-tasks').disabled=!normalized;
 $('#task-total').textContent=normalized?'Shares normalized to 100%. Review and confirm to use them in your score.':'Enter nonempty task names and amounts from 0–100 with a positive total.';
 profile.tasks.forEach((t,i)=>{const el=$('[data-share="'+i+'"]');if(el)el.textContent=normalized?(normalized[i].share*100).toFixed(1)+'% of mix':'—';});
 const confirmed=profile.confirmed&&!!normalized;
 $('#personal-intro').hidden=!confirmed;
 $('#personal-intro').textContent=confirmed?'My selected role is '+role.name.toLowerCase()+', combining '+profile.tasks.filter(t=>t.weight>0).map(t=>t.label.toLowerCase()).join(', ')+'.':'';
 const exp=normalized?C.exposure(profile.tasks,state,horizon):null;
 const prep=C.preparedness(profile.answers),score=C.resilience(prep,exp,confirmed);
 const fmt=v=>!Number.isFinite(v)?'—':Math.round(v)+'%';
 const missing=prep.missing.map(k=>D.questions[k].label).join('; ');
 $('#career-results').innerHTML='<div class="kicker">Your planning view · '+horizon+'</div><p class="score-detail">'+escapeHTML(scenarioName())+' · deterministic domain curves · '+(confirmed?'confirmed task mix':'provisional, unconfirmed task mix')+'</p><div class="career-summary"><div class="career-stat"><b>'+fmt(exp?.technical*100)+'</b><span>Technical task capability</span></div><div class="career-stat"><b>'+fmt(exp?.actual*100)+'</b><span>Modeled actual task substitution</span></div><div class="career-stat"><b>'+(score??'Incomplete')+'</b><span>Illustrative resilience · 0–100</span><small>A planning aid, not a prediction of keeping your job.</small></div></div><p class="notice">Task exposure is not an unemployment probability. Preparation and exposure are different: a well-prepared person may still face high exposure.</p><p class="score-detail"><b>Personal preparedness: '+(prep.score==null?'incomplete':Math.round(prep.score)+' / 100')+'.</b> '+(!confirmed?'Confirm your tasks. ':'')+(missing?'Unanswered required questions: '+escapeHTML(missing):'All required questions answered.')+'</p><details><summary>Why these values?</summary><p class="score-detail">Exposure uses your normalized task shares and the selected domains. Preparation is calculated from answers before the composite. '+(score!==null?'Resilience = 0.75 × '+prep.score.toFixed(1)+' + 0.25 × '+(100*(1-exp.actual)).toFixed(1)+' = '+score+' (rounded).':'No composite is assigned while required inputs are incomplete.')+'</p><ul class="score-detail">'+prep.components.map(c=>'<li>'+escapeHTML(c.label)+': '+c.value+' / 100, '+(c.weight*100).toFixed(1)+'% of answered weight, contribution '+c.contribution.toFixed(1)+'</li>').join('')+'</ul><p class="score-detail">Omitted: '+(prep.omitted.map(k=>escapeHTML(D.questions[k].label)).join('; ')||'none')+'. '+(prep.missing.length?'These partial contributions are provisional.':'Optional omissions renormalize the denominator to '+prep.denominator.toFixed(2)+'.')+'</p><p class="score-detail">Source coverage: '+(role.id==='custom'?'custom mapping has no occupation reference.':'one U.S. occupation reference; all three share estimates and domain mappings are author assumptions.')+' Sensitivity is explored by changing tasks/scenarios, not a statistical confidence interval.</p></details><h3>Three practical next steps</h3><ol class="priority-list">'+actionMarkup(role,profile.tasks,prep,exp)+'</ol>';
 const alt=D.roles.find(r=>r.id===profile.alternativeId);
 if(alt){const ae=C.exposure(alt.tasks,state,horizon),as=C.resilience(prep,ae,confirmed);
 $('#career-comparison').innerHTML='<h3>Alternative: '+escapeHTML(alt.name)+'</h3><p class="score-detail">Illustrative default task shares: '+alt.tasks.map(t=>escapeHTML(t.label)+' '+t.weight+'%').join(' · ')+'. Same '+horizon+' scenario and preparation answers.</p><div class="career-summary"><div class="career-stat"><b>'+fmt(ae.technical*100)+'</b><span>Technical capability</span></div><div class="career-stat"><b>'+fmt(ae.actual*100)+'</b><span>Actual substitution</span></div><div class="career-stat"><b>'+(as??'Incomplete')+'</b><span>Illustrative resilience</span><small>A planning aid, not a prediction of keeping your job.</small></div></div><p class="score-detail">Personal preparedness stays '+(prep.score==null?'incomplete':Math.round(prep.score))+'; the exposure component changes. <a href="'+alt.provenance.sourceURL+'" target="_blank" rel="noopener noreferrer">O*NET source '+alt.provenance.sourceId+'</a> · author-assumed shares.</p><details><summary>Preparation actions for this alternative</summary><ol class="priority-list">'+actionMarkup(alt,alt.tasks,prep,ae)+'</ol></details>';
 }else $('#career-comparison').textContent='';
}
function actionMarkup(role,tasks,prep,exp){
 return C.actions(role,tasks,profile.answers,exp).map((a,i)=>'<li class="priority"><div class="priority-head"><h4>'+escapeHTML(a.title)+'</h4><span class="priority-rank">'+(i+1)+'</span></div><p>'+escapeHTML(a.text)+'</p><p>'+escapeHTML(a.reason)+'</p></li>').join('');
}
function renderEvidence(){
 const age=Math.max(0,Math.floor((Date.now()-Date.parse(D.EVIDENCE_VERSION+'T00:00:00Z'))/86400000));
 $('#evidence-status').textContent='Verified snapshot: '+D.EVIDENCE_VERSION+' ('+age+' days old). Model '+D.MODEL_VERSION+'. Automatic updates: disabled. Latest included publication: 29 September 2025.';
 $('#evidence-cards').innerHTML=D.evidence.map(e=>'<article class="evidence-card"><span class="tag">'+e.kind+'</span><h3>'+e.title+'</h3><a target="_blank" rel="noopener noreferrer" href="'+e.url+'">'+e.publisher+'</a><p>Published '+e.published+' · reviewed '+e.reviewed+'</p><p>'+e.eventNote+'</p><p>'+e.summary+'</p><div class="tag-row">'+e.tags.map(t=>'<span class="tag">'+t+'</span>').join('')+'</div><p><b>Limitations:</b> '+e.limitation+'</p><p><b>Model impact: '+e.impact+'</b></p></article>').join('');
}
function renderSensitivity(){
 const host=$('#sensitivity');let key='post25',base=deterministicMilestone(state,key);
 if(!Number.isFinite(base)){key='weighted80';base=deterministicMilestone(state,key);}
 const useDates=Number.isFinite(base),rows=[];
 for(const [k,m] of Object.entries(controlMeta)){
 const lo={...state,[k]:clamp(state[k]-15,0,100)},hi={...state,[k]:clamp(state[k]+15,0,100)};
 if(useDates){
 const a=deterministicMilestone(lo,key),b=deterministicMilestone(hi,key);
 rows.push({label:m.label,low:Number.isFinite(a)?a-base:null,high:Number.isFinite(b)?b-base:null});
 }else{
 const i=2035-START_YEAR,b=deterministicCurves(state).actual[i]*100;
 rows.push({label:m.label,low:deterministicCurves(lo).actual[i]*100-b,high:deterministicCurves(hi).actual[i]*100-b});
 }
 }
 rows.sort((a,b)=>Math.max(Math.abs(b.low||0),Math.abs(b.high||0))-Math.max(Math.abs(a.low||0),Math.abs(a.high||0)));
 const max=Math.max(1,...rows.flatMap(r=>[Math.abs(r.low||0),Math.abs(r.high||0)]));
 const target=useDates?(key==='post25'?'remaining human work ≤25%':'80% weighted task substitution (fallback: the 25% remaining-work threshold is not reached)'):'actual substitution in 2035, percentage-point change (fallback: neither date threshold is reached)';
 host.innerHTML='<p class="notice">Metric: '+target+'. Lower and higher settings each move 15 points, bounded to 0–100. “Not reached” is never subtracted as a year.</p>'+rows.map(r=>{
 const vals=[r.low,r.high].filter(x=>x!==null),neg=Math.max(0,...vals.map(x=>-x)),pos=Math.max(0,...vals);
 const f=v=>v===null?'not reached by 2100':(v>0?'+':'')+(useDates?v:v.toFixed(1))+(useDates?' years':' pp');
 return '<div class="sensitivity-row"><span class="sensitivity-label">'+escapeHTML(r.label)+'</span><div><div class="sensitivity-track"><span class="sensitivity-mid"></span><span class="sens-bar sens-earlier" style="width:'+neg/max*48+'%"></span><span class="sens-bar sens-later" style="width:'+pos/max*48+'%"></span></div><small class="score-detail">Lower: '+f(r.low)+' · Higher: '+f(r.high)+'</small></div></div>';
 }).join('');
}
function renderAssumptions(){
 $('#assumption-body').innerHTML=domains.map(d=>'<tr><td>'+d.name+'</td><td>'+d.weight+'%</td><td>'+Math.round(d.digital*100)+'%</td><td>'+Math.round(d.physical*100)+'%</td><td>'+Math.round(d.reg*100)+'</td><td>'+Math.round(d.pref*100)+'</td><td>'+d.cog+'</td><td>'+d.robot+'</td></tr>').join('');
 $('#sources').innerHTML='<p class="privacy">All domain dates, weights, ceilings and social equations are illustrative author assumptions. Linked research gives context; it does not validate these numbers. O*NET supplies occupation descriptions, not exposure scores; ILO research is a separate source.</p>'+D.evidence.map(e=>'<div class="source"><b>'+e.publisher+' · '+e.title+'</b><p>'+e.published+' · accessed 2026-10-11</p><a href="'+e.url+'" target="_blank" rel="noopener noreferrer">'+e.url+'</a></div>').join('')+'<div class="source"><b>O*NET occupation context</b><p>This application adapts occupational descriptions from O*NET OnLine. O*NET® is a trademark of the U.S. Department of Labor, Employment and Training Administration. Used under CC BY 4.0. Task shares and model mappings are our modifications. No endorsement is implied. Individual role links are shown in the profile.</p><a target="_blank" rel="noopener noreferrer" href="https://www.onetonline.org/help/license">O*NET attribution and data terms</a> · <a target="_blank" rel="noopener noreferrer" href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></div>';
 const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Exact social weighting equations (author assumptions)';details.append(summary);const pre=document.createElement('pre');pre.className='method-equations';pre.textContent=computeOutcomeWeights.toString();details.append(pre);$('#sources').after(details);
 $('#weight-table').innerHTML='<table><thead><tr><th>Preparation component</th><th>Base weight</th><th>Input</th></tr></thead><tbody>'+Object.values(D.questions).map(q=>'<tr><td>'+q.label+'</td><td>'+q.weight*100+'%</td><td>'+(q.required?'Required':'Optional')+'</td></tr>').join('')+'</tbody></table>';
}
function setStatus(t){$('#update-status').textContent=t;}
function showError(e){$('#app-error-text').textContent=(e?.message||String(e))+'. Last valid results are retained; correct the input and retry.';$('#app-error').classList.add('show');setStatus('Update failed — last valid results retained.');}
function clearError(){$('#app-error').classList.remove('show');}
function scheduleUpdate(){revision++;clearTimeout(updateTimer);setStatus('Updating scenario — charts retain the last completed result.');updateTimer=setTimeout(updateAll,180);}
async function updateAll(){
 clearTimeout(updateTimer);const token=++revision;clearError();
 const snapshot={...state},options={timelineMetric:$('#timeline-metric').value,timelineThreshold:+$('#timeline-threshold').value,seed};
 const key=JSON.stringify([snapshot,options]);const start=performance.now();$('#loading').style.display='block';
 setStatus('Updating scenario — charts retain the last completed result.');
 try{
 let result=cache.get(key);
 if(!result){
 simulationRuns++;const it=M.simulateSteps(snapshot,options);let step;
 do{step=it.next();if(!step.done){await new Promise(r=>setTimeout(r,0));if(token!==revision)return;}}while(!step.done);
 result=step.value;if(token!==revision)return;
 cache.set(key,result);if(cache.size>8)cache.delete(cache.keys().next().value);
 }
 if(token!==revision)return;
 lastResults=result;
 renderMetrics();renderGlobalChart();renderTimeline();renderDomainDetail();renderSensitivity();renderOutcomes();renderCareer();renderCount++;
 lastDuration=Math.round(performance.now()-start);
 setStatus('Updated in '+lastDuration+' ms · '+SIMS+' seeded paths · '+scenarioName());
 }catch(e){if(token===revision)showError(e);}
 finally{if(token===revision)$('#loading').style.display='none';}
}
function scenarioPayload(includeProfile=false){
 const p={schema:'ai-work-human-futures',version:3,modelVersion:D.MODEL_VERSION,careerVersion:D.CAREER_VERSION,evidenceVersion:D.EVIDENCE_VERSION,exportedAt:new Date().toISOString(),scenario:{...state},outcomes:{...outcomeState},horizon,seed,timeline:{metric:$('#timeline-metric').value,threshold:+$('#timeline-threshold').value,sort:$('#timeline-sort').value},originPreset};
 if(includeProfile)p.profile=C.profilePayload(profile);
 return p;
}
function applyImportedText(text){
 const p=C.parseScenario(text); // Full validation precedes every mutation.
 state=p.scenario;outcomeState=p.outcomes;originPreset=p.originPreset;seed=p.seed;horizon=p.horizon;socialPreset='';
 $('#timeline-metric').value=p.timeline.metric;$('#timeline-threshold').value=p.timeline.threshold;$('#timeline-sort').value=p.timeline.sort;
 if(p.profile)profile=p.profile;
 syncControlUI();renderOutcomeControls();renderSocialSummary();renderProfileForm();updateAll();
 $('#import-notice').textContent=p.notice;return p.notice;
}
function refreshExport(){try{$('#json-text').value=JSON.stringify(scenarioPayload($('#export-profile').checked),null,2);$('#json-status').textContent=$('#export-profile').checked?'Contains personal information. Share only with people you choose.':'Scenario only: biography, role and preparation answers excluded.';}catch(e){$('#export-profile').checked=false;$('#json-text').value=JSON.stringify(scenarioPayload(false),null,2);$('#json-status').textContent='Profile not included: '+e.message;}}
function openJsonPanel(){returnFocus=document.activeElement;$('#export-profile').checked=false;refreshExport();$('#json-panel').classList.add('open');$('.layout').inert=true;$('.hero').inert=true;$('.top-nav').inert=true;$('#json-text').focus();}
function closeJsonPanel(){$('#json-panel').classList.remove('open');$('.layout').inert=false;$('.hero').inert=false;$('.top-nav').inert=false;returnFocus?.focus();}
function initialize(){
 Object.entries(controlMeta).forEach(([k,m])=>{$('#'+k).closest('.control').outerHTML=rangeMarkup(k,m,state[k]);});
 $$('.preset').forEach(b=>{const info=scenarioInfo[b.dataset.preset];b.innerHTML=info.name+'<small>'+info.subtitle+'</small>';b.onclick=()=>selectPreset(b.dataset.preset);});
 const summary=document.createElement('div');summary.id='scenario-summary';$('#preset-grid').after(summary);
 const guide=document.createElement('details');guide.id='scenario-guide';guide.innerHTML='<summary>Explain all six presets</summary>'+Object.values(scenarioInfo).map(s=>'<details><summary>'+s.name+'</summary><p>'+s.description+'</p></details>').join('');summary.after(guide);
 const social=document.createElement('p');social.id='social-summary';social.className='notice';$('#outcomes-section .section-title').after(social);
 $$('.outcome-preset').forEach(b=>{const i=socialInfo[b.dataset.outcomePreset];b.innerHTML=i.name+'<small>'+i.subtitle+'</small>';b.onclick=()=>{socialPreset=b.dataset.outcomePreset;outcomeState={...outcomePresets[socialPreset]};renderOutcomeControls();renderSocialSummary();renderOutcomes();};});
 const socialGuide=document.createElement('details');socialGuide.innerHTML='<summary>Explain the four social presets</summary>'+Object.values(socialInfo).map(s=>'<p><b>'+s.name+':</b> '+s.description+'</p>').join('');social.after(socialGuide);
 $('#domain-select').innerHTML=domains.map(d=>'<option value="'+d.id+'">'+d.name+'</option>').join('');
 $('#career-role').innerHTML+='<option disabled>Digital, physical and people-facing work</option>'+D.roles.map(r=>'<option value="'+r.id+'">'+r.name+'</option>').join('');
 $('#alternative-role').innerHTML+=D.roles.filter(r=>r.id!=='custom').map(r=>'<option value="'+r.id+'">'+r.name+'</option>').join('');
 for(const [k,q] of Object.entries(D.questions))$(q.required?'#questionnaire':'#optional-questions').insertAdjacentHTML('beforeend',questionMarkup(k,q));
 const note=document.createElement('p');note.id='import-notice';note.className='status-line';note.setAttribute('role','status');$('#update-status').after(note);
 Object.entries(controlMeta).forEach(([k,m])=>$('#'+k).addEventListener('input',e=>{state[k]=+e.target.value;syncRange(k,m,state[k]);renderScenarioSummary();renderCareer();renderOutcomes();scheduleUpdate();}));
 ['timeline-metric','timeline-threshold'].forEach(id=>$('#'+id).onchange=updateAll);
 $('#timeline-sort').onchange=()=>lastResults&&renderTimeline();
 $('#domain-select').onchange=e=>{selectedDomain=e.target.value;if(lastResults){renderTimeline();renderDomainDetail();}};
 $('#career-role').onchange=e=>{profile.roleId=e.target.value;profile.tasks=D.roles.find(r=>r.id===profile.roleId)?.tasks.map(t=>({...t}))||[];profile.confirmed=false;renderTaskEditor();renderCareer();};
 $('#alternative-role').onchange=e=>{profile.alternativeId=e.target.value;renderCareer();};
 $('#planning-year').onchange=e=>{horizon=+e.target.value;renderCareer();};
 $('#confirm-tasks').onchange=e=>{profile.confirmed=e.target.checked;renderCareer();};
 Object.keys(D.questions).forEach(k=>$('#answer-'+k).onchange=e=>{profile.answers[k]=e.target.value===''?null:+e.target.value;renderCareer();});
 $('#profile-note').oninput=e=>{profile.note=e.target.value;$('#note-preview').textContent=profile.note;};
 $('#clear-profile').onclick=()=>{profile=blankProfile();renderProfileForm();};
 $('#recalculate-btn').onclick=updateAll;
 $('#reset-btn').textContent='Reset scenarios';
 $('#reset-btn').onclick=()=>{state={...presets.central};originPreset='central';outcomeState={...outcomePresets.balanced};socialPreset='balanced';seed=D.SEED;syncControlUI();renderOutcomeControls();renderSocialSummary();renderCareer();updateAll();};
 $('#print-btn').onclick=()=>window.print();
 $$('[data-scroll]').forEach(b=>b.onclick=()=>$(b.dataset.scroll).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'}));
 $('#export-btn').onclick=openJsonPanel;$('#export-profile').onchange=refreshExport;
 $('#close-json-btn').onclick=closeJsonPanel;
 $('#json-panel').onclick=e=>{if(e.target===$('#json-panel'))closeJsonPanel();};
 $('#copy-json-btn').onclick=async()=>{try{await navigator.clipboard.writeText($('#json-text').value);$('#json-status').textContent='Copied.';}catch{$('#json-text').select();$('#json-status').textContent='Use your browser Copy command on the selected JSON.';}};
 $('#download-json-btn').onclick=()=>{const url=URL.createObjectURL(new Blob([$('#json-text').value],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='ai-work-human-futures-scenario.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('#import-json-btn').onclick=()=>{try{applyImportedText($('#json-text').value);closeJsonPanel();}catch(e){$('#json-status').textContent='Import rejected: '+e.message;}};
 $('#import-btn').onclick=()=>$('#import-file').click();
 $('#import-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>65536)throw new Error('Scenario file must be at most 64 KiB.');applyImportedText(await f.text());}catch(err){showError(err);}finally{e.target.value='';}};
 document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const target=$(a.getAttribute('href'));if(target?.tagName==='DETAILS')target.open=true;if(a.dataset.return){e.preventDefault();const input=$('#'+a.dataset.return);input.closest('.control').scrollIntoView({block:'center',behavior:'instant'});input.focus({preventScroll:true});}});
 document.addEventListener('keydown',e=>{
 if(!$('#json-panel').classList.contains('open'))return;
 if(e.key==='Escape'){closeJsonPanel();return;}
 if(e.key==='Tab'){const focusables=$$('#json-panel button,#json-panel input,#json-panel textarea');const first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 });
 window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{IS_COMPACT=matchMedia('(max-width:720px)').matches;if(lastResults){renderGlobalChart();renderTimeline();renderDomainDetail();}},150);});
 renderGlossary();renderEvidence();syncControlUI();renderOutcomeControls();renderSocialSummary();renderProfileForm();renderAssumptions();updateAll();
}
// Reused baseline chart renderers are inserted here by the build.
/*__CHARTS__*/
try{initialize();}catch(e){showError(e);}
})();
