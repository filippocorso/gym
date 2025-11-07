let schede = JSON.parse(localStorage.getItem("schede")) || [];
let editing = {tipo:null, scheda:null, allenamento:null, esercizio:null, serie:null};
let modalità = "creazione"; // "creazione" o "allenamento"
let storico = JSON.parse(localStorage.getItem("storico")) || [];

const main = document.getElementById("main");
const popup = document.getElementById("popup");
const popupInput = document.getElementById("popupInput");
const popupSave = document.getElementById("popupSave");
const popupCancel = document.getElementById("popupCancel");
const toggleModeBtn = document.getElementById("toggleMode");

// ------------------- SALVATAGGIO -------------------
function salva(){ localStorage.setItem("schede", JSON.stringify(schede)); }
function salvaStorico(){ localStorage.setItem("storico", JSON.stringify(storico)); }

// ------------------- RENDER SCHEDE -------------------
function renderSchede(){
  main.innerHTML=`<ul id="schedeList" class="list"></ul>
  ${modalità==="creazione"?'<button id="addSchedaBtn" class="btn">+ Aggiungi Scheda</button>':""}`;
  const schedeList = document.getElementById("schedeList");
  const addSchedaBtn = document.getElementById("addSchedaBtn");

  schede.forEach((s,si)=>{
    const li=document.createElement("li");
    li.innerHTML=`<span onclick="mostraAllenamenti(${si})" style="flex:1;text-align:left;cursor:pointer">${s.nome}</span>
      ${modalità==="creazione"?`<div>
        <button onclick="editScheda(${si})" class="btn">✏️</button>
        <button onclick="deleteScheda(${si})" class="btn">🗑️</button>
      </div>`:""}`;
    schedeList.appendChild(li);
  });

  if(addSchedaBtn) addSchedaBtn.onclick=()=>{
    editing={tipo:"scheda",index:null}; popupInput.value=""; popup.classList.remove("hidden");
  }
}

// ------------------- POPUP -------------------
popupCancel.onclick=()=>popup.classList.add("hidden");
popupSave.onclick=()=>{
  const nome = popupInput.value.trim(); if(!nome) return;

  switch(editing.tipo){
    case "scheda":
      if(editing.index!==null) schede[editing.index].nome=nome;
      else schede.push({nome,allenamenti:[]});
      popup.classList.add("hidden"); renderSchede(); salva(); break;

    case "allenamento":
      const sIndex = editing.scheda; const aIndex = editing.index;
      if(aIndex!==null) schede[sIndex].allenamenti[aIndex].nome = nome;
      else schede[sIndex].allenamenti.push({nome,esercizi:[]});
      popup.classList.add("hidden"); mostraAllenamenti(sIndex); salva(); break;

    case "esercizio":
      const si1 = editing.scheda; const ai = editing.allenamento; const eIndex = editing.index;
      if(eIndex!==null) schede[si1].allenamenti[ai].esercizi[eIndex].nome = nome;
      else schede[si1].allenamenti[ai].esercizi.push({nome,serie:[],recupero:30});
      popup.classList.add("hidden"); mostraEsercizi(si1, ai); salva(); break;
  }
};

// ------------------- SCHEDE -------------------
function editScheda(i){ editing={tipo:"scheda",index:i}; popupInput.value=schede[i].nome; popup.classList.remove("hidden"); }
function deleteScheda(i){ schede.splice(i,1); salva(); renderSchede(); }

// ------------------- ALLENAMENTI -------------------
function mostraAllenamenti(si){
  const s = schede[si];
  main.innerHTML=`<h2>${s.nome}</h2>
    <ul id="allenamentiList" class="list"></ul>
    ${modalità==="creazione"?'<button class="btn" onclick="aggiungiAllenamento('+si+')">+ Aggiungi Allenamento</button>':""}
    <button class="btn" onclick="renderSchede()">⬅ Torna</button>`;

  const list = document.getElementById("allenamentiList");
  s.allenamenti.forEach((a, ai)=>{
    const li = document.createElement("li");
    li.innerHTML=`<span style="flex:1;text-align:left;cursor:pointer">${a.nome}</span>
      <div>
      ${modalità==="creazione"?`<button onclick="editAllenamento(${si},${ai})" class="btn">✏️</button>
        <button onclick="deleteAllenamento(${si},${ai})" class="btn">🗑️</button>`:""}
      ${modalità==="allenamento"?`<button onclick="avviaAllenamento(${si},${ai})" class="btn">▶ Avvia Allenamento</button>`:""}
      </div>`;
    li.querySelector("span").onclick=()=>modalità==="creazione"?mostraEsercizi(si,ai):null;
    list.appendChild(li);
  });
}

function aggiungiAllenamento(si){ editing={tipo:"allenamento",scheda:si,index:null}; popupInput.value=""; popup.classList.remove("hidden"); }
function editAllenamento(si,ai){ editing={tipo:"allenamento",scheda:si,index:ai}; popupInput.value=schede[si].allenamenti[ai].nome; popup.classList.remove("hidden"); }
function deleteAllenamento(si,ai){ schede[si].allenamenti.splice(ai,1); salva(); mostraAllenamenti(si); }

