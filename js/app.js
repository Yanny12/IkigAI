
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
    <p class="sheet-note">Wenn keine Startzeit gewählt wird, schlägt IkigAI automatisch eine passende Zeit vor.</p>
  </div>`;
  document.body.appendChild(overlay);
}
function closeEventModal(){document.getElementById('eventModal')?.remove()}
function minutesFromTime(t){const [h,m]=t.split(':').map(Number);return h*60+m}
function timeFromMinutes(m){m=Math.max(360,Math.min(1320,m));return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
function suggestedTimeFor(category){
  if(category==='Hund') return '07:00';
  if(category==='Gesundheit') return '18:00';
  if(category==='Sozial') return '19:00';
  if(category==='Freiraum') return '20:00';
  return '09:00';
}
function endTime(start,duration){return timeFromMinutes(minutesFromTime(start)+Number(duration||60))}
function saveNewEvent(){
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
    duration,location,priority:'2',category,group,energy:'Mittel',
    timeWasSuggested:suggested,goalImpact:[],travelBefore:null,
    workLocationRecommendation:category==='Arbeit'?'Arbeitsort wird in der nächsten Optimierung empfohlen':null,
    weatherRecommendation:null
  };
  const events=localEvents();events.push(event);saveLocalEvents(events);closeEventModal();window.location.reload();
}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function accent(e){if(e.group==='Arbeit')return'#007AFF';if(e.category==='Freiraum')return'#8E8E93';if(e.category==='Gesundheit')return'#34C759';if(e.category==='Sozial')return'#AF52DE';if(e.category==='Hund')return'#FF9500';return'#34C759'}
function groupLabel(e){if(e.group==='Arbeit')return'Arbeit';if(e.category==='Freiraum')return'Ruhezeit';return'Freizeit'}
function eventCard(e){const cls=e.group==='Arbeit'?'work':(e.category==='Freiraum'?'rest':'free');return `<article class="card event-card" style="--accent:${accent(e)}"><div><div class="event-time">${e.start}</div><div class="event-end">${e.end||''}</div></div><div><div class="event-title">${esc(e.title)}</div><p>${esc(e.description)}</p><div class="event-meta"><span class="pill ${cls}">${groupLabel(e)}</span><span class="pill">${esc(e.category)}</span><span class="pill">${e.duration} Min.</span>${e.location?`<span class="pill">${esc(e.location)}</span>`:''}${e.timeWasSuggested?`<span class="pill ai">KI-Zeitvorschlag</span>`:''}${e.workLocationRecommendation?`<span class="pill location">${esc(e.workLocationRecommendation)}</span>`:''}${e.weatherRecommendation?`<span class="pill weather">${esc(e.weatherRecommendation)}</span>`:''}${e.goalImpact?.length?`<span class="pill free">Zielbeitrag</span>`:''}</div></div></article>`}
function travelCard(t){if(!t)return'';return `<article class="card travel-card"><div><div class="event-time">${t.start}</div><div class="event-end">${t.end}</div></div><div><div class="event-title">Reisezeit</div><p>Automatisch eingeplant zwischen unterschiedlichen Orten.</p><div class="event-meta"><span class="pill rest">${t.duration} Min.</span><span class="pill">Puffer</span></div></div></article>`}
function eventWithTravel(e){return travelCard(e.travelBefore)+eventCard(e)}
function byDate(ev){return ev.reduce((a,e)=>{(a[e.date]??=[]).push(e);return a},{})}
function weekdayTitle(date,events){const e=events.find(x=>x.date===date);const d=new Date(date+'T12:00:00');return `${e?e.weekday:''}, ${d.toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'})}`}
function stats(ev){const sum=(f)=>ev.filter(f).reduce((s,e)=>s+(e.duration||0),0),work=sum(e=>e.group==='Arbeit'),health=sum(e=>e.category==='Gesundheit'),social=sum(e=>e.category==='Sozial'),rest=sum(e=>e.category==='Freiraum');const travel=ev.reduce((s,e)=>s+(e.travelBefore?.duration||0),0);const ws=Math.max(35,Math.min(95,Math.round(100-Math.abs(work/60-32)*2.2))),hs=Math.max(35,Math.min(95,Math.round(55+health/60*7))),ss=Math.max(35,Math.min(95,Math.round(55+social/60*7))),rs=Math.max(30,Math.min(95,Math.round(45+rest/60*9)));return{workScore:ws,healthScore:hs,socialScore:ss,restScore:rs,balance:Math.round((ws+hs+ss+rs)/4),suggested:ev.filter(e=>e.timeWasSuggested).length,travel}}
function weatherIcon(c){return c==='sun'?'☀️':c==='rain'?'🌧️':c==='storm'?'⛈️':'☁️'}
function weatherStrip(weather){return `<div class="weather-strip">${Object.entries(weather).slice(0,4).map(([d,w])=>`<div class="weather-mini"><b>${weatherIcon(w.condition)}</b><span>${new Date(d+'T12:00').toLocaleDateString('de-CH',{weekday:'short'})}</span><p>${w.temp}°</p></div>`).join('')}</div>`}
function goalProgress(events, goals){return goals.map(g=>{let count=0;if(g.id==='revenue') count=Math.round(events.filter(e=>e.group==='Arbeit').reduce((a,e)=>a+e.duration,0)/60); else count=events.filter(e=>e.goalImpact?.includes(g.id)).length; const pct=Math.min(100,Math.round(count/g.target*100));return {...g,count,pct}})}
function goalCards(progress){return progress.map(g=>`<div class="card goal-card"><div><h3>${esc(g.title)}</h3><p>${g.count} / ${g.target} ${esc(g.unit)}</p></div><div class="progress" style="--w:${g.pct}%"><span></span></div></div>`).join('')}
function dailyEnergy(){return localStorage.getItem('ikigai_energy')||'neutral'}
function setEnergy(e){localStorage.setItem('ikigai_energy',e);renderProfile()}
function energyInsight(){const e=dailyEnergy();return e==='morning'?'Fokusarbeit wird bevorzugt vor 11:30 Uhr vorgeschlagen.':e==='evening'?'Anspruchsvolle Aufgaben werden eher am späteren Nachmittag platziert.':'Fokusblöcke werden gleichmäßig über den Tag verteilt.'}
function insights(ev, weather){const s=stats(ev);return [`${s.suggested} Termine ohne Uhrzeit wurden automatisch mit einer KI-Zeit versehen.`,`${Math.round(s.travel/60*10)/10} Stunden Reisezeit/Puffer wurden zwischen Ortswechseln berücksichtigt.`,energyInsight(),`Arbeitsort-Empfehlungen berücksichtigen Fokusbedarf, Meeting-Typ und Wetter.`,`Wetterregel aktiv: Bei Regen/Gewitter werden Outdoor-Aktivitäten mit Indoor-Alternative markiert.`]}
function recommendedBlock(date,events){const work=events.filter(e=>e.group==='Arbeit').reduce((a,e)=>a+e.duration,0),energy=dailyEnergy();let time=energy==='evening'?'15:00':energy==='morning'?'08:30':'09:00',end=energy==='evening'?'17:00':energy==='morning'?'10:30':'11:00';return work<360?`<article class="card event-card" style="--accent:#007AFF"><div><div class="event-time">${time}</div><div class="event-end">${end}</div></div><div><div class="event-title">Empfohlene Fokusarbeit</div><p>KI-Vorschlag basierend auf Tagesenergie: ${esc(energyInsight())}</p><div class="event-meta"><span class="pill work">KI-Vorschlag</span><span class="pill location">Zuhause empfohlen</span></div></div></article>`:`<article class="card event-card" style="--accent:#8E8E93"><div><div class="event-time">18:30</div><div class="event-end">19:00</div></div><div><div class="event-title">Empfohlene Ruhezeit</div><p>Regeneration nach intensiver Arbeit inklusive Reisezeit.</p><div class="event-meta"><span class="pill rest">KI-Vorschlag</span><span class="pill">30 Min.</span></div></div></article>`}

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
    workDays:['Montag','Dienstag','Mittwoch','Donnerstag','Freitag']
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

async function renderHome(){document.querySelector('#app').insertAdjacentHTML('afterbegin',header());document.querySelector('#app').insertAdjacentHTML('beforeend',nav('home')+addEventButton('Arbeit'));const [ev,weather,goals]=await Promise.all([loadEvents(),loadJSON(WEATHER_URL),loadJSON(GOALS_URL)]),day=ev.filter(e=>e.date===START_DATE),s=stats(ev),progress=goalProgress(ev,goals);document.querySelector('#content').innerHTML=`<div class="hero-date">Prototyp-Tag</div><h1>${weekdayTitle(START_DATE,ev)}</h1>${weatherStrip(weather)}<div class="notice">${s.suggested} KI-Zeitvorschläge · ${Math.round(s.travel)} Min. Reisezeit eingeplant · Tagesenergie: ${dailyEnergy()}</div>${addEventCard('Arbeit')}<div class="quick-actions"><a class="primary-tile" href="arbeit.html"><span>💼</span><b>Arbeit</b></a><a class="primary-tile" href="freizeit.html"><span>🌿</span><b>Freizeit</b></a><a class="primary-tile" href="wochenplan.html"><span>✨</span><b>Wochenplan</b></a></div><div class="section-head"><h2>Ziele</h2><a class="small-link" href="profil.html">Bearbeiten</a></div>${goalCards(progress.slice(0,2))}<div class="section-head"><h2>Heute</h2><a class="small-link" href="wochenplan.html">Alle ansehen</a></div>${day.length?day.map(eventWithTravel).join(''):'<div class="card empty">Keine Termine.</div>'}`}
async function renderList(kind){document.querySelector('#app').insertAdjacentHTML('afterbegin',header());document.querySelector('#app').insertAdjacentHTML('beforeend',nav(kind==='Arbeit'?'work':'free')+addEventButton(kind==='Arbeit'?'Arbeit':'Gesundheit'));const ev=await loadEvents(),f=kind==='Arbeit'?ev.filter(e=>e.group==='Arbeit'):ev.filter(e=>e.group==='Freizeit'),g=byDate(f),suggested=f.filter(e=>e.timeWasSuggested).length,travel=f.reduce((s,e)=>s+(e.travelBefore?.duration||0),0);document.querySelector('#content').innerHTML=`<h1>${kind}</h1><p>${f.length} Termine aus der JSON-Datei</p><div class="notice">${suggested} KI-Zeitvorschläge · ${travel} Min. Reisezeit/Puffer</div>${addEventCard(kind==='Arbeit'?'Arbeit':'Gesundheit')}${Object.keys(g).sort().map(d=>`<div class="day-block"><div class="day-title">${weekdayTitle(d,ev)}</div>${g[d].map(eventWithTravel).join('')}</div>`).join('')}`}
async function renderPlan(){document.querySelector('#app').insertAdjacentHTML('afterbegin',header());document.querySelector('#app').insertAdjacentHTML('beforeend',nav('plan'));const [ev,weather,goals]=await Promise.all([loadEvents(),loadJSON(WEATHER_URL),loadJSON(GOALS_URL)]),s=stats(ev),g=byDate(ev),progress=goalProgress(ev,goals);document.querySelector('#content').innerHTML=`<h1>KI-Wochenplan</h1>${weatherStrip(weather)}<div class="score-card"><p style="color:rgba(255,255,255,.82)">IkigAI Balance Score</p><div class="score-number">${s.balance}<span style="font-size:22px">/100</span></div><div class="score-grid"><div class="metric"><b>${s.workScore}%</b><span>Arbeit</span></div><div class="metric"><b>${s.healthScore}%</b><span>Gesundheit</span></div><div class="metric"><b>${s.socialScore}%</b><span>Sozialleben</span></div><div class="metric"><b>${s.restScore}%</b><span>Erholung</span></div></div></div><h2>Ziel-Fortschritt</h2>${goalCards(progress)}<h2>KI Insights</h2>${insights(ev,weather).map(t=>`<div class="card insight"><div class="check">✓</div><p>${esc(t)}</p></div>`).join('')}<h2>Optimierter Wochenplan</h2>${Object.keys(g).sort().map(d=>`<div class="day-block"><div class="day-title">${weekdayTitle(d,ev)}</div>${recommendedBlock(d,g[d])}${g[d].map(eventWithTravel).join('')}</div>`).join('')}`}
async function renderProfile(){document.querySelector('#app').insertAdjacentHTML('afterbegin',header());document.querySelector('#app').insertAdjacentHTML('beforeend',nav('profile'));const [ev,goals]=await Promise.all([loadEvents(),loadJSON(GOALS_URL)]),progress=goalProgress(ev,goals),energy=dailyEnergy(),profile=loadProfile();document.querySelector('#content').innerHTML=`<h1>Profil</h1>${profileForm(profile)}<div class="card"><h3>Tagesenergie</h3><p>${energyInsight()}</p><div class="preference" style="margin-top:12px"><button onclick="setEnergy('morning')" class="pref-btn ${energy==='morning'?'active':''}">Morgen</button><button onclick="setEnergy('neutral')" class="pref-btn ${energy==='neutral'?'active':''}">Neutral</button><button onclick="setEnergy('evening')" class="pref-btn ${energy==='evening'?'active':''}">Abend</button></div></div><h2>Ziele</h2>${goalCards(progress)}<div class="card"><h3>Aktivitäten → Ziele</h3><div class="list-row"><span>Joggen / Padel → 5 kg abnehmen</span></div><div class="list-row"><span>Freiraum → Stress reduzieren</span></div><div class="list-row"><span>Sozial → Familie & Freunde</span></div><div class="list-row"><span>Arbeit → Umsatz steigern</span></div></div><div class="card"><h3>Arbeitsorte</h3>${['Zuhause','Büro','Coworking','Café'].map(x=>`<div class="list-row"><span>${x}</span><span>✓</span></div>`).join('')}</div><div class="card" id="settings"><h3>Kalenderintegration</h3>${['Apple Calendar','Google Calendar','Outlook'].map(x=>`<div class="list-row"><span>${x}</span><button class="status-btn">Verbinden</button></div>`).join('')}</div>`}
