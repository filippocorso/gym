// ------------------------------ STATO ------------------------------
let schede = JSON.parse(localStorage.getItem("schede")) || [];
let storico = JSON.parse(localStorage.getItem("storico")) || [];
let editing = { tipo:null, scheda:null, allenamento:null, esercizio:null, serie:null };
let modalità = "creazione"; // "creazione" | "allenamento"
let cronometroInterval = null;
let tempoTotale = 0;
let activeTimers = [];

// ------------------------------ DOM ------------------------------
const main = document.getElementById("main");
const popup = document.getElementById("popup");
const popupInput = document.getElementById("popupInput");
const popupSave = document.getElementById("popupSave");
const popupCancel = document.getElementById("popupCancel");
const toggleModeBtn = document.getElementById("toggleMode");
const viewHistoryBtn = document.getElementById("viewHistory");
const bpmFileInput = document.getElementById("bpmFileInput");

// ------------------------------ UTIL ------------------------------
function salvaSchede(){ localStorage.setItem("schede", JSON.stringify(schede)); }
function salvaStorico(){ localStorage.setItem("storico", JSON.stringify(storico)); }
function vibrate(ms){ if(navigator.vibrate) navigator.vibrate(ms); }
function playBeep(){ try{ new Audio('assets/beep.mp3').play().catch(()=>{}); }catch(e){} if(navigator.serviceWorker && navigator.serviceWorker.controller){ navigator.serviceWorker.controller.postMessage({ type:'playBeep' }); } vibrate(140); }

