// ------------------------------ APP DATI E STATO ------------------------------
let schede = JSON.parse(localStorage.getItem("schede")) || [];
let storico = JSON.parse(localStorage.getItem("storico")) || [];
let editing = { tipo:null, scheda:null, allenamento:null, esercizio:null, serie:null };
let modalità = "creazione"; // "creazione" | "allenamento"
let cronometroInterval = null;
let tempoTotale = 0;
let activeTimers = []; // keep background recover timers refs for cleanup

// ------------------------------ DOM ------------------------------
const main = document.getElementById("main");
const popup = document.getElementById("popup");
const popupInput = document.getElementById("popupInput");
const popupSave = document.getElementById("popupSave");
const popupCancel = document.getElementById("popupCancel");
const toggleModeBtn = document.getElementById("toggleMode");
const viewHistoryBtn = document.getElementById("viewHistory");

// ------------------------------ UTIL ------------------------------
function salvaSchede(){ localStorage.setItem("schede", JSON.stringify(schede)); }
function salvaStorico(){ localStorage.setItem("storico", JSON.stringify(storico)); }
function vibrate(ms){ if(navigator.vibrate) navigator.vibrate(ms); }

// play beep: try audio + notify SW
function playBeep(){
  try{
    const audio = new Audio('assets/beep.mp3');
    audio.play().catch(()=>{ /* ignore */ });
  }catch(e){}
  // notify SW for notification fallback
  if(navigator.serviceWorker && navigator.serviceWorker.controller){
    navigator.serviceWorker.controller.postMessage({ type:'playBeep' });
  }
  vibrate(160);
}

// safe helper to ensure arrays exist
function ensureStructure(){
  if(!Array.isArray(schede)) schede = [];
  schede.forEach(s=>{
    if(!Array.isArray(s.allenamenti)) s.allenamenti = [];
    s.allenamenti.forEach(a=>{
      if(!Array.isArray(a.esercizi)) a.esercizi = [];
      a.esercizi.forEach(e=>{
        if(!Array.isArray(e.serie)) e.serie = [];
      });
    });
  });
}
ensureStructure();

// ------------------------------ RENDER: SCHEDE ------------------------------
function renderSchede(){
  main.innerHTML = `<ul id="schedeList" class="list"></ul>
    ${modalità==="creazione"?'<button id="addSchedaBtn" class="btn">+ Aggiungi Scheda</button>':''}`;

  const schedeList = document.getElementById("schedeList");
  const addSchedaBtn = document.getElementById("addSchedaBtn");

  schede.forEach((s, si) => {
    const li = document.createElement("li"); li.className='card';
    li.innerHTML = `<span style="display:block;text-align:left;cursor:pointer;font-weight:700" onclick="mostraAllenamenti(${si})">${s.nome}</span>
      ${modalità==="creazione" ? `<div class="controls-row">
        <button onclick="editScheda(${si})" class="btn">✏️</button>
        <button onclick="deleteScheda(${si})" class="btn alt">🗑️</button>
      </div>` : ''}`;
    schedeList.appendChild(li);
  });

  if(modalità==="creazione" && addSchedaBtn){
    addSchedaBtn.onclick = ()=>{
      editing = { tipo:"scheda", index:null };
      popupInput.value = "";
      popup.classList.remove('hidden');
    };
  }
}

// ------------------------------ POPUP HANDLERS ------------------------------
popupCancel.onclick = ()=> popup.classList.add('hidden');
popupSave.onclick = ()=>{
  const nome = popupInput.value.trim();
  if(!nome) return;

  switch(editing.tipo){
    case "scheda":
      if(editing.index !== null) schede[editing.index].nome = nome;
      else schede.push({ nome, allenamenti: [] });
      salvaSchede(); popup.classList.add('hidden'); renderSchede(); break;

    case "allenamento":
      const si = editing.scheda, ai = editing.index;
      if(ai !== null) schede[si].allenamenti[ai].nome = nome;
      else schede[si].allenamenti.push({ nome, esercizi: [] });
      salvaSchede(); popup.classList.add('hidden'); mostraAllenamenti(si); break;

    case "esercizio":
      const si1 = editing.scheda, ai1 = editing.allenamento, ei = editing.index;
      if(ei !== null) schede[si1].allenamenti[ai1].esercizi[ei].nome = nome;
      else schede[si1].allenamenti[ai1].esercizi.push({ nome, serie: [], recupero:30 });
      salvaSchede(); popup.classList.add('hidden'); mostraEsercizi(si1, ai1); break;
  }
};

