  function svg(tag, attrs={}) {
    const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    return el;
  }
  function pathFrom(points) { return points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' '); }

  function renderMetrics() {
    const m=lastResults.milestoneQ;
    const cards=[
      ['metric-majority','metric-majority-range',m.majority],
      ['metric-postlabor','metric-postlabor-range',m.post25],
      ['metric-alltech','metric-alltech-range',m.allTech80],
      ['metric-allactual','metric-allactual-range',m.allActual80]
    ];
    cards.forEach(([vId,rId,q])=>{
      $('#'+vId).textContent=formatYear(q.q50);
      $('#'+rId).textContent=formatRange(q.q10,q.q90);
    });
  }

  function renderGlobalChart() {
    const host=$('#global-chart'); host.innerHTML='';
    const width=Math.max(IS_COMPACT ? 320 : 620,host.clientWidth||900), height=IS_COMPACT ? 320 : 365;
    const pad={l:56,r:22,t:18,b:42};
    const W=width-pad.l-pad.r,H=height-pad.t-pad.b;
    const x=y=>pad.l+(y-START_YEAR)/(END_YEAR-START_YEAR)*W;
    const yy=v=>pad.t+(1-v)*H;
    const s=svg('svg',{viewBox:`0 0 ${width} ${height}`,class:'chart-svg',role:'img','aria-label':'Automation and human labor demand over time'});

    [0,.25,.5,.75,1].forEach(v=>{
      s.appendChild(svg('line',{x1:pad.l,y1:yy(v),x2:width-pad.r,y2:yy(v),stroke:'#203945','stroke-width':'1'}));
      const t=svg('text',{x:pad.l-9,y:yy(v)+4,fill:'#91a8b0','font-size':'11','text-anchor':'end'}); t.textContent=Math.round(v*100)+'%'; s.appendChild(t);
    });
    for(let yr=2030;yr<=2100;yr+=10){
      s.appendChild(svg('line',{x1:x(yr),y1:pad.t,x2:x(yr),y2:height-pad.b,stroke:'#152c36','stroke-width':'1'}));
      const t=svg('text',{x:x(yr),y:height-15,fill:'#91a8b0','font-size':'11','text-anchor':'middle'}); t.textContent=yr; s.appendChild(t);
    }
    const cq=lastResults.curveQ;
    const upper=yearRange.map((yr,i)=>[x(yr),yy(cq.actual.q90[i])]);
    const lower=[...yearRange].reverse().map((yr,ri)=>{const i=yearRange.length-1-ri;return [x(yr),yy(cq.actual.q10[i])];});
    s.appendChild(svg('path',{d:pathFrom([...upper,...lower])+' Z',fill:'rgba(94,226,192,.14)',stroke:'rgba(94,226,192,.25)','stroke-width':'1'}));
    const lines=[
      {vals:cq.technical.q50,color:'#69bfff',width:2,dash:'6 5'},
      {vals:cq.actual.q50,color:'#5ee2c0',width:3,dash:''},
      {vals:cq.human.q50,color:'#a891ff',width:3,dash:''}
    ];
    lines.forEach(line=>s.appendChild(svg('path',{d:pathFrom(yearRange.map((yr,i)=>[x(yr),yy(line.vals[i])])),fill:'none',stroke:line.color,'stroke-width':line.width,'stroke-dasharray':line.dash,'stroke-linejoin':'round','stroke-linecap':'round'})));

    const overlay=svg('rect',{x:pad.l,y:pad.t,width:W,height:H,fill:'transparent',cursor:'crosshair'});
    const hoverLine=svg('line',{x1:0,y1:pad.t,x2:0,y2:height-pad.b,stroke:'#8098a1','stroke-width':'1','stroke-dasharray':'3 4',visibility:'hidden'});
    s.appendChild(hoverLine); s.appendChild(overlay);
    const tip=$('#tooltip');
    const readout=$('#chart-readout');
    const inspectPoint=ev=>{
      const rect=s.getBoundingClientRect();
      const clientX=ev.clientX ?? (ev.touches && ev.touches[0] ? ev.touches[0].clientX : rect.left);
      const sx=(clientX-rect.left)/Math.max(1,rect.width)*width;
      const yr=Math.round(START_YEAR+clamp((sx-pad.l)/W,0,1)*(END_YEAR-START_YEAR));
      const i=clamp(yr-START_YEAR,0,yearRange.length-1);
      hoverLine.setAttribute('x1',x(yr));hoverLine.setAttribute('x2',x(yr));hoverLine.setAttribute('visibility','visible');
      const html=`<b>${yr}</b><span>Technical ${(cq.technical.q50[i]*100).toFixed(0)}%</span><span>Actual substitution ${(cq.actual.q50[i]*100).toFixed(0)}%</span><span>Human labor demand ${(cq.human.q50[i]*100).toFixed(0)}%</span>`;
      if(readout) readout.innerHTML=html;
      if(ev.pointerType!=='touch' && ev.type!=='pointerdown'){
        tip.innerHTML=html.replaceAll('<span>','<br>').replaceAll('</span>','');
        tip.style.display='block'; tip.style.left=(clientX+12)+'px'; tip.style.top=(ev.clientY+12)+'px';
      } else { tip.style.display='none'; }
    };
    overlay.style.touchAction='pan-y';
    overlay.addEventListener('pointermove',inspectPoint);
    overlay.addEventListener('pointerdown',inspectPoint);
    overlay.addEventListener('pointerleave',()=>{tip.style.display='none';});
    host.appendChild(s);
    inspectPoint({clientX:host.getBoundingClientRect().left + host.clientWidth*.5, clientY:0, pointerType:'touch', type:'pointerdown'});
  }

  function renderTimeline() {
    const host=$('#timeline-chart');host.innerHTML='';
    const width=Math.max(760,host.clientWidth||860);
    const rowH=37, pad={l:245,r:82,t:18,b:34};
    let rows=domains.map(d=>({...d,q:lastResults.domainQ[d.id]}));
    const sort=$('#timeline-sort').value;
    if(sort==='date') rows.sort((a,b)=>a.q.q50-b.q.q50);
    if(sort==='weight') rows.sort((a,b)=>b.weight-a.weight);
    const height=pad.t+pad.b+rowH*rows.length;
    const plotW=width-pad.l-pad.r;
    const x=y=>pad.l+(clamp(y,START_YEAR,END_YEAR+5)-START_YEAR)/(END_YEAR+5-START_YEAR)*plotW;
    const s=svg('svg',{viewBox:`0 0 ${width} ${height}`,class:'chart-svg',role:'img','aria-label':'Domain automation timeline'});
    s.style.width=width+'px';s.style.height=height+'px';
    for(let yr=2030;yr<=2100;yr+=10){
      s.appendChild(svg('line',{x1:x(yr),y1:pad.t,x2:x(yr),y2:height-pad.b,stroke:'#18313b'}));
      const tx=svg('text',{x:x(yr),y:height-10,fill:'#91a8b0','font-size':'10','text-anchor':'middle'});tx.textContent=yr;s.appendChild(tx);
    }
    rows.forEach((d,i)=>{
      const y=pad.t+i*rowH;
      const g=svg('g',{class:`timeline-row${selectedDomain===d.id?' selected':''}`,'data-domain':d.id,tabindex:'0',role:'button','aria-label':`View ${d.name} details`});
      g.appendChild(svg('rect',{class:'row-bg',x:0,y,width,height:rowH-1,rx:7,fill:i%2?'rgba(255,255,255,.012)':'transparent'}));
      const name=svg('text',{x:8,y:y+16,fill:'#d7e7e9','font-size':'11.5','font-weight':'650'});name.textContent=d.name;g.appendChild(name);
      const weight=svg('text',{x:8,y:y+29,fill:'#91a8b0','font-size':'9'});weight.textContent=`${d.weight}% illustrative work-hour weight`;g.appendChild(weight);
      if(d.q.neverShare>.5){
        const t=svg('text',{x:width-pad.r+8,y:y+23,fill:'#ffb0bd','font-size':'10'});t.textContent='not by 2100';g.appendChild(t);
        if(d.q.q10<=END_YEAR){
          g.appendChild(svg('line',{x1:x(d.q.q10),y1:y+19,x2:x(END_YEAR),y2:y+19,stroke:'#ff8297','stroke-width':'7','stroke-linecap':'round',opacity:'.35'}));
        }
      } else {
        const q10=Math.min(d.q.q10,END_YEAR),q50=Math.min(d.q.q50,END_YEAR),q90=Math.min(d.q.q90,END_YEAR);
        g.appendChild(svg('line',{x1:x(q10),y1:y+19,x2:x(q90),y2:y+19,stroke:'#5ee2c0','stroke-width':'8','stroke-linecap':'round',opacity:'.28'}));
        if(!Number.isFinite(d.q.q90)){const title=svg('title');title.textContent='Upper modeled threshold not reached by 2100';g.appendChild(title);g.appendChild(svg('text',{x:x(END_YEAR)-10,y:y+12,fill:'#91a8b0','font-size':'9'})).textContent='→';}
        g.appendChild(svg('circle',{cx:x(q50),cy:y+19,r:5.5,fill:'#5ee2c0',stroke:'#071016','stroke-width':'2'}));
        const t=svg('text',{x:Math.min(x(q50)+9,width-pad.r+4),y:y+23,fill:'#bcd2d5','font-size':'10'});t.textContent=formatYear(d.q.q50);g.appendChild(t);
      }
      const choose=()=>{selectedDomain=d.id;const ds=$('#domain-select');if(ds)ds.value=d.id;renderTimeline();renderDomainDetail();};
      g.addEventListener('click',choose);
      g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();choose();}});
      s.appendChild(g);
    });
    host.appendChild(s);
  }

  function centralDomainDates(d) {
    const p=computeParams(d,state,{});
    const valsA=yearRange.map(y=>domainValues(d,y,p,'actual'));
    const valsT=yearRange.map(y=>domainValues(d,y,p,'technical'));
    return {
      p,
      actual50:firstYear(valsA,v=>v>=.5),actual80:firstYear(valsA,v=>v>=.8),actual90:firstYear(valsA,v=>v>=.9),
      tech50:firstYear(valsT,v=>v>=.5),tech80:firstYear(valsT,v=>v>=.8),tech90:firstYear(valsT,v=>v>=.9),
      valsA,valsT
    };
  }
  function bottleneckText(d, dates) {
    const p=dates.p;
    const candidates=[['cognitive capability',p.cogMid],['reliability and autonomy',p.relMid],['robotics / embodiment',p.robotMid*d.physical + p.relMid*(1-d.physical)],['deployment and integration',p.adoptMid]];
    candidates.sort((a,b)=>b[1]-a[1]);
    if (p.cap < .8) return `The strongest limit is not intelligence: under these settings, demand for human presence or legitimacy caps actual substitution near ${(p.cap*100).toFixed(0)}%.`;
    return `The current binding bottleneck is ${candidates[0][0]}. The model’s effective midpoint for that constraint is around ${Math.round(candidates[0][1])}.`;
  }
  function renderDomainDetail() {
    const host=$('#domain-detail');
    const d=domains.find(x=>x.id===selectedDomain)||domains[0];
    const dates=centralDomainDates(d);
    const factors=[
      ['Digital task share',d.digital],['Embodied task share',d.physical],['Regulatory friction',d.reg],['Human-presence preference',d.pref],['Safety criticality',d.safety],['Context / messiness',d.context]
    ];
    host.innerHTML=`
      <div class="kicker">Selected domain</div>
      <h3>${d.name}</h3>
      <div class="desc">${d.desc}</div>
      <div class="tag-row"><span class="tag">${d.weight}% model weight</span><span class="tag">${Math.round(d.digital*100)}% digital</span><span class="tag">${Math.round(d.physical*100)}% embodied</span></div>
      <div class="mini-stat-grid">
        <div class="mini-stat"><b>${formatYear(dates.tech80)}</b><span>80% technical capability</span></div>
        <div class="mini-stat"><b>${formatYear(dates.actual80)}</b><span>80% actual substitution</span></div>
        <div class="mini-stat"><b>${Math.round(dates.p.cap*100)}%</b><span>long-run actual ceiling</span></div>
        <div class="mini-stat"><b>±${d.unc}y</b><span>domain uncertainty scale</span></div>
      </div>
      <div class="bottleneck">${bottleneckText(d,dates)}</div>
      <p class="desc" style="margin-top:13px"><b style="color:#d9e8e9">Interpretation:</b> ${d.signal}</p>
      <div id="domain-mini-chart" style="height:150px;margin-top:10px"></div>
      <div class="factor-list">${factors.map(([name,v])=>`<div class="factor-row"><span>${name}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.round(v*100)}%"></span></span><span>${Math.round(v*100)}</span></div>`).join('')}</div>
    `;
    renderDomainMiniChart(dates);
  }
  function renderDomainMiniChart(dates) {
    const host=$('#domain-mini-chart'); const width=Math.max(280,host.clientWidth||300),height=145,pad={l:32,r:8,t:8,b:24};
    const x=y=>pad.l+(y-START_YEAR)/(END_YEAR-START_YEAR)*(width-pad.l-pad.r), yy=v=>pad.t+(1-v)*(height-pad.t-pad.b);
    const s=svg('svg',{viewBox:`0 0 ${width} ${height}`,class:'chart-svg',role:'img','aria-label':'Domain automation timeline'});
    s.style.width=width+'px';s.style.height=height+'px';
    [.5,.8].forEach(v=>s.appendChild(svg('line',{x1:pad.l,y1:yy(v),x2:width-pad.r,y2:yy(v),stroke:'#203945','stroke-dasharray':'3 4'})));
    [2030,2050,2070,2090].forEach(y=>{const t=svg('text',{x:x(y),y:height-6,fill:'#91a8b0','font-size':'9','text-anchor':'middle'});t.textContent=y;s.appendChild(t);});
    s.appendChild(svg('path',{d:pathFrom(yearRange.map((y,i)=>[x(y),yy(dates.valsT[i])])),fill:'none',stroke:'#69bfff','stroke-width':'2','stroke-dasharray':'5 4'}));
    s.appendChild(svg('path',{d:pathFrom(yearRange.map((y,i)=>[x(y),yy(dates.valsA[i])])),fill:'none',stroke:'#5ee2c0','stroke-width':'2.5'}));
    host.appendChild(s);
  }

/*__SENSITIVITY__*/
  function scenarioSpeed() {
    return clamp((state.capability+state.reliability+state.feedback+state.compute+state.robotics+state.adoption + (100-state.supply)+(100-state.regulation))/800,0,1);
  }
  const outcomeScenarios=[
    {id:'shared',name:'Shared abundance',desc:'AI-generated wealth is broadly owned or taxed; basic services and social dividends expand; paid work becomes more optional.',vector:{material:92,equality:86,autonomy:84,meaning:72,stability:86,safety:80,skills:65}},
    {id:'human',name:'Human-centered mixed economy',desc:'Workweeks shrink, AI handles drudgery, and human roles remain important in care, leadership, culture, and legitimacy.',vector:{material:82,equality:72,autonomy:82,meaning:84,stability:82,safety:82,skills:78}},
    {id:'oligarchic',name:'Oligarchic abundance',desc:'Output is high, but access and political power depend on ownership of compute, models, infrastructure, and platforms.',vector:{material:72,equality:18,autonomy:38,meaning:45,stability:48,safety:55,skills:42}},
    {id:'authoritarian',name:'Authoritarian techno-state',desc:'Automated administration and surveillance provide order or services while sharply reducing privacy, dissent, and personal autonomy.',vector:{material:66,equality:44,autonomy:12,meaning:35,stability:62,safety:48,skills:35}},
    {id:'chaotic',name:'Chaotic transition',desc:'Capability and displacement outrun institutions, producing unemployment shocks, fiscal stress, polarization, and uneven access.',vector:{material:42,equality:24,autonomy:45,meaning:38,stability:18,safety:32,skills:50}},
    {id:'loss',name:'Loss of control / catastrophic failure',desc:'Advanced systems or malicious use overwhelm human control. Outcomes range from severe disempowerment to catastrophe.',vector:{material:10,equality:15,autonomy:5,meaning:12,stability:3,safety:2,skills:18}}
  ];

  function computeOutcomeWeights() {
    const x=Object.fromEntries(Object.entries(outcomeState).map(([k,v])=>[k,v/100]));
    const speed=scenarioSpeed(), concentration=1-x.ownership, fragility=1-x.transition;
    const scores={
      shared:1.5*x.safety+1.6*x.ownership+1.5*x.redistribution+1.1*x.democracy+.9*x.transition+.6*x.meaning+.6*x.coordination-.8*x.surveillance-.3*speed,
      human:1.1*x.safety+.9*x.ownership+.8*x.redistribution+1.3*x.democracy+1.2*x.transition+1.2*x.meaning+.5*(state.newTasks/100)+.5*(state.humanPref/100)-.5*x.surveillance-.2*speed,
      oligarchic:1.4*concentration+1.2*(1-x.redistribution)+.6*x.safety+.8*speed+.7*(1-x.democracy)+.3*x.surveillance,
      authoritarian:1.3*x.surveillance+1.1*(1-x.democracy)+.8*concentration+.7*speed+.2*x.safety-.6*x.coordination,
      chaotic:1.2*speed+1.2*fragility+1.0*(1-x.redistribution)+.8*(1-x.coordination)+.7*(state.supply/100)+.5*(1-x.safety),
      loss:1.7*(1-x.safety)+1.1*speed+1.0*(state.feedback/100)+.8*(1-x.coordination)+.4*(1-x.democracy)-.6*x.transition
    };
    const vals=Object.values(scores), max=Math.max(...vals);
    const exps=Object.fromEntries(Object.entries(scores).map(([k,v])=>[k,Math.exp((v-max)/1.15)]));
    const total=Object.values(exps).reduce((a,b)=>a+b,0);
    return Object.fromEntries(Object.entries(exps).map(([k,v])=>[k,v/total]));
  }

/*__OUTCOME_CONTROLS__*/
  function renderOutcomes() {
    const weights=computeOutcomeWeights();
    const host=$('#outcome-bars');host.innerHTML='';
    const ordered=[...outcomeScenarios].sort((a,b)=>weights[b.id]-weights[a.id]);
    ordered.forEach(sc=>{
      const pct=weights[sc.id]*100;
      const row=document.createElement('div');row.className='outcome-row';
      row.innerHTML=`<div class="outcome-name">${sc.name}</div><div class="outcome-track"><div class="outcome-fill" style="width:${pct}%"></div></div><div class="outcome-pct">${pct.toFixed(0)}%</div>`;
      host.appendChild(row);
    });
    const top=ordered[0];
    const dims={material:0,equality:0,autonomy:0,meaning:0,stability:0,safety:0,skills:0};
    outcomeScenarios.forEach(sc=>Object.keys(dims).forEach(k=>dims[k]+=weights[sc.id]*sc.vector[k]));
    const labels={material:'Living standards',equality:'Equality',autonomy:'Autonomy',meaning:'Meaning',stability:'Stability',safety:'Safety',skills:'Skill retention'};
    $('#outcome-narrative').innerHTML=`<h4>Most weighted branch: ${top.name}</h4><p style="color:#9fb5bb;font-size:.83rem;margin:0">${top.desc}</p><div class="dimension-grid">${Object.entries(dims).map(([k,v])=>`<div class="dimension"><span>${labels[k]}</span><span class="bar-track"><span class="bar-fill" style="width:${v.toFixed(0)}%"></span></span><span>${v.toFixed(0)}</span></div>`).join('')}</div>`;
  }