function ensureStructure(){
  if(!Array.isArray(schede)) schede = [];
  schede.forEach(s=>{
    s.allenamenti = s.allenamenti || [];
    s.allenamenti.forEach(a=>{
      a.esercizi = a.esercizi || [];
      a.esercizi.forEach(e=>{
        e.serie = e.serie || [];
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

// ------------------------------ POPUP ------------------------------
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

// ------------------------------ EDIT / DELETE SCHEDE ------------------------------
function editScheda(i){ editing={ tipo:"scheda", index:i }; popupInput.value = schede[i].nome; popup.classList.remove('hidden'); }
function deleteScheda(i){ if(!confirm("Eliminare questa scheda?")) return; schede.splice(i,1); salvaSchede(); renderSchede(); }

// ------------------------------ ALLENAMENTI ------------------------------
function mostraAllenamenti(si){
  const s = schede[si];
  ensureStructure();
  main.innerHTML = `<h2>${s.nome}</h2><ul id="allenamentiList" class="list"></ul>`;

  // back button in modalità allenamento (torna alla lista schede)
  if(modalità==="allenamento"){
    const backBtn = document.createElement('button'); backBtn.className='btn'; backBtn.textContent='⬅ Torna';
    backBtn.onclick = ()=> renderSchede();
    main.insertBefore(backBtn, main.firstChild);
  } else {
    main.innerHTML += `<div class="controls-row"><button class="btn" onclick="aggiungiAllenamento(${si})">+ Aggiungi Allenamento</button></div>`;
  }

  const list = document.getElementById('allenamentiList');
  s.allenamenti.forEach((a, ai)=>{
    const li = document.createElement('li'); li.className='card';
    li.innerHTML = `<span style="display:block;text-align:left;cursor:pointer;font-weight:700" onclick="mostraEsercizi(${si},${ai})">${a.nome}</span>
      ${modalità==="creazione" ? `<div class="controls-row">
        <button onclick="editAllenamento(${si},${ai})" class="btn">✏️</button>
        <button onclick="deleteAllenamento(${si},${ai})" class="btn alt">🗑️</button>
      </div>` : ''}`;
    list.appendChild(li);
  });
}

function aggiungiAllenamento(si){ editing={ tipo:"allenamento", scheda:si, index:null }; popupInput.value=""; popup.classList.remove('hidden'); }
function editAllenamento(si,ai){ editing={ tipo:"allenamento", scheda:si, index:ai }; popupInput.value=schede[si].allenamenti[ai].nome; popup.classList.remove('hidden'); }
function deleteAllenamento(si,ai){ if(!confirm("Eliminare questo allenamento?")) return; schede[si].allenamenti.splice(ai,1); salvaSchede(); mostraAllenamenti(si); }

// ------------------------------ ESERCIZI ------------------------------
function mostraEsercizi(si,ai){
  const a = schede[si].allenamenti[ai];
  ensureStructure();

  // Ensure all 'completata' flags are false when entering in modalità allenamento (fresh start)
  if(modalità === "allenamento"){
    a.esercizi.forEach(ex => { ex.serie.forEach(s => { s.completata = false; }); });
    salvaSchede();
  }

  main.innerHTML = `<h2>${a.nome}</h2><ul id="eserciziList" class="list"></ul>`;

  if(modalità==="creazione"){
    main.innerHTML += `<div class="controls-row"><button class="btn" onclick="aggiungiEsercizio(${si},${ai})">+ Aggiungi Esercizio</button><button class="btn" onclick="salvaAllenamento(${si},${ai})">💾 Salva</button></div>`;
  } else {
    const backBtn = document.createElement('button'); backBtn.className='btn'; backBtn.textContent='⬅ Torna';
    backBtn.onclick = ()=> mostraAllenamenti(si);
    main.insertBefore(backBtn, main.firstChild);

    const startBtn = document.createElement('button'); startBtn.className='btn'; startBtn.textContent='▶ Avvia Allenamento';
    startBtn.onclick = ()=>{
      clearInterval(cronometroInterval); tempoTotale = 0;
      cronometroInterval = setInterval(()=>{ tempoTotale++; updateCronometro(); },1000);
    };
    main.insertBefore(startBtn, backBtn.nextSibling);

    const chrono = document.createElement('div'); chrono.id='cronometro'; chrono.style.margin='8px';
    main.insertBefore(chrono, startBtn.nextSibling);
  }

  const list = document.getElementById('eserciziList');

  a.esercizi.forEach((e, ei)=>{
    const li = document.createElement('li'); li.className='card swipe-wrap';
    const swipeContent = document.createElement('div'); swipeContent.className='swipe-content';

    const nameDiv = document.createElement('div'); nameDiv.className='nomeEsercizio';
    nameDiv.innerHTML = `<input type="text" value="${e.nome}" onchange="modificaEsercizioNome(${si},${ai},${ei},this.value)">`;
    swipeContent.appendChild(nameDiv);

    const recDiv = document.createElement('div'); recDiv.className='recuperoEsercizio';
    recDiv.innerHTML = `Recupero: <input type="number" value="${e.recupero||30}" onchange="modificaRecupero(${si},${ai},${ei},this.value)"> s`;
    swipeContent.appendChild(recDiv);

    e.serie.forEach((s, si2)=>{
      const divS = document.createElement('div'); divS.className='serie';
      const row = document.createElement('div'); row.className='serie-row';
      const chkHtml = (modalità==="allenamento") ? `<input class="chk" type="checkbox" ${s.completata?"checked":""} onclick="toggleSerie(${si},${ai},${ei},${si2},this)">` : '';
      row.innerHTML = `${chkHtml}
        <input type="number" value="${s.peso||0}" onchange="modificaSerie(${si},${ai},${ei},${si2},'peso',this.value)">kg
        <input type="number" value="${s.reps||0}" onchange="modificaSerie(${si},${ai},${ei},${si2},'reps',this.value)">reps`;
      divS.appendChild(row);
      swipeContent.appendChild(divS);
    });

    const actions = document.createElement('div'); actions.className='controls-row';
    const btnAdd = document.createElement('button'); btnAdd.className='btn'; btnAdd.textContent='+ Aggiungi Serie';
    btnAdd.onclick = ()=>{ e.serie.push({ peso:0, reps:0, completata:false }); salvaSchede(); mostraEsercizi(si,ai); };
    const btnRem = document.createElement('button'); btnRem.className='btn alt'; btnRem.textContent='🗑 Elimina Serie';
    btnRem.onclick = ()=>{ if(e.serie.length>0){ e.serie.splice(e.serie.length-1,1); salvaSchede(); mostraEsercizi(si,ai); } };
    actions.appendChild(btnAdd); actions.appendChild(btnRem);
    swipeContent.appendChild(actions);

    // delete surface for this exercise (revealed by left-swipe)
    const del = document.createElement('div'); del.className='delete-surface';
    const delBtn = document.createElement('button'); delBtn.className='btn alt'; delBtn.textContent='Elimina';
    delBtn.onclick = (function(siLocal, aiLocal, eiLocal){
      return function(){
        if(confirm("Eliminare questo esercizio?")){
          schede[siLocal].allenamenti[aiLocal].esercizi.splice(eiLocal,1);
          salvaSchede();
          mostraEsercizi(siLocal, aiLocal);
        }
      };
    })(si, ai, ei);
    del.appendChild(delBtn);

    li.appendChild(swipeContent);
    li.appendChild(del);
    list.appendChild(li);

    // SWIPE LEFT only
    let startX=0, curX=0, dragging=false;
    swipeContent.addEventListener('touchstart',(ev)=>{ startX = ev.touches[0].clientX; dragging=true; swipeContent.style.transition='none'; }, {passive:true});
    swipeContent.addEventListener('touchmove',(ev)=>{ if(!dragging) return; curX = ev.touches[0].clientX; const dx = curX - startX;
      if(dx < 0 && Math.abs(dx) < 160){ swipeContent.style.transform = `translateX(${dx}px)`; if(Math.abs(dx) > 60) li.classList.add('show-delete'); else li.classList.remove('show-delete'); }
    }, {passive:true});
    swipeContent.addEventListener('touchend',()=>{
      dragging=false; swipeContent.style.transition='transform .16s cubic-bezier(.22,.9,.34,1)';
      const dx = curX - startX;
      if(dx < -120){ swipeContent.style.transform = 'translateX(-84px)'; li.classList.add('show-delete'); } else { swipeContent.style.transform = 'translateX(0px)'; li.classList.remove('show-delete'); }
      startX = curX = 0;
    });
  });

  // SAVE (workout): save snapshot, reset completata flags in saved scheda, then go to Storico and open detail
  if(modalità==="allenamento" && a.esercizi.length > 0){
    const salvaBtn = document.createElement('button'); salvaBtn.className='btn'; salvaBtn.textContent='💾 Salva Allenamento';
    salvaBtn.onclick = ()=>{
      clearInterval(cronometroInterval); cronometroInterval = null;
      // build storico entry
      let volume = 0;
      let totalSeries = 0;
      // Build esercizi snapshot but maintain execution order: exercises appear in array order and series in stored order
      const eserciziSnapshot = a.esercizi.map(ex => {
        const serieSnap = ex.serie.map(s => {
          volume += (s.peso||0) * (s.reps||0);
          totalSeries += 1;
          return { peso: s.peso || 0, reps: s.reps || 0, completata: !!s.completata };
        });
        return { nome: ex.nome, recupero: ex.recupero || 30, serie: serieSnap };
      });

      const entry = {
        nomeScheda: schede[si].nome,
        nomeAllenamento: a.nome,
        data: (new Date()).toISOString(),
        esercizi: eserciziSnapshot,
        volume,
        tempo: tempoTotale,
        totalSeries
      };

      storico.push(entry);
      salvaStorico();

      // RESET completata flags in the actual scheda so next time checkboxes are empty
      schede[si].allenamenti[ai].esercizi.forEach(ex=>{
        ex.serie.forEach(ser=>{ ser.completata = false; });
      });
      salvaSchede();

      playBeep();
      setTimeout(()=>{ /* small delay for UX */ }, 120);

      // go to Storico and auto-open last saved detail
      mostraStorico();
      const lastIndex = storico.length - 1;
      setTimeout(()=>{ mostraDettaglioStorico(lastIndex); }, 220);
    };
    main.appendChild(salvaBtn);
  }
}

// ------------------------------ Aggiungi/Modifica Esercizi ------------------------------
function aggiungiEsercizio(si, ai){ editing={ tipo:"esercizio", scheda:si, allenamento:ai, index:null }; popupInput.value=""; popup.classList.remove('hidden'); }
function modificaEsercizioNome(si, ai, ei, val){ schede[si].allenamenti[ai].esercizi[ei].nome = val; salvaSchede(); }
function modificaSerie(si, ai, ei, si2, param, val){ schede[si].allenamenti[ai].esercizi[ei].serie[si2][param] = Number(val); salvaSchede(); }
function modificaRecupero(si, ai, ei, val){ schede[si].allenamenti[ai].esercizi[ei].recupero = Number(val); salvaSchede(); }

// ------------------------------ Toggle serie (complete) + timer recupero ------------------------------
function toggleSerie(si, ai, ei, si2, checkbox){
  let s = schede[si].allenamenti[ai].esercizi[ei].serie[si2];
  s.completata = checkbox.checked;
  salvaSchede();
  // re-render (keeps UI consistent)
  mostraEsercizi(si, ai);

  if(s.completata){
    let seconds = schede[si].allenamenti[ai].esercizi[ei].recupero || 30;
    const cards = document.querySelectorAll('#eserciziList .card');
    let appended = false;
    for(const card of cards){
      const inputName = card.querySelector('.nomeEsercizio input');
      if(inputName && inputName.value === schede[si].allenamenti[ai].esercizi[ei].nome && !appended){
        const cd = document.createElement('div'); cd.className='countdown'; cd.textContent = seconds + 's';
        card.appendChild(cd);
        const interval = setInterval(()=>{
          seconds--; cd.textContent = seconds + 's';
          if(seconds < 0){ clearInterval(interval); cd.remove(); playBeep(); }
        },1000);
        activeTimers.push(interval);
        appended = true;
      }
    }
  }
}

// ------------------------------ Salva Allenamento (creazione) ------------------------------
function salvaAllenamento(si, ai){ salvaSchede(); mostraAllenamenti(si); }

// ------------------------------ toggle modalità ------------------------------
toggleModeBtn.onclick = ()=>{
  clearInterval(cronometroInterval); cronometroInterval = null; tempoTotale = 0;
  activeTimers.forEach(i=>clearInterval(i)); activeTimers = [];
  modalità = (modalità === "creazione") ? "allenamento" : "creazione";
  toggleModeBtn.textContent = (modalità==="creazione") ? "Modalità Allenamento" : "Modalità Creazione";
  renderSchede();
};

// ------------------------------ STORICO & GRAFICO ------------------------------
viewHistoryBtn.onclick = ()=> mostraStorico();
function mostraStorico(){
  main.innerHTML = `<h2>Storico Allenamenti</h2>
    <div style="height:260px" class="chart-container"><canvas id="grafico"></canvas></div>
    <ul id="storicoList" class="list"></ul>
    <div class="controls-row"><button class="btn" onclick="renderSchede()">⬅ Torna</button></div>`;

  const ctx = document.getElementById('grafico').getContext('2d');
  const labels = storico.map(s=>new Date(s.data).toLocaleString());
  const data = storico.map(s=>s.volume);
  // destroy previous if exists
  if(window._storicoChart) try{ window._storicoChart.destroy(); }catch(e){}
  window._storicoChart = new Chart(ctx,{ type:'bar', data:{ labels, datasets:[{ label:'Volume (kg*reps)', data, backgroundColor:'rgba(176,0,32,0.9)' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } } });

  const list = document.getElementById('storicoList');
  const entries = storico.slice().reverse();
  entries.forEach((entry, idx)=>{
    const realIndex = storico.length - 1 - idx;
    const li = document.createElement('li'); li.className='card';
    li.innerHTML = `<div style="text-align:left;font-weight:700;cursor:pointer" onclick="mostraDettaglioStorico(${realIndex})">${entry.nomeAllenamento} — ${new Date(entry.data).toLocaleString()}</div>
      <div style="color:#bbb;margin-top:6px">Volume: ${entry.volume} — Tempo: ${formatTime(entry.tempo)} — Serie: ${entry.totalSeries || 0}</div>
      <div class="controls-row">
        <button class="btn" onclick="mostraDettaglioStorico(${realIndex})">Dettaglio</button>
        <button class="btn alt" onclick="if(confirm('Eliminare questa sessione?')){ storico.splice(${realIndex},1); salvaStorico(); mostraStorico(); }">Elimina</button>
      </div>`;
    list.appendChild(li);
  });
}

// dettaglio storico: mostra subito il dettaglio completo (B)
function mostraDettaglioStorico(idx){
  const e = storico[idx]; if(!e) return;

  // Build a chart of per-series volume for this single session (bars)
  const perSeries = []; // volumes per series in execution order
  const perSeriesLabels = []; // labels like "Panca #1"
  e.esercizi.forEach(ex=>{
    ex.serie.forEach((s, i)=>{
      perSeries.push((s.peso||0) * (s.reps||0));
      perSeriesLabels.push(`${ex.nome} #${i+1}`);
    });
  });

  main.innerHTML = `<h2>${e.nomeAllenamento}</h2>
    <div class="detail-meta">Data: ${new Date(e.data).toLocaleString()}</div>
    <div class="detail-meta">Durata: ${formatTime(e.tempo)} &nbsp;•&nbsp; Volume: ${e.volume} &nbsp;•&nbsp; Serie totali: ${e.totalSeries || 0}</div>
    <div class="chart-container"><canvas id="sessionChart"></canvas></div>
    <div class="controls-row" id="detailControls"></div>
    <ul class="list" id="detList"></ul>
    <div class="controls-row"><button class="btn" onclick="mostraStorico()">⬅ Torna</button></div>`;

  // draw per-series bar chart (bars = volume per serie)
  const ctx = document.getElementById('sessionChart').getContext('2d');
  if(window._sessionChart) try{ window._sessionChart.destroy(); }catch(e){}
  window._sessionChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: perSeriesLabels, datasets: [{ label: 'Volume per serie (kg*reps)', data: perSeries, backgroundColor: 'rgba(176,0,32,0.9)' }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ autoSkip:true, maxTicksLimit:8 } } } }
  });

  // render esercizi and every single series in order (B: show each single serie)
  const det = document.getElementById('detList');
  // We want the order in which series were recorded; saved snapshot already preserves that order: exercises array order and series internal order.
  e.esercizi.forEach(ex=>{
    const li = document.createElement('li'); li.className='card';
    li.innerHTML = `<div style="font-weight:700;text-align:left">${ex.nome}</div><div style="color:#bbb">Recupero: ${ex.recupero}s</div>`;
    const ulS = document.createElement('div');
    ex.serie.forEach(s=>{
      ulS.innerHTML += `<div style="margin-top:6px;color:#fff">${s.peso}kg x ${s.reps} reps</div>`;
    });
    li.appendChild(ulS); det.appendChild(li);
  });
}

// ------------------------------ Cronometro helpers ------------------------------
function updateCronometro(){ const c = document.getElementById('cronometro'); if(c) c.textContent = "Tempo: " + formatTime(tempoTotale); }
function formatTime(sec){ const m = Math.floor(sec/60); const s = sec%60; return `${m}m ${s}s`; }

// ------------------------------ INIT ------------------------------
renderSchede();