// ------------------------------ SCHEDE EDIT / DELETE ------------------------------
function editScheda(i){ editing={ tipo:"scheda", index:i }; popupInput.value = schede[i].nome; popup.classList.remove('hidden'); }
function deleteScheda(i){ if(!confirm("Eliminare questa scheda?")) return; schede.splice(i,1); salvaSchede(); renderSchede(); }

// ------------------------------ ALLENAMENTI ------------------------------
function mostraAllenamenti(si){
  const s = schede[si];
  ensureStructure();
  main.innerHTML = `<h2>${s.nome}</h2><ul id="allenamentiList" class="list"></ul>`;

  if(modalità==="creazione"){
    main.innerHTML += `<div class="controls-row"><button class="btn" onclick="aggiungiAllenamento(${si})">+ Aggiungi Allenamento</button></div>`;
  } else {
    // in modalità allenamento metti il bottone torna in alto
    const backBtn = document.createElement('button'); backBtn.className='btn'; backBtn.textContent='⬅ Torna';
    backBtn.onclick = ()=> renderSchede();
    main.insertBefore(backBtn, main.firstChild);
  }

  const list = document.getElementById('allenamentiList');
  s.allenamenti.forEach((a, ai)=>{
    const li = document.createElement('li'); li.className='card';
    // allow swipe delete on allenamenti (with confirmation)
    // simple delete button for desktop fallback
    li.innerHTML = `<span style="display:block;text-align:left;cursor:pointer;font-weight:700" onclick="mostraEsercizi(${si},${ai})">${a.nome}</span>
      ${modalità==="creazione"?`<div class="controls-row">
        <button onclick="editAllenamento(${si},${ai})" class="btn">✏️</button>
        <button onclick="deleteAllenamento(${si},${ai})" class="btn alt">🗑️</button>
      </div>` : ''}`;
    list.appendChild(li);
  });
}

function aggiungiAllenamento(si){ editing={ tipo:"allenamento", scheda:si, index:null }; popupInput.value=""; popup.classList.remove('hidden'); }
function editAllenamento(si,ai){ editing={ tipo:"allenamento", scheda:si, index:ai }; popupInput.value = schede[si].allenamenti[ai].nome; popup.classList.remove('hidden'); }
function deleteAllenamento(si,ai){ if(!confirm("Eliminare questo allenamento?")) return; schede[si].allenamenti.splice(ai,1); salvaSchede(); mostraAllenamenti(si); }

