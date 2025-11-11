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

// ------------------------------ UTILS ------------------------------
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

// ------------------------------ RENDER HOME / SCHEDE ------------------------------
function renderHome(){ renderSchede(); }

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

  if(modalità==="allenamento" || modalità==="creazione"){
    const backBtn = document.createElement('button'); backBtn.className='btn'; backBtn.textContent='⬅ Torna';
    backBtn.style.marginBottom = '8px';
    backBtn.onclick = ()=> { renderHome(); };
    main.insertBefore(backBtn, main.firstChild);
  }

  if(modalità !== "allenamento"){
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
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = e.nome;
    nameInput.addEventListener('change', () => modificaEsercizioNome(si, ai, ei, nameInput.value));
    nameDiv.appendChild(nameInput);
    swipeContent.appendChild(nameDiv);

    const recDiv = document.createElement('div'); recDiv.className='recuperoEsercizio';
    recDiv.innerHTML = 'Recupero: ';
    const recInput = document.createElement('input');
    recInput.type = 'number';
    recInput.value = e.recupero || 30;
    recInput.style.width = '86px';
    recInput.addEventListener('change', () => modificaRecupero(si, ai, ei, recInput.value));
    recDiv.appendChild(recInput);
    recDiv.appendChild(document.createTextNode(' s'));
    swipeContent.appendChild(recDiv);

    e.serie.forEach((s, si2)=>{
      const divS = document.createElement('div'); divS.className='serie';
      const row = document.createElement('div'); row.className='serie-row';

      if(modalità === "allenamento"){
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.className = 'chk';
        chk.checked = !!s.completata;
        chk.addEventListener('change', ()=> toggleSerie(si, ai, ei, si2, chk));
        row.appendChild(chk);
      }

      const pesoInput = document.createElement('input');
      pesoInput.type = 'number';
      pesoInput.value = s.peso || 0;
      pesoInput.style.width = '78px';
      pesoInput.addEventListener('change', ()=> modificaSerie(si, ai, ei, si2, 'peso', pesoInput.value));
      row.appendChild(pesoInput);
      row.appendChild(document.createTextNode('kg'));

      const repsInput = document.createElement('input');
      repsInput.type = 'number';
      repsInput.value = s.reps || 0;
      repsInput.style.width = '78px';
      repsInput.addEventListener('change', ()=> modificaSerie(si, ai, ei, si2, 'reps', repsInput.value));
      row.appendChild(repsInput);
      row.appendChild(document.createTextNode(' reps'));

      divS.appendChild(row);
      swipeContent.appendChild(divS);
    });

    const actions = document.createElement('div'); actions.className='controls-row';
    const btnAdd = document.createElement('button'); btnAdd.className='btn'; btnAdd.textContent='+ Aggiungi Serie';
    btnAdd.addEventListener('click', ()=>{ e.serie.push({ peso:0, reps:0, completata:false }); salvaSchede(); mostraEsercizi(si,ai); });
    const btnRem = document.createElement('button'); btnRem.className='btn alt'; btnRem.textContent='🗑 Elimina Serie';
    btnRem.addEventListener('click', ()=>{ if(e.serie.length>0){ e.serie.splice(e.serie.length-1,1); salvaSchede(); mostraEsercizi(si,ai); } });
    actions.appendChild(btnAdd); actions.appendChild(btnRem);
    swipeContent.appendChild(actions);

    const del = document.createElement('div'); del.className='delete-surface';
    const delBtn = document.createElement('button'); delBtn.className='btn alt'; delBtn.textContent='Elimina';
    delBtn.addEventListener('click', (function(siLocal, aiLocal, eiLocal){
      return function(){
        if(confirm("Eliminare questo esercizio?")){
          schede[siLocal].allenamenti[aiLocal].esercizi.splice(eiLocal,1);
          salvaSchede();
          mostraEsercizi(siLocal, aiLocal);
        }
      };
    })(si, ai, ei));
    del.appendChild(delBtn);

    li.appendChild(swipeContent);
    li.appendChild(del);
    list.appendChild(li);

    let startX=0, curX=0, dragging=false;
    swipeContent.addEventListener('touchstart',(ev)=>{
      const t = ev.target;
      if(t && (t.tagName === 'INPUT' || t.tagName === 'BUTTON' || t.closest('.controls-row'))){
        dragging = false;
        return;
      }
      startX = ev.touches[0].clientX; dragging=true; swipeContent.style.transition='none';
    }, {passive:true});

    swipeContent.addEventListener('touchmove',(ev)=>{
      if(!dragging) return;
      curX = ev.touches[0].clientX; const dx = curX - startX;
      if(dx < 0 && Math.abs(dx) < 160){
        swipeContent.style.transform = `translateX(${dx}px)`;
        if(Math.abs(dx) > 60) li.classList.add('show-delete'); else li.classList.remove('show-delete');
      }
    }, {passive:true});

    swipeContent.addEventListener('touchend',()=>{
      if(!dragging){ swipeContent.style.transform = 'translateX(0px)'; li.classList.remove('show-delete'); return; }
      dragging=false; swipeContent.style.transition='transform .16s cubic-bezier(.22,.9,.34,1)';
      const dx = curX - startX;
      if(dx < -120){ swipeContent.style.transform = 'translateX(-84px)'; li.classList.add('show-delete'); } else { swipeContent.style.transform = 'translateX(0px)'; li.classList.remove('show-delete'); }
      startX = curX = 0;
    });
  });

  if(modalità==="allenamento" && a.esercizi.length > 0){
    const salvaBtn = document.createElement('button'); salvaBtn.className='btn'; salvaBtn.textContent='💾 Salva Allenamento';
    salvaBtn.addEventListener('click', ()=>{
      clearInterval(cronometroInterval); cronometroInterval = null;
      activeTimers.forEach(i=>clearInterval(i)); activeTimers=[];
      let volume = 0; let totalSeries = 0;

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

      // ✅ reset completata solo qui
      schede[si].allenamenti[ai].esercizi.forEach(ex=>{
        ex.serie.forEach(ser=>{ ser.completata = false; });
      });
      salvaSchede();

      playBeep();
      mostraStorico();
      const lastIndex = storico.length - 1;
      setTimeout(()=>{ mostraDettaglioStorico(lastIndex); }, 220);
    });
    main.appendChild(salvaBtn);
  }
}