// ------------------- ESERCIZI -------------------
function mostraEsercizi(si,ai){
  const a = schede[si].allenamenti[ai];
  main.innerHTML=`<h2>${a.nome}</h2>
    <ul id="eserciziList" class="list"></ul>
    ${modalità==="creazione"?'<button class="btn" onclick="aggiungiEsercizio('+si+','+ai+')">+ Aggiungi Esercizio</button><button class="btn" onclick="salvaAllenamento('+si+','+ai+')">💾 Salva Allenamento</button>':""}
    <button class="btn" onclick="mostraAllenamenti(${si})">⬅ Torna</button>`;

  const list = document.getElementById("eserciziList");
  a.esercizi.forEach((e, ei)=>{
    const li = document.createElement("li");
    li.innerHTML=`<div class="nomeEsercizio">${e.nome}</div>
      <div>Recupero: <input type="number" value="${e.recupero}" onchange="modificaRecupero(${si},${ai},${ei},this.value)"> s</div>
      ${modalità==="creazione"?`<div>
        <button onclick="editEsercizio(${si},${ai},${ei})" class="btn">✏️</button>
        <button onclick="deleteEsercizio(${si},${ai},${ei})" class="btn">🗑️</button>
      </div>`:""}`;

    list.appendChild(li);

    e.serie.forEach((s, si2)=>{
      const liS=document.createElement("div");
      liS.className="serie";
      liS.innerHTML=`<input type="checkbox" ${s.completata?"checked":""} onclick="toggleSerie(${si},${ai},${ei},${si2},this)">
        <input type="number" value="${s.peso}" onchange="modificaSerie(${si},${ai},${ei},${si2},'peso',this.value)" ${modalità==="allenamento"?"":""}>kg
        <input type="number" value="${s.reps}" onchange="modificaSerie(${si},${ai},${ei},${si2},'reps',this.value)" ${modalità==="allenamento"?"":""}>reps`;
      li.appendChild(liS);
    });

    if(modalità==="creazione"){
      const addSerieBtn = document.createElement("button");
      addSerieBtn.textContent="+ Aggiungi Serie";
      addSerieBtn.className="btn";
      addSerieBtn.onclick=()=>{ e.serie.push({peso:0,reps:0,completata:false}); salva(); mostraEsercizi(si,ai); };
      li.appendChild(addSerieBtn);
    }
  });
}

// ------------------- Aggiungi/Modifica Esercizio -------------------
function aggiungiEsercizio(si,ai){ editing={tipo:"esercizio",scheda:si,allenamento:ai,index:null}; popupInput.value=""; popup.classList.remove("hidden"); }
function editEsercizio(si,ai,ei){ editing={tipo:"esercizio",scheda:si,allenamento:ai,index:ei}; popupInput.value=schede[si].allenamenti[ai].esercizi[ei].nome; popup.classList.remove("hidden"); }
function deleteEsercizio(si,ai,ei){ schede[si].allenamenti[ai].esercizi.splice(ei,1); salva(); mostraEsercizi(si,ai); }

// ------------------- Modifica Serie/Recupero -------------------
function modificaSerie(si,ai,ei,si2,param,val){ schede[si].allenamenti[ai].esercizi[ei].serie[si2][param]=Number(val); salva(); }
function modificaRecupero(si,ai,ei,val){ schede[si].allenamenti[ai].esercizi[ei].recupero=Number(val); salva(); }

// ------------------- Modalità Allenamento -------------------
function avviaAllenamento(si,ai){
  const a = schede[si].allenamenti[ai];
  a.esercizi.forEach(e=>e.serie.forEach(s=>s.completata=false));
  a._cronometroStart=Date.now();
  main.innerHTML=`<h2>${a.nome}</h2><div id="timer">Tempo: 0s</div>`;
  mostraEsercizi(si,ai);

  a._cronometroInterval=setInterval(()=>{
    const elapsed = Math.floor((Date.now()-a._cronometroStart)/1000);
    document.getElementById("timer").textContent=`Tempo: ${elapsed}s`;
  },1000);

  const terminaBtn=document.createElement("button");
  terminaBtn.textContent="Termina Allenamento";
  terminaBtn.className="btn";
  terminaBtn.onclick=()=>terminaAllenamento(si,ai);
  main.appendChild(terminaBtn);
}

function terminaAllenamento(si,ai){
  const a = schede[si].allenamenti[ai];
  clearInterval(a._cronometroInterval);
  salvaAllenamentoStorico(si,ai);
  modalità="creazione";
  renderSchede();
}

function toggleSerie(si,ai,ei,si2,checkbox){
  let s = schede[si].allenamenti[ai].esercizi[ei].serie[si2];
  s.completata=checkbox.checked;
  salva();
  if(s.completata){
    let seconds = schede[si].allenamenti[ai].esercizi[ei].recupero;
    const countdown = document.createElement("span"); countdown.className="countdown";
    checkbox.parentElement.appendChild(countdown);
    const interval=setInterval(()=>{
      countdown.textContent=seconds+"s"; seconds--;
      if(seconds<0){ clearInterval(interval); countdown.remove(); new Audio('assets/beep.mp3').play(); }
    },1000);
  }
}

function salvaAllenamento(si,ai){ salva(); mostraAllenamenti(si); }

toggleModeBtn.onclick=()=>{
  modalità = modalità==="creazione"?"allenamento":"creazione";
  toggleModeBtn.textContent=modalità==="creazione"?"Modalità Allenamento":"Modalità Creazione";
  renderSchede();
};

renderSchede();