// ------------------------------ ESERCIZI (pagina allenamento) ------------------------------
function mostraEsercizi(si,ai){
  const a = schede[si].allenamenti[ai];
  ensureStructure();
  main.innerHTML = `<h2>${a.nome}</h2><ul id="eserciziList" class="list"></ul>`;

  // controls depending on mode
  if(modalità==="creazione"){
    main.innerHTML += `<div class="controls-row"><button class="btn" onclick="aggiungiEsercizio(${si},${ai})">+ Aggiungi Esercizio</button>
      <button class="btn" onclick="salvaAllenamento(${si},${ai})">💾 Salva</button></div>`;
  } else {
    // workout mode: back + start chrono controls at top
    const backBtn = document.createElement('button'); backBtn.className='btn'; backBtn.textContent='⬅ Torna';
    backBtn.onclick = ()=> mostraAllenamenti(si);
    main.insertBefore(backBtn, main.firstChild);

    const startBtn = document.createElement('button'); startBtn.className='btn'; startBtn.textContent='▶ Avvia Allenamento';
    startBtn.onclick = ()=>{
      clearInterval(cronometroInterval);
      tempoTotale = 0;
      cronometroInterval = setInterval(()=>{ tempoTotale++; updateCronometro(); },1000);
    };
    main.insertBefore(startBtn, backBtn.nextSibling);

    const chrono = document.createElement('div'); chrono.id='cronometro'; chrono.style.margin='8px';
    main.insertBefore(chrono, startBtn.nextSibling);
  }

  const list = document.getElementById('eserciziList');

  a.esercizi.forEach((e, ei)=>{
    // card wrapper for swipe
    const li = document.createElement('li'); li.className='card swipe-wrap';
    const swipeContent = document.createElement('div'); swipeContent.className='swipe-content';
    // content: name + recovery input
    const nameHtml = document.createElement('div');
    nameHtml.className = 'nomeEsercizio';
    nameHtml.innerHTML = `<input type="text" value="${e.nome}" onchange="modificaEsercizioNome(${si},${ai},${ei},this.value)">`;
    swipeContent.appendChild(nameHtml);

    const recHtml = document.createElement('div'); recHtml.className='recuperoEsercizio';
    recHtml.innerHTML = `Recupero: <input type="number" value="${e.recupero||30}" onchange="modificaRecupero(${si},${ai},${ei},this.value)"> s`;
    swipeContent.appendChild(recHtml);

    // series
    e.serie.forEach((s, si2)=>{
      const divS = document.createElement('div'); divS.className='serie';
      const row = document.createElement('div'); row.className='serie-row';
      const chkHtml = (modalità==="allenamento") ? `<input class="chk" type="checkbox" ${s.completata?"checked":""} onclick="toggleSerie(${si},${ai},${ei},${si2},this)">` : '';
      row.innerHTML = `${chkHtml}
        <input type="number" value="${s.peso||0}" onchange="modificaSerie(${si},${ai},${ei},${si2},'peso',this.value)">kg
        <input type="number" value="${s.reps||0}" onchange="modificaSerie(${si},${ai},${ei},${si2},'reps',this.value)">reps`;
      divS.appendChild(row);
      swipeContent.appendChild(divS);

      // Attach swipe handlers per series element if desired (for add/complete/delete)
      // We implement swipe on the whole exercise card for simplicity (below)
    });

    // actions (add/remove series) — available in both modes
    const actions = document.createElement('div'); actions.className='controls-row';
    const btnAdd = document.createElement('button'); btnAdd.className='btn'; btnAdd.textContent='+ Aggiungi Serie';
    btnAdd.onclick = ()=>{ e.serie.push({ peso:0, reps:0, completata:false }); salvaSchede(); mostraEsercizi(si,ai); };
    const btnRem = document.createElement('button'); btnRem.className='btn alt'; btnRem.textContent='🗑 Elimina Serie';
    btnRem.onclick = ()=>{ if(e.serie.length>0) e.serie.splice(e.serie.length-1,1); salvaSchede(); mostraEsercizi(si,ai); };
    actions.appendChild(btnAdd); actions.appendChild(btnRem);
    swipeContent.appendChild(actions);

    // delete surface (revealed after swipe left)
    const del = document.createElement('div'); del.className='delete-surface';
    del.innerHTML = `<button class="btn alt">Elimina</button>`;
    del.querySelector('button').onclick = ()=>{
      // confirm for exercise deletion
      if(confirm("Eliminare l'esercizio?")){ schede[si].allenamenti[ai].esercizi.splice(ei,1); salvaSchede(); mostraEsercizi(si,ai); }
    };

    li.appendChild(swipeContent);
    li.appendChild(del);
    list.appendChild(li);

    // SWIPE HANDLERS on the exercise card (for: left->delete, right->add series / complete behaviour)
    let startX=0, curX=0, dragging=false;
    swipeContent.addEventListener('touchstart', (ev)=>{ startX = ev.touches[0].clientX; dragging=true; swipeContent.style.transition='none'; }, {passive:true});
    swipeContent.addEventListener('touchmove', (ev)=>{ if(!dragging) return; curX = ev.touches[0].clientX; const dx = curX - startX;
      // right swipe (dx>0) -> add quick series indicator (visual)
      // left swipe (dx<0) -> reveal delete
      if(dx > 0 && dx < 140){ swipeContent.style.transform = `translateX(${dx}px)`; li.classList.remove('show-delete'); }
      if(dx < 0 && Math.abs(dx) < 160){ swipeContent.style.transform = `translateX(${dx}px)`; if(Math.abs(dx) > 60) li.classList.add('show-delete'); else li.classList.remove('show-delete'); }
    }, {passive:true});
    swipeContent.addEventListener('touchend', ()=>{
      dragging=false; swipeContent.style.transition='transform .16s cubic-bezier(.22,.9,.34,1)';
      const dx = curX - startX;
      // right swipe action -> add series (quick)
      if(dx > 120){
        // add series under this exercise
        schede[si].allenamenti[ai].esercizi[ei].serie.push({ peso:0, reps:0, completata:false });
        salvaSchede(); mostraEsercizi(si,ai);
      } else if(dx < -120){
        // left swipe -> reveal delete area (keep open)
        swipeContent.style.transform = 'translateX(-84px)';
        li.classList.add('show-delete');
      } else {
        swipeContent.style.transform = 'translateX(0px)'; li.classList.remove('show-delete');
      }
      startX = curX = 0;
    });

    // mouse fallback: click delete area
    del.addEventListener('click', ()=>{ if(confirm("Eliminare l'esercizio?")){ schede[si].allenamenti[ai].esercizi.splice(ei,1); salvaSchede(); mostraEsercizi(si,ai); } });
  });

  // workout save button (saves session in storico)
  if(modalità==="allenamento" && a.esercizi.length > 0){
    const salvaBtn = document.createElement('button'); salvaBtn.className='btn'; salvaBtn.textContent='💾 Salva Allenamento';
    salvaBtn.onclick = ()=>{
      clearInterval(cronometroInterval); cronometroInterval = null;
      // build storico entry (volume = sum peso*reps)
      let volume = 0;
      a.esercizi.forEach(ex=>{ ex.serie.forEach(s=>{ volume += (s.peso||0) * (s.reps||0); }); });
      const entry = {
        nomeScheda: schede[si].nome,
        nomeAllenamento: a.nome,
        data: (new Date()).toISOString(),
        esercizi: JSON.parse(JSON.stringify(a.esercizi)),
        volume,
        tempo: tempoTotale
      };
      storico.push(entry);
      salvaStorico();
      playBeep();
      setTimeout(()=>{ alert("Allenamento salvato nello storico"); }, 140);
      mostraAllenamenti(si);
    };
    main.appendChild(salvaBtn);
  }
}

