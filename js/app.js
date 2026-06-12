
const DATA_URL='./data/kalender.json';
const WEATHER_URL='./data/weather.json';
const GOALS_URL='./data/goals.json';
const START_DATE='2026-07-06';

const icons={
  home:`<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V21h13V10.5"/><path d="M9.5 21v-6h5v6"/></svg>`,
  work:`<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="13" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M4 12h16"/></svg>`,
  free:`<svg viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M6 7c3 0 6 2 6 5-3 0-6-2-6-5Z"/><path d="M18 7c-3 0-6 2-6 5 3 0 6-2 6-5Z"/></svg>`,
  plan:`<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></svg>`,
  profile:`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.8-4.3 13.2-4.3 15 0"/></svg>`
};

function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function safeJSON(key, fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}}
async function loadJSON(url){const r=await fetch(url); if(!r.ok) throw new Error(url+' konnte nicht geladen werden'); return r.json()}
function localEvents(){return safeJSON('ikigai_events',[])}
function saveLocalEvents(events){localStorage.setItem('ikigai_events',JSON.stringify(events))}
async function loadEvents(){
  const base=await loadJSON(DATA_URL);
  const locals=localEvents();
  const deleted=new Set(locals.filter(e=>e.deleted).map(e=>String(e.originalId)));
  const edited=new Set(locals.filter(e=>e.originalId && !e.deleted).map(e=>String(e.originalId)));
  return [...base.filter(e=>!deleted.has(String(e.id)) && !edited.has(String(e.id))),...locals.filter(e=>!e.deleted)].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start))
}
function defaultProfile(){return {firstName:'',lastName:'',email:'',phone:'',age:'',gender:'',privateAddress:'',businessAddress:'',weeklyHours:40,workDays:['Montag','Dienstag','Mittwoch','Donnerstag','Freitag'],categoryPriorities:{Arbeit:5,Gesundheit:4,Sozial:3,Freiraum:4}}}
function loadProfile(){const p={...defaultProfile(),...safeJSON('ikigai_profile',{})}; p.categoryPriorities={...defaultProfile().categoryPriorities,...(p.categoryPriorities||{})}; p.workDays=p.workDays||defaultProfile().workDays; return p}
function saveProfile(){
  const profile=loadProfile();
  profile.firstName=document.getElementById('profileFirstName').value.trim();
  profile.lastName=document.getElementById('profileLastName').value.trim();
  profile.email=document.getElementById('profileEmail').value.trim();
  profile.phone=document.getElementById('profilePhone').value.trim();
  profile.age=document.getElementById('profileAge').value;
  profile.gender=document.getElementById('profileGender').value;
  profile.privateAddress=document.getElementById('profilePrivateAddress').value.trim();
  profile.businessAddress=document.getElementById('profileBusinessAddress').value.trim();
  profile.weeklyHours=Number(document.getElementById('profileWeeklyHours').value||0);
  profile.workDays=[...document.querySelectorAll('.workday-toggle.active')].map(b=>b.dataset.day);
  localStorage.setItem('ikigai_profile',JSON.stringify(profile));
  flash('profileSavedNote');
}
function saveCategoryPriorities(){
  const profile=loadProfile();
  const cats=['Arbeit','Gesundheit','Sozial','Freiraum'];
  const values=cats.map(c=>Number(document.getElementById('priority'+c).value));
  if(new Set(values).size !== values.length){
    const note=document.getElementById('prioritySavedNote');
    if(note){note.textContent='Jede Priorität darf nur einmal vorkommen.'; note.style.color='#FF3B30'}
    return;
  }
  cats.forEach(c=>profile.categoryPriorities[c]=Number(document.getElementById('priority'+c).value));
  localStorage.setItem('ikigai_profile',JSON.stringify(profile));
  const note=document.getElementById('prioritySavedNote'); if(note) note.style.color='#34C759';
  flash('prioritySavedNote');
}
function flash(id){const el=document.getElementById(id); if(el){el.textContent='Gespeichert'; setTimeout(()=>el.textContent='',1600)}}
function priorityFor(category){return loadProfile().categoryPriorities[category]||3}
function priorityLabel(v){v=Number(v); return v>=5?'Sehr hoch':v===4?'Hoch':v===3?'Mittel':v===2?'Niedrig':'Sehr niedrig'}

