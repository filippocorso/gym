// ------------------ Dati ------------------
let schede = JSON.parse(localStorage.getItem("schede")) || [];
let storico = JSON.parse(localStorage.getItem("storico")) || [];
let editing = {tipo:null, scheda:null, allenamento:null, esercizio:null, serie:null};
let modalità = "creazione";
let cronometroInterval = null;
let tempoTotale = 0;
let activeTimers = []; // per tenere traccia di intervalli attivi

// ------------------ DOM ------------------
const main = document.getElementById("main");
const popup = document.getElementById("popup");
const popupInput = document.getElementById("popupInput");
const popupSave = document.getElementById("popupSave");
const popupCancel = document.getElementById("popupCancel");
const toggleModeBtn = document.getElementById("toggleMode");
const viewHistoryBtn = document.getElementById("viewHistory");

// registra SW message handler (per playBeep fallback)
navigator.serviceWorker?.addEventListener?.('message', e=>console.log('SW msg', e.data));

// ------------------ Util ------------------
function salvaSchede(){ localStorage.setItem("schede", JSON.stringify(schede)); }
function salvaStorico(){ localStorage.setItem("storico", JSON.stringify(storico)); }
function vibrate(ms){ if(navigator.vibrate) navigator.vibrate(ms); }

// play beep (prova audio + postMessage a SW per notifica)
function playBeep(){
  try{
    const a = new Audio('assets/beep.mp3');
    a.play().catch(()=>{ /* ignora */ });
  }catch(e){}
  // notify service worker (mostra notifica)
  if(navigator.serviceWorker && navigator.serviceWorker.controller){
    navigator.serviceWorker.controller.postMessage({type:'playBeep'});
  }
  vibrate(160);
}

// ------------------ Render Schede ------------------
function renderSchede(){
  main.classList.add('fade-in');
  main.innerHTML = `<ul id="schedeList" class="list"></ul>
    ${modalità==="creazione"?'<button id="addSchedaBtn" class="btn">+ Aggiungi Scheda</button>':""}`;

  const schedeList = document.getElementById("schedeList");
  const addSchedaBtn = document.getElementById("addSchedaBtn");

  schede.forEach((s,si)=>{
    const li = document.createElement('li');
    li.className='card';
    li.innerHTML = `<span style="display:block;text-align:left;cursor:pointer;font-weight:600" onclick="mostraAllenamenti(${si})">${s.nome}</span>
      ${modalità==="creazione"?`<div class="controls-row">
        <button onclick="editScheda(${si})" class="btn">✏️</button>
        <button onclick="deleteScheda(${si})" class="btn alt">🗑️</button>
      </div>`:""}`;
    schedeList.appendChild(li);
  });

  if(modalità==="creazione" && addSchedaBtn){
    addSchedaBtn.onclick = ()=>{
      editing={tipo:"scheda",index:null};
      popupInput.value="";
      popup.classList.remove('hidden');
    };
  }
}

// ------------------ Popup ------------------
popupCancel.onclick = ()=>popup.classList.add('hidden');
popupSave.onclick = ()=>{
  const nome = popupInput.value.trim();
  if(!nome) return;
  switch(editing.tipo){
    case "scheda":
      if(editing.index!==null) schede[editing.index].nome = nome;
      else schede.push({nome, allenamenti:[]});
      salvaSchede(); popup.classList.add('hidden'); renderSchede(); break;
    case "allenamento":
      const si = editing.scheda, ai = editing.index;
      if(ai!==null) schede[si].allenamenti[ai].nome = nome;
      else schede[si].allenamenti.push({nome, esercizi:[]});
      salvaSchede(); popup.classList.add('hidden'); mostraAllenamenti(si); break;
    case "esercizio":
      const si1 = editing.scheda, ai1 = editing.allenamento, ei = editing.index;
      if(ei!==null) schede[si1].allenamenti[ai1].esercizi[ei].nome = nome;
      else schede[si1].allenamenti[ai1].esercizi.push({nome, serie:[], recupero:30});
      salvaSchede(); popup.classList.add('hidden'); mostraEsercizi(si1, ai1); break;
  }
};

// ------------------ Schede edit/delete ------------------
function editScheda(i){ editing={tipo:"scheda",index:i}; popupInput.value=schede[i].nome; popup.classList.remove('hidden'); }
function deleteScheda(i){ schede.splice(i,1); salvaSchede(); renderSchede(); }