// ------------------------------ Aggiungi / Modifica Esercizi ------------------------------
function aggiungiEsercizio(si, ai){ editing={ tipo:"esercizio", scheda:si, allenamento:ai, index:null }; popupInput.value=""; popup.classList.remove('hidden'); }
function modificaEsercizioNome(si, ai, ei, val){ schede[si].allenamenti[ai].esercizi[ei].nome = val; salvaSchede(); }
function modificaSerie(si, ai, ei, si2, param, val){ schede[si].allenamenti[ai].esercizi[ei].serie[si2][param] = Number(val); salvaSchede(); }
function modificaRecupero(si, ai, ei, val){ schede[si].allenamenti[ai].esercizi[ei].recupero = Number(val); salvaSchede(); }

// ------------------------------ Toggle serie (complete) + timer recupero ------------------------------
function toggleSerie(si, ai, ei, si2, checkbox){
  const isChecked = checkbox.checked;
  let sRef = schede[si].allenamenti[ai].esercizi[ei].serie[si2];
  sRef.completata = isChecked;
  salvaSchede();

  if(isChecked){
    let seconds = schede[si].allenamenti[ai].esercizi[ei].recupero || 30;
    const cards = document.querySelectorAll('#eserciziList .card');
    let appended = false;
    for(const card of cards){
      const inputName = card.querySelector('.nomeEsercizio input');
      if(inputName && inputName.value === schede[si].allenamenti[ai].esercizi[ei].nome && !appended){
        const cd = document.createElement('div'); cd.className='countdown'; cd.textContent = seconds
