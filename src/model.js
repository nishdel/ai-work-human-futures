'use strict';
(function(root){
  const START_YEAR = 2026;
  const END_YEAR = 2100;
  const NEVER = Infinity;
  const SIMS = 240;

  const domains = [
    {id:'software', name:'Software & AI R&D', weight:5, digital:.99, physical:.01, cog:2029, rel:2.5, robot:2036, adopt:2.0, reg:.25, pref:.03, max:.99, unc:3, ai:1.0, safety:.55, context:.70, desc:'Highly digital and directly accelerated by better models, but real projects still require context, verification, ownership, and coordination.', signal:'The fastest domain in the model; the binding constraint shifts from raw reasoning to reliability and organizational integration.'},
    {id:'office', name:'Office, admin & customer operations', weight:11, digital:.98, physical:.02, cog:2030, rel:3.0, robot:2038, adopt:3.0, reg:.35, pref:.05, max:.98, unc:4, ai:.8, safety:.50, context:.60, desc:'Structured information work is easy to copy and scale, but permissions, messy systems, exceptions, and accountability slow full replacement.', signal:'Likely to see rapid task compression and fewer entry-level roles before complete job elimination.'},
    {id:'media', name:'Media, marketing & design', weight:4, digital:.97, physical:.03, cog:2028.5, rel:2.0, robot:2037, adopt:2.0, reg:.20, pref:.15, max:.96, unc:3, ai:.7, safety:.25, context:.40, desc:'Generation is already cheap; differentiation moves toward taste, brand, trust, distribution, rights, and human identity.', signal:'Technical capability arrives early, while human-authenticity demand preserves a residual market.'},
    {id:'finance', name:'Finance, accounting & legal', weight:7, digital:.96, physical:.04, cog:2030.5, rel:4.5, robot:2039, adopt:4.5, reg:.85, pref:.12, max:.96, unc:5, ai:.8, safety:.95, context:.80, desc:'Digitized, high-value work is attractive to automate, but errors, auditability, fiduciary duties, and legal accountability matter.', signal:'Competence can arrive years before institutions accept autonomous sign-off.'},
    {id:'science', name:'Science & engineering R&D', weight:6, digital:.78, physical:.22, cog:2032, rel:5.0, robot:2041, adopt:4.0, reg:.50, pref:.08, max:.95, unc:6, ai:1.0, safety:.85, context:.90, desc:'AI can search, model, code, and propose experiments, while laboratory execution, ambiguous goals, and validation remain bottlenecks.', signal:'A major feedback channel: progress here can accelerate progress everywhere else.'},
    {id:'education', name:'Education & training', weight:7, digital:.70, physical:.30, cog:2031.5, rel:4.5, robot:2044, adopt:6.0, reg:.75, pref:.40, max:.94, unc:6, ai:.5, safety:.80, context:.90, desc:'Personalized tutoring can scale quickly, but child safety, motivation, social development, credentialing, and demand for human teachers matter.', signal:'Technical teaching capacity may precede broad substitution by a long margin.'},
    {id:'medicine', name:'Medicine & health care', weight:8, digital:.55, physical:.45, cog:2033, rel:7.0, robot:2046, adopt:8.0, reg:1.0, pref:.35, max:.94, unc:8, ai:.7, safety:1.0, context:1.0, desc:'Diagnosis, documentation, and planning are digitizable; procedures, care, liability, trust, and regulation create a much longer deployment tail.', signal:'High capability does not equal clinical authorization or patient acceptance.'},
    {id:'transport', name:'Transport & logistics', weight:8, digital:.30, physical:.70, cog:2031, rel:5.5, robot:2040, adopt:6.5, reg:.90, pref:.05, max:.97, unc:7, ai:.5, safety:1.0, context:.80, desc:'Routing and dispatch are digital, while autonomy must handle rare physical edge cases, infrastructure, weather, and safety regulation.', signal:'Constrained routes automate earlier than universal autonomy.'},
    {id:'manufacturing', name:'Manufacturing', weight:11, digital:.28, physical:.72, cog:2031.5, rel:4.5, robot:2040, adopt:5.5, reg:.60, pref:.04, max:.98, unc:6, ai:.5, safety:.80, context:.70, desc:'Controlled environments favor robots, but retooling factories, long-lived capital, maintenance, and product variety slow diffusion.', signal:'One of the earliest physical domains, especially in greenfield factories.'},
    {id:'energy', name:'Energy, utilities & extraction', weight:6, digital:.38, physical:.62, cog:2032, rel:5.5, robot:2043, adopt:6.0, reg:.95, pref:.04, max:.97, unc:7, ai:.6, safety:1.0, context:.80, desc:'Optimization is digital, but field maintenance, safety-critical infrastructure, remote sites, and regulation retain humans longer.', signal:'Automation can raise output while preserving human oversight for tail risk.'},
    {id:'agriculture', name:'Agriculture & food production', weight:5, digital:.22, physical:.78, cog:2033.5, rel:5.0, robot:2045, adopt:7.0, reg:.55, pref:.05, max:.95, unc:8, ai:.4, safety:.75, context:.70, desc:'Farms are physically variable, weather-exposed, and capital constrained; large standardized operations automate before small heterogeneous ones.', signal:'Hardware economics and fleet maintenance matter as much as intelligence.'},
    {id:'construction', name:'Construction & maintenance', weight:8, digital:.18, physical:.82, cog:2034.5, rel:6.0, robot:2049, adopt:8.0, reg:.70, pref:.06, max:.93, unc:9, ai:.4, safety:.85, context:.90, desc:'Every site is different, materials deform, spaces are unstructured, and errors can be dangerous—making this a late physical frontier.', signal:'Design automates much earlier than general on-site execution.'},
    {id:'care', name:'Care, hospitality & domestic work', weight:8, digital:.30, physical:.70, cog:2033.5, rel:5.5, robot:2050, adopt:8.0, reg:.75, pref:.50, max:.92, unc:10, ai:.3, safety:.85, context:1.0, desc:'Physical assistance can be automated, but empathy, intimacy, trust, dignity, and preference for human contact create a strong social moat.', signal:'This domain is often the reason “all-domain actual takeover” is not reached by 2100 in human-centered scenarios.'},
    {id:'management', name:'Management, negotiation & governance', weight:4, digital:.92, physical:.08, cog:2032.5, rel:6.5, robot:2041, adopt:7.0, reg:.90, pref:.50, max:.90, unc:8, ai:.8, safety:.95, context:1.0, desc:'Analysis and coordination can be automated, while legitimacy, persuasion, responsibility, coalition-building, and human authority may remain demanded.', signal:'A technically capable system may advise leaders long before societies accept machine rule.'},
    {id:'public', name:'Public safety & defence', weight:2, digital:.55, physical:.45, cog:2031.5, rel:6.5, robot:2044, adopt:7.0, reg:1.0, pref:.30, max:.94, unc:8, ai:.7, safety:1.0, context:.90, desc:'Strong incentives push automation, but escalation risk, law, accountability, and the need for human command constrain legitimate deployment.', signal:'Capability may advance faster than acceptable delegation of lethal or coercive authority.'}
  ];

  const presets = {
    central:{capability:55,reliability:50,feedback:35,compute:55,robotics:45,supply:50,adoption:50,regulation:50,humanPref:55,newTasks:50},
    bottlenecked:{capability:25,reliability:30,feedback:15,compute:35,robotics:25,supply:70,adoption:35,regulation:65,humanPref:65,newTasks:65},
    rapid:{capability:90,reliability:85,feedback:90,compute:85,robotics:70,supply:25,adoption:80,regulation:25,humanPref:30,newTasks:25},
    robotics:{capability:65,reliability:65,feedback:50,compute:70,robotics:95,supply:20,adoption:75,regulation:35,humanPref:40,newTasks:40},
    human:{capability:70,reliability:65,feedback:55,compute:70,robotics:60,supply:45,adoption:55,regulation:75,humanPref:90,newTasks:85},
    replacement:{capability:95,reliability:92,feedback:95,compute:90,robotics:92,supply:15,adoption:92,regulation:8,humanPref:0,newTasks:0}
  };

  const outcomePresets = {
    balanced:{safety:55,ownership:45,redistribution:50,democracy:60,transition:50,meaning:55,surveillance:40,coordination:45},
    shared:{safety:82,ownership:85,redistribution:88,democracy:82,transition:85,meaning:82,surveillance:18,coordination:80},
    concentrated:{safety:58,ownership:15,redistribution:18,democracy:32,transition:28,meaning:35,surveillance:78,coordination:35},
    fragile:{safety:30,ownership:28,redistribution:25,democracy:45,transition:20,meaning:38,surveillance:52,coordination:18}
  };

  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const norm = v => (v - 50) / 50;
  const logistic = x => 1 / (1 + Math.exp(-x));
  const yearRange = Array.from({length:END_YEAR-START_YEAR+1}, (_,i)=>START_YEAR+i);

  function mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function normal(rng, mean=0, sd=1) {
    let u=0,v=0;
    while(u===0) u=rng();
    while(v===0) v=rng();
    return mean + sd * Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }
  function quantile(arr, q) {
    if (!arr.length) return NaN;
    const a = [...arr].sort((x,y)=>x-y);
    const pos = (a.length-1)*q;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    if (lo===hi) return a[lo];
    return a[lo] + (a[hi]-a[lo])*(pos-lo);
  }
  function firstYear(values, test) {
    for (let i=0;i<values.length;i++) if (test(values[i])) return START_YEAR+i;
    return NEVER;
  }
  function formatYear(y) {
    if (!Number.isFinite(y) || y > END_YEAR) return 'Not by 2100';
    return String(Math.round(y));
  }
  function formatRange(q10,q90) {
    const a = formatYear(q10), b = formatYear(q90);
    if (a==='Not by 2100' && b==='Not by 2100') return 'Not reached by 2100 in this modeled range';
    if (b==='Not by 2100') return `10th percentile ${a}; upper tail not by 2100`;
    return `Model 10–90% range: ${a}–${b}`;
  }
  function describeValue(v, meta) {
    if (v < 20) return meta.low;
    if (v < 40) return `fairly ${meta.low}`;
    if (v < 60) return 'moderate';
    if (v < 80) return `fairly ${meta.high}`;
    return meta.high;
  }

  function computeParams(d, c, pert={}) {
    const feedbackNorm = (c.feedback - 35) / 65;
    let cogMid = d.cog - 8*norm(c.capability) - 3*norm(c.compute) - 4*feedbackNorm*d.ai + 3*norm(c.supply);
    cogMid += (pert.globalCog||0) + (pert[`${d.id}_cog`]||0);
    let relMid = cogMid + d.rel - 7*norm(c.reliability)*(0.5+0.5*d.safety) + 1.5*norm(c.supply);
    relMid += (pert.globalRel||0) + (pert[`${d.id}_rel`]||0);
    let robotMid = d.robot - 12*norm(c.robotics) - 3*norm(c.compute) + 6*norm(c.supply);
    robotMid += (pert.globalRobot||0) + (pert[`${d.id}_robot`]||0);
    let adoptMid = relMid + d.adopt - 8*norm(c.adoption) + 7*norm(c.regulation)*d.reg + 3*norm(c.supply)*d.physical;
    adoptMid += (pert.globalAdopt||0) + (pert[`${d.id}_adopt`]||0);
    const maxAuto = clamp(d.max + (pert[`${d.id}_max`]||0), .70, .995);
    const cap = maxAuto * (1 - 0.55*d.pref*(c.humanPref/100));
    return {
      cogMid, relMid, robotMid, adoptMid, maxAuto, cap,
      cogWidth:3.0+0.6*d.context,
      relWidth:3.6+1.7*d.safety,
      robotWidth:4.3+1.8*d.context,
      adoptWidth:4.0+1.8*d.reg
    };
  }

  function domainValues(d, year, p, mode='actual') {
    const cog = logistic((year-p.cogMid)/p.cogWidth);
    const rel = logistic((year-p.relMid)/p.relWidth);
    const robot = logistic((year-p.robotMid)/p.robotWidth);
    const embodiment = d.digital + d.physical*robot;
    const technical = p.maxAuto*cog*rel*embodiment;
    if (mode==='technical') return technical;
    const adoption = logistic((year-p.adoptMid)/p.adoptWidth);
    return Math.min(p.cap, technical*adoption);
  }

  function makePerturbations(rng) {
    const p = {};
    const u = rng();
    const regime = u < .10 ? -4 : (u < .25 ? 5 : normal(rng,0,2.5));
    p.globalCog = regime + normal(rng,0,1.5);
    p.globalRel = .6*regime + normal(rng,0,1.5);
    p.globalRobot = .7*regime + normal(rng,0,3.5);
    p.globalAdopt = .5*regime + normal(rng,0,2.5);
    domains.forEach(d => {
      p[`${d.id}_cog`] = normal(rng,0,d.unc*.30);
      p[`${d.id}_rel`] = normal(rng,0,d.unc*.18);
      p[`${d.id}_robot`] = normal(rng,0,d.unc*.42);
      p[`${d.id}_adopt`] = normal(rng,0,d.unc*.22);
      p[`${d.id}_max`] = normal(rng,0,.018);
    });
    return p;
  }

  function* simulateSteps(state, {timelineMetric='actual',timelineThreshold=.8,seed=418762}={}) {
    const curves = {
      actual:yearRange.map(()=>[]),
      technical:yearRange.map(()=>[]),
      human:yearRange.map(()=>[])
    };
    const milestones = {majority:[], weighted80:[], weighted90:[], post25:[], post10:[], allTech80:[], allActual80:[]};
    const domainThresholds = Object.fromEntries(domains.map(d=>[d.id,[]]));
    const rng = mulberry32(seed);

    for (let s=0;s<SIMS;s++) {
      const pert = makePerturbations(rng);
      const params = domains.map(d=>computeParams(d,state,pert));
      const actualCurve=[], technicalCurve=[], humanCurve=[];
      const domainReached = Object.fromEntries(domains.map(d=>[d.id,NEVER]));
      let allTech80=NEVER, allActual80=NEVER;
      const newTaskFloor = (state.newTasks/100)*.30;

      for (let yi=0;yi<yearRange.length;yi++) {
        const year = yearRange[yi];
        let actual=0, technical=0;
        let everyTech80=true, everyActual80=true;
        domains.forEach((d,di)=>{
          const tv = domainValues(d,year,params[di],'technical');
          const av = domainValues(d,year,params[di],'actual');
          technical += d.weight*tv/100;
          actual += d.weight*av/100;
          if (tv < .8) everyTech80=false;
          if (av < .8) everyActual80=false;
          const check = timelineMetric==='technical' ? tv : av;
          if (domainReached[d.id]===NEVER && check>=timelineThreshold) domainReached[d.id]=year;
        });
        const human = (1-actual)+actual*newTaskFloor;
        actualCurve.push(actual); technicalCurve.push(technical); humanCurve.push(human);
        curves.actual[yi].push(actual); curves.technical[yi].push(technical); curves.human[yi].push(human);
        if (allTech80===NEVER && everyTech80) allTech80=year;
        if (allActual80===NEVER && everyActual80) allActual80=year;
      }
      milestones.majority.push(firstYear(actualCurve,v=>v>=.5));
      milestones.weighted80.push(firstYear(actualCurve,v=>v>=.8));
      milestones.weighted90.push(firstYear(actualCurve,v=>v>=.9));
      milestones.post25.push(firstYear(humanCurve,v=>v<=.25));
      milestones.post10.push(firstYear(humanCurve,v=>v<=.10));
      milestones.allTech80.push(allTech80);
      milestones.allActual80.push(allActual80);
      domains.forEach(d=>domainThresholds[d.id].push(domainReached[d.id]));
      if (s % 8 === 7) yield {completed:s+1};
    }

    const curveQ = {};
    ['actual','technical','human'].forEach(k=>{
      curveQ[k]={q10:[],q50:[],q90:[]};
      curves[k].forEach(vals=>{
        curveQ[k].q10.push(quantile(vals,.10));
        curveQ[k].q50.push(quantile(vals,.50));
        curveQ[k].q90.push(quantile(vals,.90));
      });
    });
    const milestoneQ = {};
    Object.entries(milestones).forEach(([k,v])=>milestoneQ[k]={q10:dateQuantile(v,.10),q50:dateQuantile(v,.50),q90:dateQuantile(v,.90),neverShare:v.filter(x=>x>END_YEAR).length/v.length});
    const domainQ = {};
    Object.entries(domainThresholds).forEach(([k,v])=>domainQ[k]={q10:dateQuantile(v,.10),q50:dateQuantile(v,.50),q90:dateQuantile(v,.90),neverShare:v.filter(x=>x>END_YEAR).length/v.length});
    return {curveQ,milestoneQ,domainQ,timelineMetric,timelineThreshold};
  }

  function deterministicCurves(c=presets.central) {
    const params = domains.map(d=>computeParams(d,c,{}));
    const actual=[], technical=[], human=[];
    const floor=(c.newTasks/100)*.30;
    yearRange.forEach(y=>{
      let a=0,t=0;
      domains.forEach((d,i)=>{
        t += d.weight*domainValues(d,y,params[i],'technical')/100;
        a += d.weight*domainValues(d,y,params[i],'actual')/100;
      });
      technical.push(t); actual.push(a); human.push((1-a)+a*floor);
    });
    return {actual,technical,human,params};
  }

  function deterministicMilestone(c=presets.central, key='post25') {
    const curves=deterministicCurves(c);
    if (key==='post25') return firstYear(curves.human,v=>v<=.25);
    if (key==='majority') return firstYear(curves.actual,v=>v>=.5);
    if (key==='weighted80') return firstYear(curves.actual,v=>v>=.8);
    return NEVER;
  }


  function dateQuantile(values,q) {
    const a=[...values].sort((x,y)=>x-y);
    return a[Math.max(0,Math.ceil(q*a.length)-1)];
  }
  function simulate(state,options) {
    const iterator=simulateSteps(state,options); let step;
    do {step=iterator.next();} while(!step.done);
    return step.value;
  }

const api={START_YEAR,END_YEAR,NEVER,SIMS,domains,presets,outcomePresets,clamp,norm,yearRange,computeParams,domainValues,deterministicCurves,deterministicMilestone,firstYear,formatYear,formatRange,describeValue,simulateSteps,simulate,dateQuantile};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FuturesModel=api;
})(globalThis);
