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

// ------------------------------ RENDER HOME ------------------------------
function renderHome(){
  main.innerHTML = '';
  const list = document.createElement('ul'); list.className='list'; list.id='schedeList';
  schede.forEach((s, si)=>{
    const li = document.createElement('li'); li.className='card';
    li.innerHTML = `<span style="display:block;text-align:left;cursor:pointer;font-weight:700" onclick="mostraAllenamenti(${si})">${s.nome}</span>`;
    if(modalità==="creazione"){
      const ctrl = document.createElement('div'); ctrl.className='controls-row';
      const editBtn = document.createElement('button'); editBtn.className='btn'; editBtn.textContent='✏️'; editBtn.onclick=()=>editScheda(si);
      const delBtn = document.createElement('button'); delBtn.className='btn alt'; delBtn.textContent='🗑️'; delBtn.onclick=()=>deleteScheda(si);
      ctrl.appendChild(editBtn); ctrl.appendChild(delBtn);
      li.appendChild(ctrl);
    }
    list.appendChild(li);
  });
  main.appendChild(list);

  if(modalità==="creazione"){
    const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.textContent='+ Aggiungi Scheda';
    addBtn.onclick=()=>{
      editing={tipo:'scheda', index:null}; popupInput.value=''; popup.classList.remove('hidden');
    };
    main.appendChild(addBtn);
  }
}

// ------------------------------ POPUP ------------------------------
popupCancel.onclick = ()=> popup.classList.add('hidden');
popupSave.onclick = ()=>{
  const nome = popupInput.value.trim(); if(!nome) return;
  switch(editing.tipo){
    case "scheda":
      if(editing.index!==null) schede[editing.index].nome=nome;
      else schede.push({nome, allenamenti:[]});
      salvaSchede(); popup.classList.add('hidden'); renderHome(); break;
    case "allenamento":
      const si = editing.scheda, ai = editing.index;
      if(ai!==null) schede[si].allenamenti[ai].nome=nome;
      else schede[si].allenamenti.push({nome, esercizi:[]});
      salvaSchede(); popup.classList.add('hidden'); mostraAllenamenti(si); break;
    case "esercizio":
      const si1 = editing.scheda, ai1 = editing.allenamento, ei = editing.index;
      if(ei!==null) schede[si1].allenamenti[ai1].esercizi[ei].nome=nome;
      else schede[si1].allenamenti[ai1].esercizi.push({nome, serie:[], recupero:30});
      salvaSchede(); popup.classList.add('hidden'); mostraEsercizi(si1, ai1); break;
  }
};

// ------------------------------ EDIT / DELETE ------------------------------
function editScheda(i){ editing={tipo:'scheda', index:i}; popupInput.value=schede[i].nome; popup.classList.remove('hidden'); }
function deleteScheda(i){ if(!confirm("Eliminare questa scheda?")) return; schede.splice(i,1); salvaSchede(); renderHome(); }

// ---------- TOGGLE MODALITA ----------
toggleModeBtn.onclick = ()=>{
  clearInterval(cronometroInterval); cronometroInterval=null; tempoTotale=0;
  activeTimers.forEach(i=>clearInterval(i)); activeTimers=[];
  modalità = (modalità==='creazione') ? 'allenamento':'creazione';
  toggleModeBtn.textContent = (modalità==='creazione')?'Modalità Allenamento':'Modalità Creazione';
  renderHome();
};

// ---------- STORICO ----------
viewHistoryBtn.onclick = ()=> mostraStorico();

// ---------- INIT ----------
renderHome();