// ------------------ Allenamenti ------------------
function mostraAllenamenti(si){
  const s = schede[si];
  main.classList.add('fade-in');
  main.innerHTML = `<h2>${s.nome}</h2>
    <ul id="allenamentiList" class="list"></ul>
    ${modalità==="creazione"?'<button class="btn" onclick="aggiungiAllenamento('+si+')">+ Aggiungi Allenamento</button>':""}`;

  // in modalità allenamento vogliamo il tasto torna qui
  if(modalità==="allenamento"){
    const backBtn = document.createElement('button');
    backBtn.className='btn';
    backBtn.textContent = '⬅ Torna';
    backBtn.onclick = ()=>renderSchede();
    main.insertBefore(backBtn, main.firstChild);
  }

  const list = document.getElementById('allenamentiList');
  s.allenamenti.forEach((a,ai)=>{
    const li = document.createElement('li'); li.className='card';
    li.innerHTML = `<span style="display:block;text-align:left;cursor:pointer;font-weight:600" onclick="mostraEsercizi(${si},${ai})">${a.nome}</span>
      ${modalità==="creazione"?`<div class="controls-row">
        <button onclick="editAllenamento(${si},${ai})" class="btn">✏️</button>
        <button onclick="deleteAllenamento(${si},${ai})" class="btn alt">🗑️</button>
      </div>`:""}`;
    list.appendChild(li);
  });
}

function aggiungiAllenamento(si){ editing={tipo:"allenamento",scheda:si,index:null}; popupInput.value=""; popup.classList.remove('hidden'); }
function editAllenamento(si,ai){ editing={tipo:"allenamento",scheda:si,index:ai}; popupInput.value=schede[si].allenamenti[ai].nome; popup.classList.remove('hidden'); }
function deleteAllenamento(si,ai){ schede[si].allenamenti.splice(ai,1); salvaSchede(); mostraAllenamenti(si); }

