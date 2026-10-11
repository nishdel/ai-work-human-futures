'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium,firefox}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=path.resolve(__dirname,'..'),D=require('../src/data.js'),M=require('../src/model.js');
const out=process.env.QA_OUTPUT_DIR||path.join(root,'.qa');
fs.mkdirSync(out,{recursive:true});
const kind=process.env.QA_BROWSER||'chromium',api=kind==='firefox'?firefox:chromium;
const results={browser:kind,checks:[],timings:[],errors:[],requests:[],mode:'offline file://, network disabled; localhost subpath; viewport emulation'};
function pass(s){results.checks.push(s);console.log('PASS',s);}
(async()=>{
const browser=await api.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
try{
const context=await browser.newContext({viewport:{width:1440,height:1000},offline:true,acceptDownloads:true});
const page=await context.newPage();
page.on('pageerror',e=>results.errors.push(e.message));
page.on('request',r=>{if(/^https?:/.test(r.url()))results.requests.push({url:r.url(),method:r.method()});});
await page.addInitScript(()=>{window.testCalls=0;window.testErrors=[];});
const url=pathToFileURL(path.join(root,'ai-work-human-futures-offline.html')).href;
await page.goto(url);
const updated=()=>page.waitForFunction(()=>document.querySelector('#update-status').textContent.startsWith('Updated'),null,{timeout:20000});
await updated();
results.timings.push(await page.locator('#update-status').textContent());
assert.equal(await page.locator('svg').count(),3);assert.equal(await page.locator('#domain-select option').count(),15);
assert.equal(await page.locator('#career-role').inputValue(),'');assert.match(await page.locator('#career-results').textContent(),/Choose a role/);pass('Offline file starts with 3 charts, 15 domains and unanswered profile');
await page.evaluate(()=>{const original=FuturesModel.simulateSteps;FuturesModel.simulateSteps=function*(...args){window.testCalls++;return yield*original(...args);};});
assert.equal(await page.locator('input[type=range]').count(),18);
const controls=await page.locator('input[type=range]').evaluateAll(els=>els.map(e=>({id:e.id,label:!!document.querySelector('label[for="'+e.id+'"]'),endpoints:e.nextElementSibling.classList.contains('endpoints'),ends:e.nextElementSibling.children.length,value:document.querySelector('#'+e.id+'-value').textContent,help:!!document.querySelector('#glossary-'+e.id),described:!!e.getAttribute('aria-describedby')})));
controls.forEach(c=>assert.ok(c.label&&c.endpoints&&c.ends===2&&c.help&&c.described&&c.value.includes('/ 100')));
for(const c of controls){
 await page.locator('#control-'+c.id+' .explain').click();
 assert.equal(await page.locator('#glossary-'+c.id).getAttribute('open'),'');
 await page.locator('[data-return="'+c.id+'"]').click();
 assert.equal(await page.evaluate(()=>document.activeElement.id),c.id);
}
pass('All 18 sliders have live interpretation, endpoints, labels and keyboard/touch-accessible glossary/return links');
await page.locator('#capability').focus();await page.keyboard.press('ArrowRight');
assert.equal(await page.locator('#capability').inputValue(),'56');assert.match(await page.locator('#scenario-summary').textContent(),/Custom scenario — modified from Central continuation/);
await updated();pass('Keyboard slider changes mark a custom scenario');
for(const [id,expected] of Object.entries(M.presets)){
 await page.locator('[data-preset="'+id+'"]').click();await updated();
 const vals=await page.locator('.sidebar input[type=range]').evaluateAll(es=>Object.fromEntries(es.map(e=>[e.id,+e.value])));
 assert.deepEqual(vals,expected);
 assert.match(await page.locator('#scenario-summary').textContent(),new RegExp(D.scenarioInfo[id].name));
}
pass('All six technology presets load exact original values');
const beforeSocial=await page.evaluate(()=>window.testCalls);
for(const [id,expected] of Object.entries(M.outcomePresets)){
 await page.locator('[data-outcome-preset="'+id+'"]').click();
 const vals=await page.locator('#outcome-controls input').evaluateAll(es=>Object.fromEntries(es.map(e=>[e.id.replace('outcome-',''),+e.value])));
 assert.deepEqual(vals,expected);
}
for(const key of Object.keys(D.outcomeMeta)){
 const previous=await page.locator('#outcome-bars').textContent();
 await page.locator('#outcome-'+key).fill('0');await page.locator('#outcome-'+key).dispatchEvent('input');
 const low=await page.locator('#outcome-bars').textContent();
 await page.locator('#outcome-'+key).fill('100');await page.locator('#outcome-'+key).dispatchEvent('input');
 const high=await page.locator('#outcome-bars').textContent();assert.notEqual(low,high,key);
}
assert.equal(await page.evaluate(()=>window.testCalls),beforeSocial);pass('Four social presets and all eight social factors work without global reruns');
await page.locator('[data-preset="central"]').click();await updated();
const scenarioBefore=await page.locator('.sidebar input[type=range]').evaluateAll(es=>es.map(e=>e.value));
const beforeProfile=await page.evaluate(()=>window.testCalls);
for(const role of D.roles){
 await page.locator('#career-role').selectOption(role.id);
 assert.match(await page.locator('#role-intro').textContent(),new RegExp(role.intro.slice(0,15)));
 assert.equal(await page.locator('.task-row').count(),3);
 assert.match(await page.locator('#career-results').textContent(),/Incomplete/);
}
await page.locator('#career-role').selectOption('software');await page.locator('#confirm-tasks').check();
for(const k of ['use','verify','skills','learning'])await page.locator('#answer-'+k).selectOption('50');
assert.doesNotMatch(await page.locator('#career-results').textContent(),/Incomplete/);
assert.match(await page.locator('#career-results').textContent(),/Personal preparedness: 50/);
const currentScore=await page.locator('#career-results .career-stat b').allTextContents();
await page.locator('#alternative-role').selectOption('construction');
const alternativeScore=await page.locator('#career-comparison .career-stat b').allTextContents();
assert.notDeepEqual(currentScore,alternativeScore);
assert.equal(await page.locator('#career-results .priority').count(),3);
await page.locator('#planning-year').selectOption('2040');
assert.notDeepEqual(currentScore,await page.locator('#career-results .career-stat b').allTextContents());
await page.locator('#planning-year').selectOption('2035');
await page.locator('#answer-verify').selectOption('');assert.match(await page.locator('#career-results').textContent(),/Incomplete/);await page.locator('#answer-verify').selectOption('50');
assert.equal(await page.evaluate(()=>window.testCalls),beforeProfile);assert.deepEqual(await page.locator('.sidebar input[type=range]').evaluateAll(es=>es.map(e=>e.value)),scenarioBefore);
pass('All careers/custom selectable; confirmed tasks, missing answers, year and comparison affect outputs without simulation reruns or scenario resets');
await page.locator('#profile-note').evaluate(e=>e.closest('details').open=true);
const hostile='<img src=x onerror="window.injected=true"> & <script>window.injected=true</script>';
await page.locator('#profile-note').fill(hostile);
await page.locator('[data-task-label="0"]').fill(hostile.slice(0,75));
assert.equal(await page.evaluate(()=>window.injected),undefined);assert.equal(await page.locator('#note-preview img,#note-preview script').count(),0);
await page.locator('#confirm-tasks').check();
await page.locator('#export-btn').click();
let exported=JSON.parse(await page.locator('#json-text').inputValue());
assert.equal(exported.profile,undefined);assert.ok(!JSON.stringify(exported).includes('injected'));
await page.locator('#export-profile').check();
const privateJSON=await page.locator('#json-text').inputValue();assert.equal(JSON.parse(privateJSON).profile.note,hostile);
await page.locator('#import-json-btn').click();await updated();
assert.equal(await page.locator('#profile-note').inputValue(),hostile);assert.equal(await page.evaluate(()=>window.injected),undefined);
pass('Hostile biography/task text stays inert; default export excludes profile; explicit profile import round trips');
await page.locator('#export-btn').click();
const originalJSON=await page.locator('#json-text').inputValue();
await page.locator('#json-text').fill('{"schema":"ai-work-human-futures","version":3,"scenario":{"__proto__":{}}}');
await page.locator('#import-json-btn').click();
assert.match(await page.locator('#json-status').textContent(),/Import rejected/);assert.deepEqual(await page.locator('.sidebar input[type=range]').evaluateAll(es=>es.map(e=>e.value)),scenarioBefore);
await page.locator('#json-text').fill(originalJSON);await page.locator('#import-json-btn').click();await updated();
await page.locator('#export-btn').click();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'export-btn');
pass('Malformed import is atomic; valid import works; dialog Escape restores focus');
await page.locator('#export-btn').click();
const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#download-json-btn').click()]);
assert.match(download.suggestedFilename(),/scenario.json$/);await page.locator('#close-json-btn').click();
pass('Scenario download works');
await page.locator('#timeline-metric').selectOption('technical');await updated();
await page.locator('#timeline-threshold').selectOption('0.5');await updated();
await page.locator('#timeline-sort').selectOption('weight');
await page.locator('#domain-select').selectOption('care');assert.match(await page.locator('#domain-detail h3').textContent(),/Care/);
await page.locator('.timeline-row[data-domain="manufacturing"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#domain-select').inputValue(),'manufacturing');
pass('Timeline metric, threshold, sorting and keyboard domain selection work');
await page.evaluate(()=>{window.restoreSim=FuturesModel.simulateSteps;FuturesModel.simulateSteps=function*(){throw new Error('Test failure');};});
const oldMetric=await page.locator('#metric-majority').textContent();
await page.locator('#capability').fill('71');await page.locator('#capability').dispatchEvent('input');
await page.waitForFunction(()=>document.querySelector('#app-error').classList.contains('show'));
assert.equal(await page.locator('#metric-majority').textContent(),oldMetric);
await page.evaluate(()=>FuturesModel.simulateSteps=window.restoreSim);
await page.locator('#recalculate-btn').click();await updated();assert.equal(await page.locator('#app-error').isVisible(),false);
pass('Computation failure retains last valid result and recovers on retry');
await page.evaluate(()=>{window.ticks=0;window.heartbeat=setInterval(()=>window.ticks++,10);});
await page.locator('#capability').fill('23');await page.locator('#capability').dispatchEvent('input');await page.waitForFunction(()=>document.querySelector('#loading').style.display==='block');
for(const v of [22,89,38,74]){await page.locator('#capability').fill(String(v));await page.locator('#capability').dispatchEvent('input');}
await updated();assert.equal(await page.locator('#capability').inputValue(),'74');
const expectedYear=M.formatYear(M.simulate({...M.presets.central,capability:74}).milestoneQ.majority.q50);assert.equal(await page.locator('#metric-majority').textContent(),expectedYear);assert.match(await page.locator('#scenario-summary').textContent(),/Custom/);
assert.ok(await page.evaluate(()=>window.ticks)>5);await page.evaluate(()=>clearInterval(window.heartbeat));
results.timings.push(await page.locator('#update-status').textContent());
await page.locator('#restore-preset').click();await updated();
assert.equal(await page.locator('#capability').inputValue(),'55');
pass('Rapid edits discard stale work, event loop stays responsive and restore works');
await page.locator('#reset-btn').click();await updated();
assert.equal(await page.locator('#career-role').inputValue(),'software');await page.locator('#clear-profile').click();assert.equal(await page.locator('#career-role').inputValue(),'');
assert.equal(await page.locator('#profile-note').inputValue(),'');
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
pass('Reset scenarios preserves profile; clear profile removes answers and note; no persistence');
for(const width of [1440,768,390,320]){
 await page.setViewportSize({width,height:900});
 await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow at '+width);
 for(const id of ['overview','outcomes-section','prepare-section','glossary-section']){await page.locator('#'+id).scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
}
await page.locator('#career-role').selectOption('nursing');await page.locator('#prepare-section h2').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,kind+'-mobile.png')});
await page.setViewportSize({width:1440,height:1000});await page.locator('#clear-profile').click();await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(out,kind+'-desktop.png')});
await page.emulateMedia({media:'print'});assert.equal(await page.locator('.sidebar').isVisible(),false);assert.equal(await page.locator('#global-chart svg').isVisible(),true);assert.equal(await page.locator('#prepare-section').isVisible(),false);await page.emulateMedia({media:'screen'});
pass('Desktop, tablet and 390/320px layouts have no page overflow; print keeps charts and excludes the private profile');
assert.equal(results.requests.length,0);assert.deepEqual(results.errors,[]);
pass('Offline session made zero HTTP requests, transmitted no profile data and had zero uncaught errors');
await context.close();
const web=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
const wp=await web.newPage();const response=await wp.goto(process.env.PREVIEW_URL||'http://127.0.0.1:4178/ai-work-human-futures/');
assert.equal(response.status(),200);
await wp.waitForFunction(()=>document.querySelector('#update-status').textContent.startsWith('Updated'));
await wp.locator('#control-capability .explain').tap();assert.equal(await wp.locator('#glossary-capability').getAttribute('open'),'');
await wp.locator('[data-return="capability"]').tap();
assert.equal(await wp.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
pass('Hosted-style repository subpath loads and touch-emulated glossary works');
await web.close();
}catch(e){results.failure=e.stack;throw e;}
finally{fs.writeFileSync(path.join(out,kind+'-results.json'),JSON.stringify(results,null,2));await browser.close();}
console.log(JSON.stringify({browser:kind,checks:results.checks.length,timings:results.timings,networkRequests:results.requests.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