// ------------------------------ Aggiunta / Modifica Esercizi ------------------------------
function aggiungiEsercizio(si, ai){
  editing = { tipo:"esercizio", scheda:si, allenamento:ai, index:null };
  popupInput.value = "";
  popup.classList.remove('hidden');
}
function modificaEsercizioNome(si, ai, ei, val){ schede[si].allenamenti[ai].esercizi[ei].nome = val; salvaSchede(); }
function modificaSerie(si, ai, ei, si2, param, val){ schede[si].allenamenti[ai].esercizi[ei].serie[si2][param] = Number(val); salvaSchede(); }
function modificaRecupero(si, ai, ei, val){ schede[si].allenamenti[ai].esercizi[ei].recupero = Number(val); salvaSchede(); }

// ------------------------------ Toggle serie (complete) + timer per recupero ------------------------------
function toggleSerie(si, ai, ei, si2, checkbox){
  let s = schede[si].allenamenti[ai].esercizi[ei].serie[si2];
  s.completata = checkbox.checked;
  salvaSchede();
  // re-render to reflect changes and add countdown
  mostraEsercizi(si, ai);

  if(s.completata){
    let seconds = schede[si].allenamenti[ai].esercizi[ei].recupero || 30;
    // Create a small non-blocking countdown appended to that exercise card (best-effort)
    const cards = document.querySelectorAll('#eserciziList .card');
    let appended = false;
    for(const card of cards){
      const inputName = card.querySelector('.nomeEsercizio input');
      if(inputName && inputName.value === schede[si].allenamenti[ai].esercizi[ei].nome && !appended){
        const cd = document.createElement('div'); cd.className='countdown'; cd.textContent = seconds + 's';
        card.appendChild(cd);
        const interval = setInterval(()=>{
          seconds--;
          cd.textContent = seconds + 's';
          if(seconds < 0){
            clearInterval(interval);
            cd.remove();
            playBeep();
          }
        },1000);
        activeTimers.push(interval);
        appended = true;
      }
    }
  }
}