function nav(active){return `<nav class="nav">${[['index.html','home','Home'],['arbeit.html','work','Arbeit'],['freizeit.html','free','Freizeit'],['wochenplan.html','plan','Plan'],['profil.html','profile','Profil']].map(([href,key,label])=>`<a class="${active===key?'active':''}" href="${href}">${icons[key]}${label}</a>`).join('')}</nav>`}
function header(){return `<header class="header"><div class="logo">IkigAI</div><div class="header-actions"><a class="icon-btn" href="profil.html">${icons.profile}</a></div></header>`}
function init(active){const app=document.getElementById('app'); app.insertAdjacentHTML('afterbegin',header()); app.insertAdjacentHTML('beforeend',nav(active));}
function showError(err){console.error(err); document.getElementById('content').innerHTML=`<div class="card"><h2>Fehler beim Laden</h2><p>${esc(err.message||err)}</p><p>Bitte prüfe, ob die Dateien im Ordner data/ vorhanden sind.</p></div>`}

function toMin(t){if(!t||!t.includes(':'))return 0; const [h,m]=t.split(':').map(Number); return h*60+m}
function toTime(m){m=Math.max(360,Math.min(1320,m)); return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
function endTime(start,duration){return toTime(toMin(start)+Number(duration||60))}
function nextLocalId(){return 'local-'+Date.now()}
function suggestedTimeFor(category){
  const high=priorityFor(category)>=4;
  if(category==='Arbeit') return high?'09:00':'14:00';
  
  if(category==='Gesundheit') return high?'18:00':'19:30';
  if(category==='Sozial') return high?'19:00':'20:00';
  if(category==='Freiraum') return high?'17:30':'20:30';
  return '09:00';
}
function hasConflict(candidate, events){
  const cs=toMin(candidate.start), ce=toMin(candidate.end);
  return events.filter(e=>e.date===candidate.date).find(e=>{
    const s=toMin(e.start), en=toMin(e.end||e.start);
    return !(ce<=s || cs>=en);
  });
}
function nextDates(date,days){
  const out=[];
  const d=new Date(date+'T12:00');
  for(let i=1;i<=days;i++){
    const n=new Date(d);
    n.setDate(d.getDate()+i);
    out.push(n.toISOString().slice(0,10));
  }
  return out;
}
function preferredForCategory(category){
  const high=priorityFor(category)>=4;
  if(category==='Arbeit') return high?['09:00','10:00','14:00']:['14:00','15:00','16:00'];
  if(category==='Gesundheit') return high?['07:00','18:00','18:30']:['18:30','19:00','19:30'];
  if(category==='Sozial') return high?['18:00','19:00','20:00']:['19:00','20:00'];
  if(category==='Freiraum') return high?['12:30','17:30','20:00']:['20:00','20:30'];
  return ['09:00','14:00','18:00'];
}
function suggestionReason(event, date, start, score){
  const parts=[];
  if(date===event.date) parts.push('gleicher Tag');
  else parts.push('nächster passender Tag');
  if(preferredForCategory(event.category).includes(start)) parts.push('passende Tageszeit für '+event.category);
  if(priorityFor(event.category)>=4) parts.push('hohe Priorität berücksichtigt');
  if(event.category==='Freiraum') parts.push('guter Erholungszeitpunkt');
  if(event.category==='Arbeit') parts.push('produktiver Arbeitsblock');
  return parts.join(' · ') + ' · Score ' + score;
}
function scoreSlot(event, date, start){
  let score=50;
  const hour=Number(start.split(':')[0]);
  const prio=priorityFor(event.category);
  score += prio*8;
  if(date===event.date) score += 12;
  else score -= 4;
  if(preferredForCategory(event.category).includes(start)) score += 18;
  if(event.category==='Arbeit' && hour>=9 && hour<=11) score += 10;
  if(event.category==='Gesundheit' && (hour===7 || hour>=18)) score += 10;
  if(event.category==='Sozial' && hour>=18) score += 10;
  if(event.category==='Freiraum' && (hour===12 || hour>=17)) score += 10;
  if(hour>=20 && event.category==='Arbeit') score -= 18;
  return Math.max(0, Math.min(100, score));
}
function findSuggestedSlots(eventToMove, fixedEvents){
  const duration=Number(eventToMove.duration||60);
  const fallback=['08:00','08:30','09:00','09:30','10:00','10:30','11:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'];
  const dates=[eventToMove.date].concat(nextDates(eventToMove.date,7));
  const suggestions=[];
  for(const date of dates){
    const slots=[...new Set(preferredForCategory(eventToMove.category).concat(fallback))];
    for(const start of slots){
      const candidate={...eventToMove,date,start,end:endTime(start,duration)};
      const conflict=hasConflict(candidate,fixedEvents.filter(e=>String(e.id)!==String(eventToMove.id)&&String(e.originalId)!==String(eventToMove.id)));
      if(!conflict){
        const score=scoreSlot(eventToMove,date,start);
        suggestions.push({...candidate,score,reason:suggestionReason(eventToMove,date,start,score)});
      }
    }
  }
  return suggestions.sort((a,b)=>b.score-a.score || a.date.localeCompare(b.date) || a.start.localeCompare(b.start)).slice(0,3);
}
function applyConflictSuggestion(index){
  const candidate=window._pendingConflictCandidate;
  const conflict=window._pendingConflictEvent;
  if(!candidate || !conflict) return;
  const suggestions=window._pendingConflictSuggestions || [];
  const chosen=suggestions[index];
  if(!chosen) return;
  rescheduleConflictAndSave(candidate, conflict, chosen);
}
function makeLocalOverride(event, patch={}){
  return {
    ...event,
    ...patch,
    id:String(event.id).startsWith('local-') || String(event.id).startsWith('edited-') ? event.id : 'edited-'+event.id,
    originalId:String(event.id).startsWith('local-') ? null : (event.originalId || event.id),
    edited:true
  };
}
function rescheduleConflictAndSave(newEvent, conflict, chosenSuggestion=null){
  const baseEvents=conflictBaseEvents.length?conflictBaseEvents:[];
  const all=baseEvents.concat(localEvents());
  const fixedEvents=all.filter(e=>String(e.id)!==String(conflict.id)&&String(e.originalId)!==String(conflict.id)&&String(e.id)!==String(newEvent.id));
  const suggestions=findSuggestedSlots(conflict,fixedEvents.concat([newEvent]));
  if(!chosenSuggestion){
    window._pendingConflictSuggestions=suggestions;
    if(!suggestions.length){
      document.getElementById('conflictArea').innerHTML='<div class="conflict-box"><b>Kein guter Vorschlag gefunden</b><p>IkigAI konnte keinen sinnvollen freien Zeitpunkt finden. Bitte passe eine Zeit manuell an.</p></div>';
      return;
    }
    document.getElementById('conflictArea').innerHTML=renderSuggestionChoices(conflict,suggestions);
    return;
  }
  const movedOverride=makeLocalOverride(conflict,{
    date:chosenSuggestion.date,
    weekday:new Date(chosenSuggestion.date+'T12:00').toLocaleDateString('de-CH',{weekday:'long'}),
    start:chosenSuggestion.start,
    end:chosenSuggestion.end,
    description:(conflict.description||'') + ' · verschoben nach IkigAI-Vorschlag',
    rescheduledByConflict:true,
    rescheduleReason:chosenSuggestion.reason
  });
  const locals=localEvents().filter(e=>String(e.id)!==String(newEvent.id)&&String(e.originalId)!==String(newEvent.id)&&String(e.id)!==String(movedOverride.id)&&String(e.originalId)!==String(movedOverride.originalId));
  locals.push(newEvent);
  locals.push(movedOverride);
  saveLocalEvents(locals);
  closeEventModal();
  location.reload();
}
function renderSuggestionChoices(conflict, suggestions){
  return `<div class="conflict-box"><b>IkigAI Vorschläge für „${esc(conflict.title)}“</b>
    <p>Wähle einen vorgeschlagenen neuen Zeitpunkt für den bestehenden Termin.</p>
    <div class="suggestion-list">
      ${suggestions.map((s,i)=>`<button class="suggestion-choice" onclick="applyConflictSuggestion(${i})">
        <b>${new Date(s.date+'T12:00').toLocaleDateString('de-CH',{weekday:'short',day:'2-digit',month:'2-digit'})} · ${s.start}–${s.end}</b>
        <span>${esc(s.reason)}</span>
      </button>`).join('')}
    </div>
    <button class="secondary-btn full-width" onclick="suggestAlternativeTime()">Zeit des neuen Termins anpassen</button>
  </div>`
}

let conflictBaseEvents=[];
function suggestAlternativeTime(){
  const category=document.getElementById('newCategory').value;
  const date=document.getElementById('newDate').value;
  const duration=Number(document.getElementById('newDuration').value||60);
  const slots=priorityFor(category)>=4?['08:00','09:00','10:00','14:00','16:00','18:00','20:00']:['11:00','13:00','15:00','17:00','19:00','20:00'];
  for(const start of slots){
    const cand={date,start,end:endTime(start,duration)};
    if(!hasConflict(cand,[...conflictBaseEvents,...localEvents()])){
      document.getElementById('newStart').value=start;
      document.getElementById('conflictArea').innerHTML=`<p class="saved-note">Alternative Zeit vorgeschlagen: ${start}</p>`;
      return;
    }
  }
  document.getElementById('conflictArea').innerHTML=`<p class="sheet-note">Keine freie Alternative gefunden. Bitte manuell anpassen oder ignorieren.</p>`;
}
function conflictWarning(candidate, conflict){
  window._pendingConflictCandidate=candidate;
  window._pendingConflictEvent=conflict;
  const newPriority=priorityFor(candidate.category);
  const conflictPriority=priorityFor(conflict.category);
  const recommendation = newPriority > conflictPriority
    ? 'Der neue Termin hat eine höhere Priorität. IkigAI verschiebt den bestehenden Termin.'
    : newPriority < conflictPriority
      ? 'Der bestehende Termin hat eine höhere Priorität. IkigAI empfiehlt, zuerst die Zeit des neuen Termins anzupassen.'
      : 'Beide Termine haben die gleiche Priorität. IkigAI kann den bestehenden Termin auf den nächsten freien Slot verschieben.';
  return `<div class="conflict-box"><b>Terminkonflikt erkannt</b>
    <p>Überschneidung mit „${esc(conflict.title)}“ (${conflict.start}–${conflict.end}).</p>
    <div class="priority-compare">
      <div><span>Neuer Termin</span><b>${esc(candidate.category)} · Priorität ${newPriority}</b></div>
      <div><span>Bestehender Termin</span><b>${esc(conflict.category)} · Priorität ${conflictPriority}</b></div>
    </div>
    <p><strong>IkigAI Empfehlung:</strong> ${recommendation}</p>
    <div class="conflict-actions"><button class="secondary-btn" onclick="suggestAlternativeTime()">Zeit des neuen Termins anpassen</button><button class="danger-btn" onclick="rescheduleConflictAndSave(window._pendingConflictCandidate, window._pendingConflictEvent)">Vorschläge anzeigen</button></div></div>`
}

function addEventButton(defaultCategory='Arbeit'){return `<button class="floating-add" onclick="openEventModal('${defaultCategory}')" aria-label="Neuer Termin">+</button>`}
function addEventCard(defaultCategory='Arbeit'){return `<button class="add-event-card" onclick="openEventModal('${defaultCategory}')"><span>+</span><div><b>Neuer Termin</b><p>Termin manuell erfassen oder Zeit von IkigAI vorschlagen lassen</p></div></button>`}
function openEventModal(defaultCategory='Arbeit'){
  const overlay=document.createElement('div'); overlay.className='modal-overlay'; overlay.id='eventModal';
  overlay.innerHTML=`<div class="bottom-sheet"><div class="sheet-handle"></div><h2>Neuer Termin</h2>
    <label>Titel</label><input id="newTitle" placeholder="z.B. Kundenmeeting">
    <label>Kategorie *</label><select id="newCategory">
      <option value="">Bitte Kategorie wählen</option>
      ${['Arbeit','Gesundheit','Sozial','Freiraum'].map(c=>`<option value="${c}">${c}</option>`).join('')}
    </select>
    <label>Datum *</label><input id="newDate" type="date" value="${START_DATE}">
    <label>Startzeit optional</label><input id="newStart" type="time">
    <label>Dauer in Minuten *</label><input id="newDuration" type="number" value="60" min="15" step="15">
    <label>Ort</label><input id="newLocation" placeholder="z.B. Büro, Zuhause, Draussen">
    <div id="conflictArea"></div>
    <div class="sheet-actions"><button class="secondary-btn" onclick="closeEventModal()">Abbrechen</button><button class="add-btn" onclick="saveNewEvent(false)">Speichern</button></div>
    <p class="sheet-note">Titel, Kategorie und Dauer sind Pflichtfelder. Ohne Startzeit vergibt IkigAI einen Zeitvorschlag anhand deiner Kategorie-Prioritäten.</p></div>`;
  document.body.appendChild(overlay);
}
function closeEventModal(){document.getElementById('eventModal')?.remove()}
async function openEditEventModal(id){
  const events=await loadEvents();
  const event=events.find(e=>String(e.id)===String(id));
  if(!event) return;
  const overlay=document.createElement('div'); overlay.className='modal-overlay'; overlay.id='eventModal';
  overlay.innerHTML=`<div class="bottom-sheet"><div class="sheet-handle"></div><h2>Termin anpassen</h2>
    <label>Titel</label><input id="editTitle" value="${esc(event.title)}">
    <label>Datum</label><input id="editDate" type="date" value="${event.date}">
    <label>Startzeit</label><input id="editStart" type="time" value="${event.start}">
    <label>Dauer in Minuten</label><input id="editDuration" type="number" value="${event.duration}" min="15" step="15">
    <label>Ort</label><input id="editLocation" value="${esc(event.location||'')}">
    <label>Kategorie</label><select id="editCategory">${['Arbeit','Gesundheit','Sozial','Freiraum'].map(c=>`<option ${c===event.category?'selected':''}>${c}</option>`).join('')}</select>
    <div id="conflictArea"></div>
    <div class="sheet-actions three"><button class="secondary-btn" onclick="closeEventModal()">Abbrechen</button><button class="danger-btn" onclick="deleteEvent('${event.id}')">Löschen</button><button class="add-btn" onclick="saveEditedEvent('${event.id}', false)">Speichern</button></div>
    <p class="sheet-note">Excel-Basistermine werden beim Bearbeiten als lokale Kopie gespeichert. Die Original-JSON bleibt unverändert.</p></div>`;
  document.body.appendChild(overlay);
}
async function saveEditedEvent(id, ignoreConflict=false){
  const baseEvents=await loadJSON(DATA_URL);
  const locals=localEvents();
  const all=[...baseEvents,...locals];
  const original=all.find(e=>String(e.id)===String(id));
  if(!original) return;
  const category=document.getElementById('editCategory').value;
  const duration=Number(document.getElementById('editDuration').value||60);
  const start=document.getElementById('editStart').value || suggestedTimeFor(category);
  const date=document.getElementById('editDate').value;
  const updated={...original,
    id:String(id).startsWith('local-')?id:'edited-'+id,
    originalId:String(id).startsWith('edited-')?original.originalId:(String(id).startsWith('local-')?null:id),
    date,
    weekday:new Date(date+'T12:00').toLocaleDateString('de-CH',{weekday:'long'}),
    start,end:endTime(start,duration),
    title:document.getElementById('editTitle').value.trim(),
    duration,
    location:document.getElementById('editLocation').value.trim(),
    category,
    group:category==='Arbeit'?'Arbeit':'Freizeit',
    priority:String(priorityFor(category)),
    description:original.description || 'Manuell angepasst',
    timeWasSuggested:false,
    edited:true,
    conflictIgnored:ignoreConflict
  };
  if(!updated.title){alert('Bitte Titel eingeben.');return}
  const compare=all.filter(e=>String(e.id)!==String(id) && String(e.originalId)!==String(id));
  conflictBaseEvents=baseEvents.filter(e=>String(e.id)!==String(id));
  const conflict=hasConflict(updated,compare);
  if(conflict && !ignoreConflict){
    document.getElementById('conflictArea').innerHTML=conflictWarning(updated,conflict).replace('saveNewEvent(true)', `saveEditedEvent('${id}', true)`);
    return;
  }
  let newLocals=locals.filter(e=>String(e.id)!==String(id) && String(e.originalId)!==String(id));
  newLocals.push(updated);
  saveLocalEvents(newLocals);
  closeEventModal(); location.reload();
}
function deleteEvent(id){
  const locals=localEvents();
  const baseDeleted=String(id).startsWith('local-') || String(id).startsWith('edited-') ? [] : [{id:'deleted-'+id, originalId:id, deleted:true, date:'9999-12-31', start:'23:59', end:'23:59', title:'', duration:0, category:'Freiraum', group:'Freizeit'}];
  const newLocals=locals.filter(e=>String(e.id)!==String(id) && String(e.originalId)!==String(id)).concat(baseDeleted);
  saveLocalEvents(newLocals);
  closeEventModal(); location.reload();
}

async function saveNewEvent(ignoreConflict=false){
  const title=document.getElementById('newTitle').value.trim();
  const category=document.getElementById('newCategory').value;
  const duration=Number(document.getElementById('newDuration').value||0);
  if(!title){alert('Bitte Titel eingeben.');return}
  if(!category){alert('Bitte eine Kategorie auswählen.');return}
  if(!duration || duration <= 0){alert('Bitte eine gültige Dauer eingeben.');return}
  const date=document.getElementById('newDate').value;
  let start=document.getElementById('newStart').value;
  const suggested=!start;
  if(!start) start=suggestedTimeFor(category);
  const event={id:nextLocalId(),date,weekday:new Date(date+'T12:00').toLocaleDateString('de-CH',{weekday:'long'}),start,end:endTime(start,duration),title,description:'Manuell erfasst',duration,location:document.getElementById('newLocation').value.trim(),priority:String(priorityFor(category)),category,group:category==='Arbeit'?'Arbeit':'Freizeit',energy:'Mittel',timeWasSuggested:suggested,goalImpact:[],travelBefore:null,workLocationRecommendation:category==='Arbeit'?'Arbeitsort wird in der nächsten Optimierung empfohlen':null,weatherRecommendation:null,conflictIgnored:ignoreConflict};
  conflictBaseEvents=await loadJSON(DATA_URL);
  const conflict=hasConflict(event,[...conflictBaseEvents,...localEvents()]);
  if(conflict && !ignoreConflict){document.getElementById('conflictArea').innerHTML=conflictWarning(event,conflict);return}
  if(conflict && ignoreConflict){rescheduleConflictAndSave(event,conflict);return}
  const events=localEvents(); events.push(event); saveLocalEvents(events); closeEventModal(); location.reload();
}

function accent(e){if(e.group==='Arbeit')return'#007AFF';if(e.category==='Freiraum')return'#8E8E93';if(e.category==='Gesundheit')return'#34C759';if(e.category==='Sozial')return'#AF52DE';if(e.category==='Hund')return'#FF9500';return'#34C759'}
function groupLabel(e){if(e.group==='Arbeit')return'Arbeit';if(e.category==='Freiraum')return'Ruhezeit';return'Freizeit'}
function eventCard(e){
  const cls=e.group==='Arbeit'?'work':(e.category==='Freiraum'?'rest':'free');
  const status = e.rescheduledByConflict ? 'Verschoben' : (e.timeWasSuggested ? 'KI-Zeit' : '');
  return `<article class="card event-card compact-event editable-event" onclick="openEditEventModal('${e.id}')" style="--accent:${accent(e)}">
    <div class="time-col"><div class="event-time">${esc(e.start)}</div><div class="event-end">${esc(e.end||'')}</div></div>
    <div>
      <div class="event-title-row"><div class="event-title">${esc(e.title)}</div>${status?`<span class="mini-status">${status}</span>`:''}</div>
      <p class="compact-meta">${esc(e.location||'Kein Ort')} · ${esc(e.category)} · ${e.duration} Min.</p>
    </div>
  </article>`
}
function travelCard(t){
  if(!t)return'';
  return `<article class="card travel-card compact-travel">
    <div class="time-col"><div class="event-time">${t.start}</div><div class="event-end">${t.end}</div></div>
    <div><div class="event-title">Reisezeit</div><p class="compact-meta">${t.duration} Min. Puffer</p></div>
  </article>`
}
function eventWithTravel(e){return travelCard(e.travelBefore)+eventCard(e)}
function byDate(events){return events.reduce((a,e)=>{(a[e.date]??=[]).push(e);return a},{})}
function weekdayTitle(date,events){const e=events.find(x=>x.date===date); const d=new Date(date+'T12:00:00'); return `${e?e.weekday:''}, ${d.toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'})}`}
function weatherIcon(c){return c==='sun'?'☀️':c==='rain'?'🌧️':c==='storm'?'⛈️':'☁️'}
function weatherStrip(weather){return `<div class="weather-strip">${Object.entries(weather).slice(0,3).map(([d,w])=>`<div class="weather-mini"><b>${weatherIcon(w.condition)}</b><span>${new Date(d+'T12:00').toLocaleDateString('de-CH',{weekday:'short'})}</span><p>${w.temp}°</p></div>`).join('')}</div>`}
function stats(events){const sum=f=>events.filter(f).reduce((s,e)=>s+(e.duration||0),0),work=sum(e=>e.group==='Arbeit'),health=sum(e=>e.category==='Gesundheit'),social=sum(e=>e.category==='Sozial'),rest=sum(e=>e.category==='Freiraum'); const travel=events.reduce((s,e)=>s+(e.travelBefore?.duration||0),0); const ws=Math.max(35,Math.min(95,Math.round(100-Math.abs(work/60-32)*2.2))),hs=Math.max(35,Math.min(95,Math.round(55+health/60*7))),ss=Math.max(35,Math.min(95,Math.round(55+social/60*7))),rs=Math.max(30,Math.min(95,Math.round(45+rest/60*9))); return {workScore:ws,healthScore:hs,socialScore:ss,restScore:rs,balance:Math.round((ws+hs+ss+rs)/4),suggested:events.filter(e=>e.timeWasSuggested).length,travel}}
function goalProgress(events,goals){return goals.map(g=>{let count=0;if(g.id==='revenue')count=Math.round(events.filter(e=>e.group==='Arbeit').reduce((a,e)=>a+e.duration,0)/60);else count=events.filter(e=>e.goalImpact?.includes(g.id)).length;return {...g,count,pct:Math.min(100,Math.round(count/g.target*100))}})}
function goalCards(progress){return progress.map(g=>`<div class="card goal-card"><div><h3>${esc(g.title)}</h3><p>${g.count} / ${g.target} ${esc(g.unit)}</p></div><div class="progress" style="--w:${g.pct}%"><span></span></div></div>`).join('')}
function dailyEnergy(){return localStorage.getItem('ikigai_energy')||'neutral'}
function setEnergy(e){localStorage.setItem('ikigai_energy',e);renderProfile()}
function energyInsight(){const e=dailyEnergy();return e==='morning'?'Fokusarbeit wird bevorzugt vor 11:30 Uhr vorgeschlagen.':e==='evening'?'Anspruchsvolle Aufgaben werden eher am späteren Nachmittag platziert.':'Fokusblöcke werden gleichmäßig über den Tag verteilt.'}
function insights(events){const s=stats(events); return [`${s.suggested} Termine ohne Uhrzeit wurden automatisch mit einer KI-Zeit versehen.`,`${Math.round(s.travel/60*10)/10} Stunden Reisezeit/Puffer wurden berücksichtigt.`,energyInsight(),`Kategorie-Prioritäten beeinflussen neue KI-Zeitvorschläge.`,`Bei Terminkonflikten wirst du beim Erfassen gewarnt.`]}
function recommendedBlock(date,events){const work=events.filter(e=>e.group==='Arbeit').reduce((a,e)=>a+e.duration,0),energy=dailyEnergy(); const time=energy==='evening'?'15:00':energy==='morning'?'08:30':'09:00',end=energy==='evening'?'17:00':energy==='morning'?'10:30':'11:00'; return work<360?`<article class="card event-card" style="--accent:#007AFF"><div><div class="event-time">${time}</div><div class="event-end">${end}</div></div><div><div class="event-title">Empfohlene Fokusarbeit</div><p>${esc(energyInsight())}</p><div class="event-meta"><span class="pill work">KI-Vorschlag</span><span class="pill location">Zuhause empfohlen</span></div></div></article>`:`<article class="card event-card" style="--accent:#8E8E93"><div><div class="event-time">18:30</div><div class="event-end">19:00</div></div><div><div class="event-title">Empfohlene Ruhezeit</div><p>Regeneration nach intensiver Arbeit inklusive Reisezeit.</p><div class="event-meta"><span class="pill rest">KI-Vorschlag</span><span class="pill">30 Min.</span></div></div></article>`}

function toggleWorkday(btn){btn.classList.toggle('active')}
function profileForm(profile){const days=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag']; return `<div class="card profile-form-card"><h3>Persönliche Angaben</h3><div class="form-grid"><label>Vorname<input id="profileFirstName" value="${esc(profile.firstName)}" placeholder="Vorname"></label><label>Nachname<input id="profileLastName" value="${esc(profile.lastName)}" placeholder="Nachname"></label><label>Email<input id="profileEmail" type="email" value="${esc(profile.email)}" placeholder="name@email.com"></label><label>Telefonnummer<input id="profilePhone" value="${esc(profile.phone)}" placeholder="+41 ..."></label><label>Alter<input id="profileAge" type="number" min="0" value="${esc(profile.age)}"></label><label>Geschlecht<select id="profileGender">${['','Männlich','Weiblich','Divers','Keine Angabe'].map(g=>`<option value="${g}" ${profile.gender===g?'selected':''}>${g||'Bitte wählen'}</option>`).join('')}</select></label><label class="full">Private Adresse<textarea id="profilePrivateAddress">${esc(profile.privateAddress)}</textarea></label><label class="full">Geschäftsadresse<textarea id="profileBusinessAddress">${esc(profile.businessAddress)}</textarea></label><label class="full">Arbeitsstunden pro Woche<input id="profileWeeklyHours" type="number" min="0" max="100" value="${esc(profile.weeklyHours)}"></label></div><div class="workdays"><p>Arbeitstage der Woche</p><div class="workday-grid">${days.map(d=>`<button type="button" data-day="${d}" onclick="toggleWorkday(this)" class="workday-toggle ${profile.workDays.includes(d)?'active':''}">${d.slice(0,2)}</button>`).join('')}</div></div><button class="add-btn" onclick="saveProfile()">Persönliche Angaben speichern</button><p id="profileSavedNote" class="saved-note"></p></div>`}
function categoryPriorityForm(profile){const cats=['Arbeit','Gesundheit','Sozial','Freiraum'],labels={Arbeit:'Arbeit',Gesundheit:'Gesundheit / Sport',Sozial:'Sozialleben',Freiraum:'Ruhezeit / Freiraum'}; return `<div class="card priority-card"><h3>Kategorien priorisieren</h3><p>Höher priorisierte Kategorien werden bevorzugt. Jede Prioritätsstufe darf nur einmal vorkommen.</p>${cats.map(c=>`<div class="priority-row"><div><b>${labels[c]}</b><span id="priorityLabel${c}">${priorityLabel(profile.categoryPriorities[c])}</span></div><input type="range" min="1" max="5" value="${profile.categoryPriorities[c]}" id="priority${c}" oninput="document.getElementById('priorityLabel${c}').textContent=priorityLabel(this.value)"></div>`).join('')}<button class="add-btn" onclick="saveCategoryPriorities()">Prioritäten speichern</button><p id="prioritySavedNote" class="saved-note"></p></div>`}

async function renderHome(){try{
  init('home');
  document.getElementById('app').insertAdjacentHTML('beforeend',addEventButton('Arbeit'));
  const [events,weather,goals]=await Promise.all([loadEvents(),loadJSON(WEATHER_URL),loadJSON(GOALS_URL)]);
  const day=events.filter(e=>e.date===START_DATE);
  const s=stats(events);
  document.getElementById('content').innerHTML=`
    <div class="top-summary">
      <div><div class="hero-date">Heute</div><h1>${weekdayTitle(START_DATE,events)}</h1></div>
      <div class="small-score">${s.balance}</div>
    </div>
    ${weatherStrip(weather)}
    ${addEventCard('Arbeit')}
    <div class="quick-actions compact-actions">
      <a class="primary-tile" href="arbeit.html"><span>💼</span><b>Arbeit</b></a>
      <a class="primary-tile" href="freizeit.html"><span>🌿</span><b>Freizeit</b></a>
      <a class="primary-tile" href="wochenplan.html"><span>✨</span><b>Plan</b></a>
    </div>
    <div class="section-head"><h2>Heute</h2><a class="small-link" href="wochenplan.html">Woche</a></div>
    ${day.map(eventWithTravel).join('')}`;
}catch(e){showError(e)}}
async function renderList(kind){try{
  init(kind==='Arbeit'?'work':'free');
  document.getElementById('app').insertAdjacentHTML('beforeend',addEventButton(kind==='Arbeit'?'Arbeit':'Gesundheit'));
  const events=await loadEvents();
  const filtered=kind==='Arbeit'?events.filter(e=>e.group==='Arbeit'):events.filter(e=>e.group==='Freizeit');
  const g=byDate(filtered);
  document.getElementById('content').innerHTML=`
    <div class="top-summary"><div><h1>${kind}</h1><p>${filtered.length} Termine</p></div></div>
    ${addEventCard(kind==='Arbeit'?'Arbeit':'Gesundheit')}
    ${Object.keys(g).sort().map(d=>`<div class="day-block"><div class="day-title">${weekdayTitle(d,events)}</div>${g[d].map(eventWithTravel).join('')}</div>`).join('')}`;
}catch(e){showError(e)}}
async function renderPlan(){try{
  init('plan');
  const [events,weather,goals]=await Promise.all([loadEvents(),loadJSON(WEATHER_URL),loadJSON(GOALS_URL)]);
  const s=stats(events),g=byDate(events);
  const insightList=insights(events).slice(0,3);
  document.getElementById('content').innerHTML=`
    <h1>Wochenplan</h1>
    <div class="score-card simple-score-card">
      <div><p style="color:rgba(255,255,255,.82)">IkigAI Score</p><div class="score-number">${s.balance}<span style="font-size:20px">/100</span></div></div>
      <div class="simple-metrics"><span>Arbeit ${s.workScore}%</span><span>Gesundheit ${s.healthScore}%</span><span>Erholung ${s.restScore}%</span></div>
    </div>
    <h2>Empfehlungen</h2>
    ${insightList.map(t=>`<div class="card insight compact-insight"><div class="check">✓</div><p>${esc(t)}</p></div>`).join('')}
    <h2>Woche</h2>
    ${Object.keys(g).sort().map(d=>`<div class="day-block"><div class="day-title">${weekdayTitle(d,events)}</div>${g[d].map(eventWithTravel).join('')}</div>`).join('')}`;
}catch(e){showError(e)}}
async function renderProfile(){try{init('profile'); const [events,goals]=await Promise.all([loadEvents(),loadJSON(GOALS_URL)]); const profile=loadProfile(),progress=goalProgress(events,goals),energy=dailyEnergy(); document.getElementById('content').innerHTML=`<h1>Profil</h1>${profileForm(profile)}${categoryPriorityForm(profile)}<div class="card"><h3>Tagesenergie</h3><p>${energyInsight()}</p><div class="preference" style="margin-top:12px"><button onclick="setEnergy('morning')" class="pref-btn ${energy==='morning'?'active':''}">Morgen</button><button onclick="setEnergy('neutral')" class="pref-btn ${energy==='neutral'?'active':''}">Neutral</button><button onclick="setEnergy('evening')" class="pref-btn ${energy==='evening'?'active':''}">Abend</button></div></div><h2>Ziele</h2>${goalCards(progress)}<div class="card"><h3>Aktivitäten → Ziele</h3><div class="list-row"><span>Joggen / Padel → 5 kg abnehmen</span></div><div class="list-row"><span>Freiraum → Stress reduzieren</span></div><div class="list-row"><span>Sozial → Familie & Freunde</span></div><div class="list-row"><span>Arbeit → Umsatz steigern</span></div></div><div class="card"><h3>Arbeitsorte</h3>${['Zuhause','Büro','Coworking','Café'].map(x=>`<div class="list-row"><span>${x}</span><span>✓</span></div>`).join('')}</div><div class="card" id="settings"><h3>Kalenderintegration</h3>${['Apple Calendar','Google Calendar','Outlook'].map(x=>`<div class="list-row"><span>${x}</span><button class="status-btn">Verbinden</button></div>`).join('')}</div>`;}catch(e){showError(e)}}
