
const DATA_URL='./data/kalender.json', WEATHER_URL='./data/weather.json', GOALS_URL='./data/goals.json', START_DATE='2026-07-06';
const icons={home:`<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V21h13V10.5"/><path d="M9.5 21v-6h5v6"/></svg>`,work:`<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="13" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M4 12h16"/></svg>`,free:`<svg viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M6 7c3 0 6 2 6 5-3 0-6-2-6-5Z"/><path d="M18 7c-3 0-6 2-6 5 3 0 6-2 6-5Z"/></svg>`,plan:`<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></svg>`,profile:`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.8-4.3 13.2-4.3 15 0"/></svg>`};
function nav(active){return `<nav class="nav">${[['index.html','home','Home'],['arbeit.html','work','Arbeit'],['freizeit.html','free','Freizeit'],['wochenplan.html','plan','Plan'],['profil.html','profile','Profil']].map(([h,k,l])=>`<a class="${active===k?'active':''}" href="${h}">${icons[k]}${l}</a>`).join('')}</nav>`}
function header(){return `<header class="header"><div class="logo">IkigAI</div><div class="header-actions"><a class="icon-btn" href="profil.html">${icons.profile}</a><a class="icon-btn" href="profil.html#settings"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg></a></div></header>`}
async function loadJSON(url){const r=await fetch(url);return r.json()}
function localEvents(){return JSON.parse(localStorage.getItem('ikigai_events')||'[]')}
function saveLocalEvents(events){localStorage.setItem('ikigai_events',JSON.stringify(events))}
async function loadEvents(){
  const baseEvents = await loadJSON(DATA_URL);
  return [...baseEvents,...localEvents()].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start))
}
function nextLocalId(){return 'local-'+Date.now()}
function addEventButton(defaultCategory='Arbeit'){
  return `<button class="floating-add" onclick="openEventModal('${defaultCategory}')" aria-label="Neuer Termin">+</button>`
}
function addEventCard(defaultCategory='Arbeit'){
  return `<button class="add-event-card" onclick="openEventModal('${defaultCategory}')">
    <span>+</span>
    <div><b>Neuer Termin</b><p>Termin manuell erfassen oder Zeit von IkigAI vorschlagen lassen</p></div>
  </button>`
}
function openEventModal(defaultCategory='Arbeit'){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'eventModal';
  overlay.innerHTML = `<div class="bottom-sheet">
    <div class="sheet-handle"></div>
    <h2>Neuer Termin</h2>
    <label>Titel</label>
    <input id="newTitle" placeholder="z.B. Kundenmeeting">
    <label>Datum</label>
    <input id="newDate" type="date" value="${START_DATE}">
    <label>Startzeit optional</label>
    <input id="newStart" type="time">
    <label>Dauer in Minuten</label>
    <input id="newDuration" type="number" value="60" min="15" step="15">
    <label>Ort</label>
    <input id="newLocation" placeholder="z.B. Büro, Zuhause, Draussen">
    <label>Kategorie</label>
    <select id="newCategory">
      ${['Arbeit','Gesundheit','Sozial','Hund','Freiraum'].map(c=>`<option ${c===defaultCategory?'selected':''}>${c}</option>`).join('')}
    </select>
    <div class="sheet-actions">
      <button class="secondary-btn" onclick="closeEventModal()">Abbrechen</button>
      <button class="add-btn" onclick="saveNewEvent()">Speichern</button>
    </div>
    <div id="conflictArea"></div><p class="sheet-note">Wenn keine Startzeit gewählt wird, schlägt IkigAI automatisch eine passende Zeit vor. Priorisierte Kategorien erhalten bevorzugte Zeiten.</p>
  </div>`;
  document.body.appendChild(overlay);
}
function closeEventModal(){document.getElementById('eventModal')?.remove()}
function minutesFromTime(t){const [h,m]=t.split(':').map(Number);return h*60+m}
function timeFromMinutes(m){m=Math.max(360,Math.min(1320,m));return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
function suggestedTimeFor(category){
  const high=priorityFor(category)>=4;
  if(category==='Arbeit') return high ? '09:00' : '14:00';
  if(category==='Hund') return high ? '07:00' : '12:00';
  if(category==='Gesundheit') return high ? '18:00' : '19:30';
  if(category==='Sozial') return high ? '19:00' : '20:00';
  if(category==='Freiraum') return high ? '17:30' : '20:30';
  return '09:00';
}
function endTime(start,duration){return timeFromMinutes(minutesFromTime(start)+Number(duration||60))}
async function saveNewEvent(ignoreConflict=false){
  const title=document.getElementById('newTitle').value.trim();
  const date=document.getElementById('newDate').value;
  const category=document.getElementById('newCategory').value;
  const duration=Number(document.getElementById('newDuration').value||60);
  let start=document.getElementById('newStart').value;
  const location=document.getElementById('newLocation').value.trim();
  if(!title){alert('Bitte Titel eingeben.');return}
  const suggested=!start;
  if(!start) start=suggestedTimeFor(category);
  const group=category==='Arbeit'?'Arbeit':'Freizeit';
  const weekday=new Date(date+'T12:00').toLocaleDateString('de-CH',{weekday:'long'});
  const event={
    id:nextLocalId(),date,weekday:weekday.charAt(0).toUpperCase()+weekday.slice(1),
    start,end:endTime(start,duration),title,description:'Manuell erfasst',
    duration,location,priority:String(priorityFor(category)),category,group,energy:'Mittel',
    timeWasSuggested:suggested,goalImpact:[],travelBefore:null,
    workLocationRecommendation:category==='Arbeit'?'Arbeitsort wird in der nächsten Optimierung empfohlen':null,
    weatherRecommendation:null, conflictIgnored:ignoreConflict
  };
  const baseEvents=await loadJSON(DATA_URL);
  window._cachedEventsForConflict=baseEvents;
  const conflict=hasConflict(event,[...baseEvents,...localEvents()]);
  if(conflict && !ignoreConflict){
    document.getElementById('conflictArea').innerHTML=conflictWarning(event,conflict);
    return;
  }
  const events=localEvents();events.push(event);saveLocalEvents(events);closeEventModal();window.location.reload();
}
function defaultProfile(){
  return {
    firstName:'',
    lastName:'',
    email:'',
    phone:'',
    age:'',
    gender:'',
    privateAddress:'',
    businessAddress:'',
    weeklyHours:40,
    workDays:['Montag','Dienstag','Mittwoch','Donnerstag','Freitag'],categoryPriorities:{Arbeit:5,Gesundheit:4,Sozial:3,Hund:3,Freiraum:4}
  }
}
function loadProfile(){
  return {...defaultProfile(), ...JSON.parse(localStorage.getItem('ikigai_profile')||'{}')}
}
function saveProfile(){
  const days=[...document.querySelectorAll('.workday-toggle.active')].map(b=>b.dataset.day);
  const profile={
    firstName:document.getElementById('profileFirstName').value.trim(),
    lastName:document.getElementById('profileLastName').value.trim(),
    email:document.getElementById('profileEmail').value.trim(),
    phone:document.getElementById('profilePhone').value.trim(),
    age:document.getElementById('profileAge').value,
    gender:document.getElementById('profileGender').value,
    privateAddress:document.getElementById('profilePrivateAddress').value.trim(),
    businessAddress:document.getElementById('profileBusinessAddress').value.trim(),
    weeklyHours:Number(document.getElementById('profileWeeklyHours').value||0),
    workDays:days
  };
  localStorage.setItem('ikigai_profile', JSON.stringify(profile));
  const note=document.getElementById('profileSavedNote');
  if(note){note.textContent='Gespeichert';setTimeout(()=>note.textContent='',1800)}
}
function toggleWorkday(btn){btn.classList.toggle('active')}
function profileForm(profile){
  const days=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
  return `<div class="card profile-form-card">
    <h3>Persönliche Angaben</h3>
    <div class="form-grid">
      <label>Vorname<input id="profileFirstName" value="${esc(profile.firstName)}" placeholder="Vorname"></label>
      <label>Nachname<input id="profileLastName" value="${esc(profile.lastName)}" placeholder="Nachname"></label>
      <label>Email<input id="profileEmail" type="email" value="${esc(profile.email)}" placeholder="name@email.com"></label>
      <label>Telefonnummer<input id="profilePhone" value="${esc(profile.phone)}" placeholder="+41 ..."></label>
      <label>Alter<input id="profileAge" type="number" min="0" value="${esc(profile.age)}" placeholder="Alter"></label>
      <label>Geschlecht
        <select id="profileGender">
          ${['','Männlich','Weiblich','Divers','Keine Angabe'].map(g=>`<option value="${g}" ${profile.gender===g?'selected':''}>${g||'Bitte wählen'}</option>`).join('')}
        </select>
      </label>
      <label class="full">Private Adresse<textarea id="profilePrivateAddress" placeholder="Strasse, PLZ, Ort">${esc(profile.privateAddress)}</textarea></label>
      <label class="full">Geschäftsadresse<textarea id="profileBusinessAddress" placeholder="Firma, Strasse, PLZ, Ort">${esc(profile.businessAddress)}</textarea></label>
      <label class="full">Arbeitsstunden pro Woche<input id="profileWeeklyHours" type="number" min="0" max="100" value="${esc(profile.weeklyHours)}"></label>
    </div>
    <div class="workdays">
      <p>Arbeitstage der Woche</p>
      <div class="workday-grid">
        ${days.map(d=>`<button type="button" data-day="${d}" onclick="toggleWorkday(this)" class="workday-toggle ${profile.workDays.includes(d)?'active':''}">${d.slice(0,2)}</button>`).join('')}
      </div>
    </div>
    <button class="add-btn" onclick="saveProfile()">Persönliche Angaben speichern</button>
    <p id="profileSavedNote" class="saved-note"></p>
  </div>`
}


function categoryPriorityLabel(v){
  return v >= 5 ? 'Sehr hoch' : v == 4 ? 'Hoch' : v == 3 ? 'Mittel' : v == 2 ? 'Niedrig' : 'Sehr niedrig';
}
function categoryPriorityForm(profile){
  const cats=['Arbeit','Gesundheit','Sozial','Hund','Freiraum'];
  const labels={Arbeit:'Arbeit',Gesundheit:'Gesundheit / Sport',Sozial:'Sozialleben',Hund:'Hund',Freiraum:'Ruhezeit / Freiraum'};
  return `<div class="card priority-card">
    <h3>Kategorien priorisieren</h3>
    <p>Höher priorisierte Kategorien werden bei KI-Zeitvorschlägen bevorzugt eingeplant.</p>
    ${cats.map(c=>`<div class="priority-row">
      <div><b>${labels[c]}</b><span id="priorityLabel${c}">${categoryPriorityLabel(profile.categoryPriorities?.[c]||3)}</span></div>
      <input type="range" min="1" max="5" value="${profile.categoryPriorities?.[c]||3}" id="priority${c}" oninput="document.getElementById('priorityLabel${c}').textContent=categoryPriorityLabel(this.value)">
    </div>`).join('')}
    <button class="add-btn" onclick="saveCategoryPriorities()">Prioritäten speichern</button>
    <p id="prioritySavedNote" class="saved-note"></p>
  </div>`
}
function saveCategoryPriorities(){
  const profile=loadProfile();
  profile.categoryPriorities={
    Arbeit:Number(document.getElementById('priorityArbeit').value),
    Gesundheit:Number(document.getElementById('priorityGesundheit').value),
    Sozial:Number(document.getElementById('prioritySozial').value),
    Hund:Number(document.getElementById('priorityHund').value),
    Freiraum:Number(document.getElementById('priorityFreiraum').value)
  };
  localStorage.setItem('ikigai_profile',JSON.stringify(profile));
  const note=document.getElementById('prioritySavedNote');
  if(note){note.textContent='Gespeichert';setTimeout(()=>note.textContent='',1800)}
}
function priorityFor(category){
  return (loadProfile().categoryPriorities||{})[category] || 3;
}
function hasConflict(candidate, events){
  const cStart=minutesFromTime(candidate.start), cEnd=minutesFromTime(candidate.end);
  return events.filter(e=>e.date===candidate.date).find(e=>{
    const s=minutesFromTime(e.start), end=minutesFromTime(e.end||e.start);
    return !(cEnd<=s || cStart>=end);
  });
}
function conflictWarning(candidate, conflict){
  return `<div class="conflict-box">
    <b>Terminkonflikt erkannt</b>
    <p>Der neue Termin überschneidet sich mit „${esc(conflict.title)}“ (${conflict.start}–${conflict.end}).</p>
    <div class="conflict-actions">
      <button class="secondary-btn" onclick="suggestAlternativeTime()">Zeit anpassen</button>
      <button class="danger-btn" onclick="saveNewEvent(true)">Trotzdem speichern</button>
    </div>
  </div>`
}
function suggestAlternativeTime(){
  const category=document.getElementById('newCategory').value;
  const date=document.getElementById('newDate').value;
  const duration=Number(document.getElementById('newDuration').value||60);
  const all=[...window._cachedEventsForConflict,...localEvents()].filter(e=>e.date===date).sort((a,b)=>a.start.localeCompare(b.start));
  const preferred=priorityFor(category)>=4?['08:00','09:00','10:00','14:00','16:00','18:00','20:00']:['11:00','13:00','15:00','17:00','19:00','20:00'];
  for(const t of preferred){
    const cand={date,start:t,end:endTime(t,duration)};
    if(!hasConflict(cand,all)){document.getElementById('newStart').value=t;document.getElementById('conflictArea').innerHTML='<p class="saved-note">Alternative Zeit vorgeschlagen: '+t+'</p>';return}
  }
  document.getElementById('conflictArea').innerHTML='<p class="sheet-note">Keine freie Alternative gefunden. Du kannst ignorieren oder manuell anpassen.</p>';
}

async function renderHome(){document.querySelector('#app').insertAdjacentHTML('afterbegin',header());document.querySelector('#app').insertAdjacentHTML('beforeend',nav('home')+addEventButton('Arbeit'));const [ev,weather,goals]=await Promise.all([loadEvents(),loadJSON(WEATHER_URL),loadJSON(GOALS_URL)]),day=ev.filter(e=>e.date===START_DATE),s=stats(ev),progress=goalProgress(ev,goals);document.querySelector('#content').innerHTML=`<div class="hero-date">Prototyp-Tag</div><h1>${weekdayTitle(START_DATE,ev)}</h1>${weatherStrip(weather)}<div class="notice">${s.suggested} KI-Zeitvorschläge · ${Math.round(s.travel)} Min. Reisezeit eingeplant · Tagesenergie: ${dailyEnergy()}</div>${addEventCard('Arbeit')}<div class="quick-actions"><a class="primary-tile" href="arbeit.html"><span>💼</span><b>Arbeit</b></a><a class="primary-tile" href="freizeit.html"><span>🌿</span><b>Freizeit</b></a><a class="primary-tile" href="wochenplan.html"><span>✨</span><b>Wochenplan</b></a></div><div class="section-head"><h2>Ziele</h2><a class="small-link" href="profil.html">Bearbeiten</a></div>${goalCards(progress.slice(0,2))}<div class="section-head"><h2>Heute</h2><a class="small-link" href="wochenplan.html">Alle ansehen</a></div>${day.length?day.map(eventWithTravel).join(''):'<div class="card empty">Keine Termine.</div>'}`}
async function renderList(kind){document.querySelector('#app').insertAdjacentHTML('afterbegin',header());document.querySelector('#app').insertAdjacentHTML('beforeend',nav(kind==='Arbeit'?'work':'free')+addEventButton(kind==='Arbeit'?'Arbeit':'Gesundheit'));const ev=await loadEvents(),f=kind==='Arbeit'?ev.filter(e=>e.group==='Arbeit'):ev.filter(e=>e.group==='Freizeit'),g=byDate(f),suggested=f.filter(e=>e.timeWasSuggested).length,travel=f.reduce((s,e)=>s+(e.travelBefore?.duration||0),0);document.querySelector('#content').innerHTML=`<h1>${kind}</h1><p>${f.length} Termine aus der JSON-Datei</p><div class="notice">${suggested} KI-Zeitvorschläge · ${travel} Min. Reisezeit/Puffer</div>${addEventCard(kind==='Arbeit'?'Arbeit':'Gesundheit')}${Object.keys(g).sort().map(d=>`<div class="day-block"><div class="day-title">${weekdayTitle(d,ev)}</div>${g[d].map(eventWithTravel).join('')}</div>`).join('')}`}
async function renderPlan(){document.querySelector('#app').insertAdjacentHTML('afterbegin',header());document.querySelector('#app').insertAdjacentHTML('beforeend',nav('plan'));const [ev,weather,goals]=await Promise.all([loadEvents(),loadJSON(WEATHER_URL),loadJSON(GOALS_URL)]),s=stats(ev),g=byDate(ev),progress=goalProgress(ev,goals);document.querySelector('#content').innerHTML=`<h1>KI-Wochenplan</h1>${weatherStrip(weather)}<div class="score-card"><p style="color:rgba(255,255,255,.82)">IkigAI Balance Score</p><div class="score-number">${s.balance}<span style="font-size:22px">/100</span></div><div class="score-grid"><div class="metric"><b>${s.workScore}%</b><span>Arbeit</span></div><div class="metric"><b>${s.healthScore}%</b><span>Gesundheit</span></div><div class="metric"><b>${s.socialScore}%</b><span>Sozialleben</span></div><div class="metric"><b>${s.restScore}%</b><span>Erholung</span></div></div></div><h2>Ziel-Fortschritt</h2>${goalCards(progress)}<h2>KI Insights</h2>${insights(ev,weather).map(t=>`<div class="card insight"><div class="check">✓</div><p>${esc(t)}</p></div>`).join('')}<h2>Optimierter Wochenplan</h2>${Object.keys(g).sort().map(d=>`<div class="day-block"><div class="day-title">${weekdayTitle(d,ev)}</div>${recommendedBlock(d,g[d])}${g[d].map(eventWithTravel).join('')}</div>`).join('')}`}
async function renderProfile(){document.querySelector('#app').insertAdjacentHTML('afterbegin',header());document.querySelector('#app').insertAdjacentHTML('beforeend',nav('profile'));const [ev,goals]=await Promise.all([loadEvents(),loadJSON(GOALS_URL)]),progress=goalProgress(ev,goals),energy=dailyEnergy(),profile=loadProfile();document.querySelector('#content').innerHTML=`<h1>Profil</h1>${profileForm(profile)}${categoryPriorityForm(profile)}<div class="card"><h3>Tagesenergie</h3><p>${energyInsight()}</p><div class="preference" style="margin-top:12px"><button onclick="setEnergy('morning')" class="pref-btn ${energy==='morning'?'active':''}">Morgen</button><button onclick="setEnergy('neutral')" class="pref-btn ${energy==='neutral'?'active':''}">Neutral</button><button onclick="setEnergy('evening')" class="pref-btn ${energy==='evening'?'active':''}">Abend</button></div></div><h2>Ziele</h2>${goalCards(progress)}<div class="card"><h3>Aktivitäten → Ziele</h3><div class="list-row"><span>Joggen / Padel → 5 kg abnehmen</span></div><div class="list-row"><span>Freiraum → Stress reduzieren</span></div><div class="list-row"><span>Sozial → Familie & Freunde</span></div><div class="list-row"><span>Arbeit → Umsatz steigern</span></div></div><div class="card"><h3>Arbeitsorte</h3>${['Zuhause','Büro','Coworking','Café'].map(x=>`<div class="list-row"><span>${x}</span><span>✓</span></div>`).join('')}</div><div class="card" id="settings"><h3>Kalenderintegration</h3>${['Apple Calendar','Google Calendar','Outlook'].map(x=>`<div class="list-row"><span>${x}</span><button class="status-btn">Verbinden</button></div>`).join('')}</div>`}
