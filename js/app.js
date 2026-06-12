
const DATA_URL='./data/kalender.json', GOALS_URL='./data/goals.json', START_DATE='2026-07-06', DEMO_NOW='10:00';
const CATEGORY_COLORS={Arbeit:'#007AFF',Privat:'#FF9500'};
const icons={home:`<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V21h13V10.5"/><path d="M9.5 21v-6h5v6"/></svg>`,work:`<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="13" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M4 12h16"/></svg>`,private:`<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.4-7-11a7 7 0 0 1 14 0c0 6.6-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>`,plan:`<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></svg>`,goals:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>`,profile:`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.8-4.3 13.2-4.3 15 0"/></svg>`};
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function safeJSON(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function getSelectedDate(){return localStorage.getItem('ikigai_selected_date') || START_DATE}
function setSelectedDate(date){localStorage.setItem('ikigai_selected_date',date);location.reload()}
function shiftSelectedDate(days){const d=new Date(getSelectedDate()+'T12:00');d.setDate(d.getDate()+days);setSelectedDate(d.toISOString().slice(0,10))}
function sameDayLabel(date,events){return titleDate(date,events)}

async function loadJSON(u){const r=await fetch(u); if(!r.ok) throw new Error(u+' konnte nicht geladen werden'); return r.json()}
function norm(e){const c=e.category==='Arbeit'||e.group==='Arbeit'?'Arbeit':'Privat'; return {...e,category:c,group:c}}
function localEvents(){return safeJSON('ikigai_events',[]).map(norm)}
function saveLocalEvents(e){localStorage.setItem('ikigai_events',JSON.stringify(e))}
async function loadEvents(){const b=(await loadJSON(DATA_URL)).map(norm), l=localEvents(), del=new Set(l.filter(e=>e.deleted).map(e=>String(e.originalId))), edt=new Set(l.filter(e=>e.originalId&&!e.deleted).map(e=>String(e.originalId))); return [...b.filter(e=>!del.has(String(e.id))&&!edt.has(String(e.id))),...l.filter(e=>!e.deleted)].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start))}
function header(){return `<header class="header"><div class="nav-title">IkigAI</div><div class="header-actions"><a class="icon-btn" href="profil.html">${icons.profile}</a></div></header>`}
function nav(a){return `<nav class="nav">${[['index.html','home','Home'],['arbeit.html','work','Arbeit'],['privat.html','private','Privat'],['wochenplan.html','plan','Woche'],['ziele.html','goals','Ziele']].map(([h,k,l])=>`<a class="${a===k?'active':''}" href="${h}">${icons[k]}${l}</a>`).join('')}</nav>`}
function init(a){const app=document.getElementById('app'); app.insertAdjacentHTML('afterbegin',header()); app.insertAdjacentHTML('beforeend',nav(a)+`<button class="floating-add" onclick="openEventModal()">+</button>`)}
function showError(e){console.error(e);document.getElementById('content').innerHTML=`<div class="card"><h2>Fehler</h2><p>${esc(e.message||e)}</p></div>`}
function toMin(t){if(!t||!t.includes(':'))return 0; const [h,m]=t.split(':').map(Number);return h*60+m}
function toTime(m){m=Math.max(0,Math.min(1439,m));return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
function endTime(s,d){return toTime(toMin(s)+Number(d||60))}
function nextId(){return 'local-'+Date.now()}
function accent(e){return CATEGORY_COLORS[e.category]||CATEGORY_COLORS.Privat}
function byDate(es){return es.reduce((a,e)=>{(a[e.date]??=[]).push(e);return a},{})}
function titleDate(d,es){const e=es.find(x=>x.date===d), dt=new Date(d+'T12:00');return `${e?e.weekday:''}, ${dt.toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'})}`}
function legend(){return `<div class="legend"><span><i style="background:${CATEGORY_COLORS.Arbeit}"></i>Arbeit</span><span><i style="background:${CATEGORY_COLORS.Privat}"></i>Privat</span></div>`}
function addRow(){return `<button class="ios-action-row" onclick="openEventModal()"><span>＋</span><b>Neuer Termin</b></button>`}
function suggestedTimeFor(c){return c==='Arbeit'?'09:00':'18:00'}
function hasConflict(c,es){const cs=toMin(c.start), ce=toMin(c.end);return es.filter(e=>e.date===c.date&&String(e.id)!==String(c.id)).find(e=>{const s=toMin(e.start),en=toMin(e.end||e.start);return !(ce<=s||cs>=en)})}
function dates(d,n){const out=[],x=new Date(d+'T12:00');for(let i=0;i<=n;i++){const y=new Date(x);y.setDate(x.getDate()+i);out.push(y.toISOString().slice(0,10))}return out}
function scanStartTimes(fromMin=420,toMin=1260,step=15){const out=[];for(let m=fromMin;m<=toMin;m+=step)out.push(toTime(m));return out}
function nextFreeSlots(ev,fixed,count=3){
  const duration=Number(ev.duration||60);
  const startDate=ev.date;
  const startMinute=Math.max(420,toMin(ev.start||'07:00'));
  const suggestions=[];
  for(const date of dates(startDate,7)){
    const from=date===startDate?startMinute:420;
    for(const start of scanStartTimes(from,1260,15)){
      const c={...ev,date,start,end:endTime(start,duration)};
      if(!hasConflict(c,fixed)){
        suggestions.push(c);
        if(suggestions.length>=count)return suggestions;
      }
    }
  }
  return suggestions;
}
function fmtSuggestion(s){return `${new Date(s.date+'T12:00').toLocaleDateString('de-CH',{weekday:'short',day:'2-digit',month:'2-digit'})} · ${s.start}–${s.end}`}
function conflictUI(cand,con){
  window._candidate=cand;window._conflict=con;
  const all=(window._base||[]).concat(localEvents());
  const newSlots=nextFreeSlots(cand,all.filter(e=>String(e.id)!==String(cand.id)),3);
  const oldSlots=nextFreeSlots(con,all.filter(e=>String(e.id)!==String(con.id)).concat([cand]),3);
  window._newSlots=newSlots; window._oldSlots=oldSlots;
  return `<div class="conflict-box"><b>Terminkonflikt</b>
    <p>Der neue Termin <strong>„${esc(cand.title)}“</strong> (${cand.start}–${cand.end}) überschneidet sich mit <strong>„${esc(con.title)}“</strong> (${con.start}–${con.end}).</p>
    <div class="conflict-section"><h4>Option A: neuen Termin verschieben</h4>${renderSlotButtons('new',newSlots)}</div>
    <div class="conflict-section"><h4>Option B: bestehenden Termin verschieben</h4>${renderSlotButtons('old',oldSlots)}</div>
    <button class="secondary-btn full-width" onclick="manualPicker()">Selbst Zeitpunkt wählen</button>
    <div id="manualArea"></div>
  </div>`
}
function renderSlotButtons(mode,slots){
  if(!slots.length)return `<p class="no-slot">Keine freie Möglichkeit gefunden.</p>`;
  return `<div class="slot-list">${slots.map((s,i)=>`<button class="slot-choice" onclick="applyChoice('${mode}',${i})"><b>${fmtSuggestion(s)}</b><span>Nächste freie Möglichkeit</span></button>`).join('')}</div>`
}
function manualPicker(){document.getElementById('manualArea').innerHTML=`<div class="manual-switch"><button onclick="manualUI('new')">Neuen Termin wählen</button><button onclick="manualUI('old')">Bestehenden Termin wählen</button></div>`}
function manualUI(m){const base=m==='new'?window._candidate:window._conflict;document.getElementById('manualArea').innerHTML=`<div class="manual-choice"><label>Datum</label><input id="manualDate" type="date" value="${base.date}"><label>Startzeit</label><input id="manualStart" type="time" value="${base.start}"><button class="add-btn" onclick="applyManual('${m}')">Übernehmen</button></div>`}
function override(e){return {...e,id:String(e.id).startsWith('local-')||String(e.id).startsWith('edited-')?e.id:'edited-'+e.id,originalId:String(e.id).startsWith('local-')?null:(e.originalId||e.id),edited:true}}
function persist(e){const l=localEvents().filter(x=>String(x.id)!==String(e.id));l.push(e);saveLocalEvents(l);closeEventModal();location.reload()}
function persistBoth(n,o){const moved=override(o), l=localEvents().filter(e=>String(e.id)!==String(n.id)&&String(e.id)!==String(moved.id)&&String(e.originalId)!==String(moved.originalId));l.push(n,moved);saveLocalEvents(l);closeEventModal();location.reload()}
function applyChoice(m,i){if(m==='new'){const s=(window._newSlots||[])[i];if(!s)return alert('Bitte selbst wählen.');persist(s)}else{const s=(window._oldSlots||[])[i];if(!s)return alert('Bitte selbst wählen.');persistBoth(window._candidate,{...window._conflict,...s,rescheduledByConflict:true})}}
function applyManual(m){const date=document.getElementById('manualDate').value,start=document.getElementById('manualStart').value;if(!start)return alert('Bitte Startzeit wählen.');if(m==='new'){const c={...window._candidate,date,start,end:endTime(start,window._candidate.duration)};persist(c)}else{const o={...window._conflict,date,start,end:endTime(start,window._conflict.duration),rescheduledByConflict:true};persistBoth(window._candidate,o)}}
function openEventModal(){const o=document.createElement('div');o.className='modal-overlay';o.id='eventModal';o.innerHTML=`<div class="bottom-sheet"><div class="sheet-handle"></div><h2>Neuer Termin</h2><label>Titel *</label><input id="newTitle"><label>Kategorie *</label><select id="newCategory"><option value="">Bitte wählen</option><option>Arbeit</option><option>Privat</option></select><label>Datum *</label><input id="newDate" type="date" value="${START_DATE}"><label>Startzeit optional</label><input id="newStart" type="time"><label>Dauer *</label><input id="newDuration" type="number" value="60" min="15" step="15"><label>Ort</label><input id="newLocation"><div id="conflictArea"></div><div class="sheet-actions"><button class="secondary-btn" onclick="closeEventModal()">Abbrechen</button><button class="add-btn" onclick="saveNewEvent()">Speichern</button></div></div>`;document.body.appendChild(o)}
function closeEventModal(){document.getElementById('eventModal')?.remove()}
async function saveNewEvent(){const title=document.getElementById('newTitle').value.trim(),cat=document.getElementById('newCategory').value,dur=Number(document.getElementById('newDuration').value||0);if(!title)return alert('Bitte Titel eingeben.');if(!cat)return alert('Bitte Kategorie auswählen.');if(!dur)return alert('Bitte Dauer eingeben.');const date=document.getElementById('newDate').value,start=document.getElementById('newStart').value||suggestedTimeFor(cat),ev={id:nextId(),date,weekday:new Date(date+'T12:00').toLocaleDateString('de-CH',{weekday:'long'}),start,end:endTime(start,dur),title,duration:dur,location:document.getElementById('newLocation').value.trim(),category:cat,group:cat,timeWasSuggested:!document.getElementById('newStart').value};window._base=(await loadJSON(DATA_URL)).map(norm);const con=hasConflict(ev,window._base.concat(localEvents()));if(con){document.getElementById('conflictArea').innerHTML=conflictUI(ev,con);return}persist(ev)}
function eventRow(e){const st=e.rescheduledByConflict?'Verschoben':(e.timeWasSuggested?'KI':'');return `<article class="event-card-ios" onclick="openEditEventModal('${e.id}')"><div class="ios-time">${e.start}<span>${e.end||''}</span></div><div class="ios-event-main"><div class="ios-event-title"><span class="category-dot-ios" style="background:${accent(e)}"></span>${esc(e.title)}</div><p>${esc(e.location||'Kein Ort')} · ${e.category}</p></div>${st?`<div class="ios-status">${st}</div>`:''}</article>`}
function openEditEventModal(id){loadEvents().then(es=>{const e=es.find(x=>String(x.id)===String(id));if(!e)return;const o=document.createElement('div');o.className='modal-overlay';o.id='eventModal';o.innerHTML=`<div class="bottom-sheet"><div class="sheet-handle"></div><h2>Termin anpassen</h2><label>Titel</label><input id="editTitle" value="${esc(e.title)}"><label>Kategorie</label><select id="editCategory"><option ${e.category==='Arbeit'?'selected':''}>Arbeit</option><option ${e.category==='Privat'?'selected':''}>Privat</option></select><label>Datum</label><input id="editDate" type="date" value="${e.date}"><label>Startzeit</label><input id="editStart" type="time" value="${e.start}"><label>Dauer</label><input id="editDuration" type="number" value="${e.duration}" min="15" step="15"><label>Ort</label><input id="editLocation" value="${esc(e.location||'')}"><div class="sheet-actions three"><button class="secondary-btn" onclick="closeEventModal()">Abbrechen</button><button class="danger-btn" onclick="deleteEvent('${e.id}')">Löschen</button><button class="add-btn" onclick="saveEditedEvent('${e.id}')">Speichern</button></div></div>`;document.body.appendChild(o)})}
async function saveEditedEvent(id){const all=await loadEvents(),o=all.find(e=>String(e.id)===String(id));if(!o)return;const cat=document.getElementById('editCategory').value,dur=Number(document.getElementById('editDuration').value||60),start=document.getElementById('editStart').value,up=override({...o,title:document.getElementById('editTitle').value.trim(),category:cat,group:cat,date:document.getElementById('editDate').value,start,end:endTime(start,dur),duration:dur,location:document.getElementById('editLocation').value.trim()});const l=localEvents().filter(e=>String(e.id)!==String(id)&&String(e.originalId)!==String(id));l.push(up);saveLocalEvents(l);closeEventModal();location.reload()}
function deleteEvent(id){const l=localEvents(),m=String(id).startsWith('local-')||String(id).startsWith('edited-')?[]:[{id:'deleted-'+id,originalId:id,deleted:true,date:'9999-12-31',start:'23:59',end:'23:59',title:'',duration:0,category:'Privat',group:'Privat'}];saveLocalEvents(l.filter(e=>String(e.id)!==String(id)&&String(e.originalId)!==String(id)).concat(m));closeEventModal();location.reload()}
function timelineEvent(e,s,e2){const st=toMin(e.start),en=toMin(e.end||e.start),tot=e2-s,top=Math.max(0,((st-s)/tot)*100),h=Math.max(18,((en-st)/tot)*100);return `<div class="timeline-event" style="top:${top}%;height:${h}%;border-color:${accent(e)}"><b>${esc(e.title)}</b><span>${e.start} · ${e.category}</span></div>`}
function homeTimeline(es,date){const start=420,end=1260,day=es.filter(e=>e.date===date&&toMin(e.end||e.start)>=start&&toMin(e.start)<=end),hrs=[];for(let t=start;t<=end;t+=60)hrs.push(t);const nowTop=((toMin(DEMO_NOW)-start)/(end-start))*100;return `<div class="timeline-card full-day"><div class="timeline-grid">${hrs.map(t=>`<div class="timeline-hour" style="top:${((t-start)/(end-start))*100}%">${toTime(t)}</div>`).join('')}${date===START_DATE?`<div class="now-line" style="top:${nowTop}%"><span>Jetzt ${DEMO_NOW}</span></div>`:''}${day.map(e=>timelineEvent(e,start,end)).join('')}</div></div>`}
function goalProgress(g){return Math.min(100,Math.round((Number(g.current||0)/Number(g.target||1))*100))}
function goalRow(g){return `<article class="goal-row"><div><div class="ios-event-title"><span class="category-dot-ios" style="background:${CATEGORY_COLORS[g.category]}"></span>${esc(g.title)}</div><p>Bis ${new Date(g.targetDate+'T12:00').toLocaleDateString('de-CH')} · ${g.current}/${g.target} ${esc(g.unit)}</p></div><b>${goalProgress(g)}%</b></article>`}
async function renderHome(){try{init('home');const es=await loadEvents();const date=getSelectedDate();document.getElementById('content').innerHTML=`<div class="date-header"><button onclick="shiftSelectedDate(-1)">‹</button><div class="large-title-block"><p>${date===START_DATE?'Heute':'Ausgewählter Tag'}</p><h1>${sameDayLabel(date,es)}</h1></div><button onclick="shiftSelectedDate(1)">›</button></div>${legend()}${homeTimeline(es,date)}`;}catch(e){showError(e)}}
async function renderCategory(k){try{init(k==='Arbeit'?'work':'private');const es=(await loadEvents()).filter(e=>e.category===k),g=byDate(es);document.getElementById('content').innerHTML=`<div class="large-title-block"><p>${es.length} Termine</p><h1>${k}</h1></div>${legend()}${addRow()}${Object.keys(g).sort().map(d=>`<div class="day-block"><div class="day-title">${titleDate(d,es)}</div><div class="ios-grouped-list">${g[d].map(eventRow).join('')}</div></div>`).join('')}`;}catch(e){showError(e)}}
async function renderPlan(){try{init('plan');const es=await loadEvents(),g=byDate(es),days=Object.keys(g).sort().slice(0,7);document.getElementById('content').innerHTML=`<div class="large-title-block"><p>Übersicht</p><h1>Wochenplan</h1></div>${legend()}<div class="week-grid">${days.map(d=>{const w=g[d].filter(e=>e.category==='Arbeit').length,p=g[d].filter(e=>e.category==='Privat').length;return `<div class="week-day"><b>${new Date(d+'T12:00').toLocaleDateString('de-CH',{weekday:'short'})}</b><span>${g[d].length}</span><div><i style="height:${Math.max(8,w*8)}px;background:${CATEGORY_COLORS.Arbeit}"></i><i style="height:${Math.max(8,p*8)}px;background:${CATEGORY_COLORS.Privat}"></i></div></div>`}).join('')}</div><div class="ios-grouped-list week-list">${days.map(d=>`<div class="week-row"><b>${new Date(d+'T12:00').toLocaleDateString('de-CH',{weekday:'short'})}</b><span>${g[d].slice(0,2).map(e=>e.title).join(', ')}</span></div>`).join('')}</div>`;}catch(e){showError(e)}}
async function renderGoals(){try{init('goals');const gs=await loadJSON(GOALS_URL);document.getElementById('content').innerHTML=`<div class="large-title-block"><p>Zeitraum & Fortschritt</p><h1>Ziele</h1></div>${legend()}<div class="ios-grouped-list">${gs.map(goalRow).join('')}</div>`;}catch(e){showError(e)}}
function renderProfile(){init('');document.getElementById('content').innerHTML=`<div class="large-title-block"><p>Persönliche Angaben</p><h1>Profil</h1></div><div class="ios-grouped-list"><div class="profile-placeholder">Profilinformationen bleiben über diesen Bereich erreichbar.</div></div>`}