// ------------------------------ Salva Allenamento (creazione) ------------------------------
function salvaAllenamento(si, ai){ salvaSchede(); mostraAllenamenti(si); }

// ------------------------------ TOGGLE MODALITA ------------------------------
toggleModeBtn.onclick = ()=>{
  // cleanup timers
  clearInterval(cronometroInterval);
  cronometroInterval = null;
  tempoTotale = 0;
  activeTimers.forEach(i=>clearInterval(i)); activeTimers = [];

  modalità = (modalità === "creazione") ? "allenamento" : "creazione";
  toggleModeBtn.textContent = (modalità==="creazione") ? "Modalità Allenamento" : "Modalità Creazione";
  renderSchede();
};

// ------------------------------ STORICO & GRAFICO ------------------------------
viewHistoryBtn.onclick = ()=> mostraStorico();
function mostraStorico(){
  main.innerHTML = `<h2>Storico Allenamenti</h2>
    <div style="height:300px"><canvas id="grafico"></canvas></div>
    <ul id="storicoList" class="list"></ul>
    <div class="controls-row"><button class="btn" onclick="renderSchede()">⬅ Torna</button></div>`;
  // render chart
  const ctx = document.getElementById('grafico').getContext('2d');
  const labels = storico.map(s=>new Date(s.data).toLocaleString());
  const data = storico.map(s=>s.volume);
  new Chart(ctx,{ type:'bar', data:{ labels, datasets:[{ label:'Volume (kg*reps)', data, backgroundColor:'rgba(176,0,32,0.9)' }] }, options:{ responsive:true, maintainAspectRatio:false } });

  const list = document.getElementById('storicoList');
  (storico.slice().reverse()).forEach((entry, idx)=>{
    const li = document.createElement('li'); li.className='card';
    li.innerHTML = `<div style="text-align:left;font-weight:700">${entry.nomeAllenamento} — ${new Date(entry.data).toLocaleString()}</div>
      <div style="color:#bbb;margin-top:6px">Volume: ${entry.volume} — Tempo: ${formatTime(entry.tempo)}</div>
      <div class="controls-row"><button class="btn" onclick="mostraDettaglioStorico(${storico.length-1-idx})">Dettaglio</button>
      <button class="btn alt" onclick="if(confirm('Eliminare questa sessione?')){ storico.splice(${storico.length-1-idx},1); salvaStorico(); mostraStorico(); }">Elimina</button></div>`;
    list.appendChild(li);
  });
}

function mostraDettaglioStorico(idx){
  const e = storico[idx];
  if(!e) return;
  main.innerHTML = `<h2>${e.nomeAllenamento}</h2><div style="color:#bbb">Data: ${new Date(e.data).toLocaleString()}</div>
    <ul class="list" id="detList"></ul>
    <div class="controls-row"><button class="btn" onclick="mostraStorico()">⬅ Torna</button></div>`;
  const det = document.getElementById('detList');
  e.esercizi.forEach(ex=>{
    const li = document.createElement('li'); li.className='card';
    li.innerHTML = `<div style="font-weight:700;text-align:left">${ex.nome}</div><div style="color:#bbb">Recupero: ${ex.recupero}s</div>`;
    const ulS = document.createElement('div');
    ex.serie.forEach(s=>{ ulS.innerHTML += `<div style="margin-top:6px;color:#fff">${s.peso}kg x ${s.reps} reps</div>`; });
    li.appendChild(ulS); det.appendChild(li);
  });
}

// ------------------------------ Cronometro helpers ------------------------------
function updateCronometro(){ const c = document.getElementById('cronometro'); if(c) c.textContent = "Tempo: " + formatTime(tempoTotale); }
function formatTime(sec){ const m = Math.floor(sec/60); const s = sec%60; return `${m}m ${s}s`; }

// ------------------------------ Init ------------------------------
renderSchede();