// ------------------ Esercizi ------------------
function mostraEsercizi(si,ai){
  const a = schede[si].allenamenti[ai];
  main.classList.add('fade-in');
  main.innerHTML = `<h2>${a.nome}</h2>
    <ul id="eserciziList" class="list"></ul>`;

  // controls for creation vs workout
  if(modalità==="creazione"){
    main.innerHTML += `<div class="controls-row"><button class="btn" onclick="aggiungiEsercizio(${si},${ai})">+ Aggiungi Esercizio</button>
      <button class="btn" onclick="salvaAllenamento(${si},${ai})">💾 Salva</button></div>`;
  } else {
    // modalità allenamento: torna + avvia cronometro
    const backBtn = document.createElement('button'); backBtn.className='btn'; backBtn.textContent='⬅ Torna';
    backBtn.onclick = ()=>mostraAllenamenti(si);
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
  a.esercizi.forEach((e,ei)=>{
    const li = document.createElement('li'); li.className='card swipe-wrap';
    // swipe content container
    const swipeContent = document.createElement('div'); swipeContent.className='swipe-content';
    // content of exercise
    swipeContent.innerHTML = `<div class="nomeEsercizio"><input type="text" value="${e.nome}" onchange="modificaEsercizioNome(${si},${ai},${ei},this.value)"></div>
      <div class="recuperoEsercizio">Recupero: <input type="number" value="${e.recupero}" onchange="modificaRecupero(${si},${ai},${ei},this.value)"> s</div>`;

    // series list under exercise
    e.serie.forEach((s,si2)=>{
      const divS = document.createElement('div'); divS.className='serie';
      const row = document.createElement('div'); row.className='serie-row';
      const checkHtml = (modalità==="allenamento")?`<input class="chk" type="checkbox" ${s.completata?"checked":""} onclick="toggleSerie(${si},${ai},${ei},${si2},this)">` : '';
      row.innerHTML = `${checkHtml}
        <input type="number" value="${s.peso}" onchange="modificaSerie(${si},${ai},${ei},${si2},'peso',this.value)">kg
        <input type="number" value="${s.reps}" onchange="modificaSerie(${si},${ai},${ei},${si2},'reps',this.value)">reps`;
      divS.appendChild(row);
      swipeContent.appendChild(divS);
    });

    // add/remove series buttons (available in both modes)
    const actions = document.createElement('div'); actions.className='controls-row';
    const btnAdd = document.createElement('button'); btnAdd.className='btn'; btnAdd.textContent='+ Aggiungi Serie';
    btnAdd.onclick = ()=>{ e.serie.push({peso:0,reps:0,completata:false}); salvaSchede(); mostraEsercizi(si,ai); };
    const btnRem = document.createElement('button'); btnRem.className='btn alt'; btnRem.textContent='🗑 Elimina Serie';
    btnRem.onclick = ()=>{ e.serie.splice(e.serie.length-1,1); salvaSchede(); mostraEsercizi(si,ai); };
    actions.appendChild(btnAdd); actions.appendChild(btnRem);
    swipeContent.appendChild(actions);

    // delete surface (appears on swipe)
    const del = document.createElement('div'); del.className='delete-surface'; del.innerHTML = `<button class="btn alt">Elimina</button>`;
    del.querySelector('button').onclick = ()=>{ // delete exercise
      schede[si].allenamenti[ai].esercizi.splice(ei,1); salvaSchede(); mostraEsercizi(si,ai);
    };

    li.appendChild(swipeContent);
    li.appendChild(del);
    list.appendChild(li);

    // --- SWIPE handling (touch) ---
    let startX = 0, curX = 0, dragging = false;
    swipeContent.addEventListener('touchstart', (ev)=>{
      startX = ev.touches[0].clientX;
      dragging = true;
      swipeContent.style.transition = 'none';
    }, {passive:true});
    swipeContent.addEventListener('touchmove', (ev)=>{
      if(!dragging) return;
      curX = ev.touches[0].clientX;
      const dx = curX - startX;
      if(dx < 0){ // left swipe only
        swipeContent.style.transform = `translateX(${dx}px)`;
        if(Math.abs(dx) > 60) li.classList.add('show-delete'); else li.classList.remove('show-delete');
      }
    }, {passive:true});
    swipeContent.addEventListener('touchend', ()=>{
      dragging = false;
      swipeContent.style.transition = 'transform .18s ease';
      const dx = curX - startX;
      if(Math.abs(dx) > 120){ // enough to delete visually -> reveal delete
        swipeContent.style.transform = `translateX(-84px)`;
        li.classList.add('show-delete');
      } else {
        swipeContent.style.transform = `translateX(0px)`;
        li.classList.remove('show-delete');
      }
      startX = curX = 0;
    });
    // mouse fallback for desktop - allow clicking delete
    del.addEventListener('click', ()=>{ schede[si].allenamenti[ai].esercizi.splice(ei,1); salvaSchede(); mostraEsercizi(si,ai); });

  });

  // in modalità allenamento: Salva Allenamento button
  if(modalità==="allenamento" && a.esercizi.length>0){
    const salvaBtn = document.createElement('button'); salvaBtn.className='btn'; salvaBtn.textContent='💾 Salva Allenamento';
    salvaBtn.onclick = ()=>{
      clearInterval(cronometroInterval);
      // build storico entry
      let volume = 0;
      a.esercizi.forEach(e=>{
        e.serie.forEach(s=>{ volume += (s.peso||0) * (s.reps||0); });
      });
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
      // small confirmation (non blocking)
      setTimeout(()=>{ alert("Allenamento salvato nello storico"); }, 120);
      mostraAllenamenti(si);
    };
    main.appendChild(salvaBtn);
  }
}

// ------------------ Aggiungi/Modifica Esercizio ------------------
function aggiungiEsercizio(si,ai){ editing={tipo:"esercizio",scheda:si,allenamento:ai,index:null}; popupInput.value=""; popup.classList.remove('hidden'); }
function modificaEsercizioNome(si,ai,ei,val){ schede[si].allenamenti[ai].esercizi[ei].nome = val; salvaSchede(); }
function modificaSerie(si,ai,ei,si2,param,val){ schede[si].allenamenti[ai].esercizi[ei].serie[si2][param] = Number(val); salvaSchede(); }
function modificaRecupero(si,ai,ei,val){ schede[si].allenamenti[ai].esercizi[ei].recupero = Number(val); salvaSchede(); }

// ------------------ Toggle Serie e beep + vibrazione ------------------
function toggleSerie(si,ai,ei,si2,checkbox){
  let s = schede[si].allenamenti[ai].esercizi[ei].serie[si2];
  s.completata = checkbox.checked; salvaSchede(); mostraEsercizi(si,ai);

  if(s.completata){
    let seconds = schede[si].allenamenti[ai].esercizi[ei].recupero || 30;
    const countdown = document.createElement('span'); countdown.className='countdown';
    // append countdown under that serie's element
    // find currently displayed card (quick DOM search)
    const cards = document.querySelectorAll('#eserciziList .card');
    let countAppended = false;
    cards.forEach(card=>{
      if(!countAppended && card.querySelector(`input[type="checkbox"]`)){
        // append to first matching (safe fallback)
        card.querySelector('.serie')?.appendChild(countdown);
        countAppended = true;
      }
    });
    const interval = setInterval(()=>{
      countdown.textContent = seconds + 's';
      seconds--;
      if(seconds < 0){
        clearInterval(interval);
        countdown.remove();
        playBeep();
      }
    },1000);
    activeTimers.push(interval);
  }
}

// ------------------ Salva Allenamento (creazione) ------------------
function salvaAllenamento(si,ai){ salvaSchede(); mostraAllenamenti(si); }

// ------------------ Modalità toggle ------------------
toggleModeBtn.onclick = ()=>{
  // clear any running cronos
  clearInterval(cronometroInterval); cronometroInterval = null;
  tempoTotale = 0;
  activeTimers.forEach(i=>clearInterval(i)); activeTimers=[];
  modalità = modalità==="creazione"?"allenamento":"creazione";
  toggleModeBtn.textContent = modalità==="creazione" ? "Modalità Allenamento" : "Modalità Creazione";
  renderSchede();
};

// ------------------ Storico e grafico ------------------
viewHistoryBtn.onclick = ()=>mostraStorico();
function mostraStorico(){
  main.classList.add('fade-in');
  main.innerHTML = `<h2>Storico Allenamenti</h2>
    <div style="height:300px"><canvas id="grafico"></canvas></div>
    <ul id="storicoList" class="list"></ul>
    <div class="controls-row"><button class="btn" onclick="renderSchede()">⬅ Torna</button></div>`;

  // prepare chart
  const ctx = document.getElementById('grafico').getContext('2d');
  const labels = storico.map(s=>new Date(s.data).toLocaleString());
  const data = storico.map(s=>s.volume);
  new Chart(ctx, { type:'bar', data:{ labels, datasets:[{label:'Volume (kg*reps)', data, backgroundColor:'#0a84ff'}] }, options:{responsive:true, maintainAspectRatio:false} });

  const list = document.getElementById('storicoList');
  storico.slice().reverse().forEach((entry, idx)=>{
    const li = document.createElement('li'); li.className='card';
    li.innerHTML = `<div style="text-align:left;font-weight:700">${entry.nomeAllenamento} — ${new Date(entry.data).toLocaleString()}</div>
      <div style="color:#bbb;margin-top:6px">Volume: ${entry.volume} — Tempo: ${formatTime(entry.tempo)}</div>
      <button class="btn" onclick='mostraDettaglioStorico(${storico.length-1-idx})'>Dettaglio</button>`;
    list.appendChild(li);
  });
}

function mostraDettaglioStorico(idx){
  const e = storico[idx];
  if(!e) return;
  main.classList.add('fade-in');
  main.innerHTML = `<h2>${e.nomeAllenamento}</h2><div style="color:#bbb">Data: ${new Date(e.data).toLocaleString()}</div>
    <div style="margin-top:10px"></div><ul class="list" id="detList"></ul>
    <div class="controls-row"><button class="btn" onclick="mostraStorico()">⬅ Torna</button></div>`;
  const det = document.getElementById('detList');
  e.esercizi.forEach(ex=>{
    const li = document.createElement('li'); li.className='card';
    li.innerHTML = `<div style="font-weight:700;text-align:left">${ex.nome}</div><div style="color:#bbb">Recupero: ${ex.recupero}s</div>`;
    const ulS = document.createElement('div');
    ex.serie.forEach(s=>{ ulS.innerHTML += `<div style="margin-top:6px;color:#fff">${s.peso}kg x ${s.reps} reps</div>`; });
    li.appendChild(ulS);
    det.appendChild(li);
  });
}

// ------------------ Cronometro helpers ------------------
function updateCronometro(){ const c = document.getElementById('cronometro'); if(c) c.textContent = "Tempo: " + formatTime(tempoTotale); }
function formatTime(sec){ const m = Math.floor(sec/60); const s = sec%60; return `${m}m ${s}s`; }

// ------------------ Init ------------------
renderSchede();
