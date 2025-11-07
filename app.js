let schede = JSON.parse(localStorage.getItem("schede")) || [];
let storico = JSON.parse(localStorage.getItem("storico")) || [];
let editing = {tipo:null, scheda:null, allenamento:null, esercizio:null, serie:null};
let modalità = "creazione"; 
let cronometroInterval=null;
let tempoTotale=0;

const main = document.getElementById("main");
const popup = document.getElementById("popup");
const popupInput = document.getElementById("popupInput");
const popupSave = document.getElementById("popupSave");
const popupCancel = document.getElementById("popupCancel");
const toggleModeBtn = document.getElementById("toggleMode");
const viewHistoryBtn = document.getElementById("viewHistory");

// ------------------ Salvataggio ------------------
function salvaSchede(){ localStorage.setItem("schede", JSON.stringify(schede)); }
function salvaStorico(){ localStorage.setItem("storico", JSON.stringify(storico)); }

// ------------------ Render schede ------------------
function renderSchede(){
  main.innerHTML=`<ul id="schedeList" class="list"></ul>
  ${modalità==="creazione"?'<button id="addSchedaBtn" class="btn">+ Aggiungi Scheda</button>':""}`;
  const schedeList = document.getElementById("schedeList");
  const addSchedaBtn = document.getElementById("addSchedaBtn");

  schede.forEach((s,si)=>{
    const li=document.createElement("li");
    li.innerHTML=`<span onclick="mostraAllenamenti(${si})" style="cursor:pointer;display:block;text-align:left">${s.nome}</span>
      ${modalità==="creazione"?`<div>
        <button onclick="editScheda(${si})" class="btn">✏️</button>
        <button onclick="deleteScheda(${si})" class="btn">🗑️</button>
      </div>`:""}`;
    schedeList.appendChild(li);
  });

  if(modalità==="creazione" && addSchedaBtn){
    addSchedaBtn.onclick=()=>{
      editing={tipo:"scheda",index:null};
      popupInput.value="";
      popup.classList.remove("hidden");
    };
  }
}

// ------------------ Popup ------------------
popupCancel.onclick=()=>popup.classList.add("hidden");
popupSave.onclick=()=>{
  const nome = popupInput.value.trim();
  if(!nome) return;

  switch(editing.tipo){
    case "scheda":
      if(editing.index!==null) schede[editing.index].nome=nome;
      else schede.push({nome,allenamenti:[]});
      salvaSchede(); popup.classList.add("hidden"); renderSchede(); break;

    case "allenamento":
      const si = editing.scheda;
      const ai = editing.index;
      if(ai!==null) schede[si].allenamenti[ai].nome = nome;
      else schede[si].allenamenti.push({nome,esercizi:[]});
      salvaSchede(); popup.classList.add("hidden"); mostraAllenamenti(si); break;

    case "esercizio":
      const si1 = editing.scheda;
      const ai1 = editing.allenamento;
      const ei = editing.index;
      if(ei!==null) schede[si1].allenamenti[ai1].esercizi[ei].nome=nome;
      else schede[si1].allenamenti[ai1].esercizi.push({nome,serie:[],recupero:30});
      salvaSchede(); popup.classList.add("hidden"); mostraEsercizi(si1,ai1); break;
  }
};

// ------------------ Schede edit/delete ------------------
function editScheda(i){ editing={tipo:"scheda",index:i}; popupInput.value=schede[i].nome; popup.classList.remove("hidden"); }
function deleteScheda(i){ schede.splice(i,1); salvaSchede(); renderSchede(); }

// ------------------ Allenamenti ------------------
function mostraAllenamenti(si){
  const s = schede[si];
  main.innerHTML=`<h2>${s.nome}</h2>
    <ul id="allenamentiList" class="list"></ul>
    ${modalità==="creazione"?'<button class="btn" onclick="aggiungiAllenamento('+si+')">+ Aggiungi Allenamento</button>':""}`;

  const list = document.getElementById("allenamentiList");
  s.allenamenti.forEach((a,ai)=>{
    const li=document.createElement("li");
    li.innerHTML=`<span onclick="mostraEsercizi(${si},${ai})" style="cursor:pointer;display:block;text-align:left">${a.nome}</span>
      ${modalità==="creazione"?`<div>
        <button onclick="editAllenamento(${si},${ai})" class="btn">✏️</button>
        <button onclick="deleteAllenamento(${si},${ai})" class="btn">🗑️</button>
      </div>`:""}`;
    list.appendChild(li);
  });

  if(modalità==="allenamento"){
    const startBtn = document.createElement("button");
    startBtn.className="btn"; startBtn.textContent="▶ Avvia Allenamento";
    startBtn.onclick=()=>{ tempoTotale=0; cronometroInterval=setInterval(()=>{ tempoTotale++; updateCronometro(); },1000); };
    main.appendChild(startBtn);
    const chrono = document.createElement("div"); chrono.id="cronometro"; chrono.style.margin="8px"; main.appendChild(chrono);
  }
}

// ------------------ Cronometro ------------------
function updateCronometro(){
  const c = document.getElementById("cronometro");
  if(c) c.textContent = "Tempo: "+formatTime(tempoTotale);
}
function formatTime(sec){ const m=Math.floor(sec/60); const s=sec%60; return `${m}m ${s}s`; }

// ------------------ Aggiungi/Modifica Allenamento ------------------
function aggiungiAllenamento(si){ editing={tipo:"allenamento",scheda:si,index:null}; popupInput.value=""; popup.classList.remove("hidden"); }
function editAllenamento(si,ai){ editing={tipo:"allenamento",scheda:si,index:ai}; popupInput.value=schede[si].allenamenti[ai].nome; popup.classList.remove("hidden"); }
function deleteAllenamento(si,ai){ schede[si].allenamenti.splice(ai,1); salvaSchede(); mostraAllenamenti(si); }

// ------------------ Esercizi ------------------
function mostraEsercizi(si,ai){
  const a = schede[si].allenamenti[ai];
  main.innerHTML=`<h2>${a.nome}</h2>
    <ul id="eserciziList" class="list"></ul>
    ${modalità==="creazione"?'<button class="btn" onclick="aggiungiEsercizio('+si+','+ai+')">+ Aggiungi Esercizio</button>':""}
    ${modalità==="creazione"?'<button class="btn" onclick="salvaAllenamento('+si+','+ai+')">💾 Salva</button>':""}
    ${modalità==="allenamento"?'<button class="btn" onclick="mostraAllenamenti('+si+')">⬅ Torna</button>':""}`;

  const list=document.getElementById("eserciziList");
  a.esercizi.forEach((e,ei)=>{
    const li=document.createElement("li");
    li.innerHTML=`<div class="nomeEsercizio"><input type="text" value="${e.nome}" onchange="modificaEsercizioNome(${si},${ai},${ei},this.value)"></div>
      <div>Recupero: <input type="number" value="${e.recupero}" onchange="modificaRecupero(${si},${ai},${ei},this.value)"> s</div>`;

    list.appendChild(li);

    e.serie.forEach((s,si2)=>{
      const divS=document.createElement("div");
      divS.className="serie";
      divS.innerHTML=`<div>
        ${modalità==="allenamento"?`<input type="checkbox" ${s.completata?"checked":""} onclick="toggleSerie(${si},${ai},${ei},${si2},this)">`:""}
        <input type="number" value="${s.peso}" onchange="modificaSerie(${si},${ai},${ei},${si2},'peso',this.value)">kg
        <input type="number" value="${s.reps}" onchange="modificaSerie(${si},${ai},${ei},${si2},'reps',this.value)">reps
      </div>`;
      li.appendChild(divS);
    });

    if(modalità==="creazione"){
      const btnAddSerie=document.createElement("button");
      btnAddSerie.textContent="+ Aggiungi Serie";
      btnAddSerie.className="btn";
      btnAddSerie.onclick=()=>{
        e.serie.push({peso:0,reps:0,completata:false});
        salvaSchede(); mostraEsercizi(si,ai);
      };
      li.appendChild(btnAddSerie);
    }
  });
}

// ------------------ Aggiungi/Modifica esercizio ------------------
function aggiungiEsercizio(si,ai){ editing={tipo:"esercizio",scheda:si,allenamento:ai,index:null}; popupInput.value=""; popup.classList.remove("hidden"); }
function modificaEsercizioNome(si,ai,ei,val){ schede[si].allenamenti[ai].esercizi[ei].nome=val; salvaSchede(); }

// ------------------ Modifica Serie / Recupero ------------------
function modificaSerie(si,ai,ei,si2,param,val){ schede[si].allenamenti[ai].esercizi[ei].serie[si2][param]=Number(val); salvaSchede(); }
function modificaRecupero(si,ai,ei,val){ schede[si].allenamenti[ai].esercizi[ei].recupero=Number(val); salvaSchede(); }

// ------------------ Toggle Serie e Beep ------------------
function toggleSerie(si,ai,ei,si2,checkbox){
  let s = schede[si].allenamenti[ai].esercizi[ei].serie[si2];
  s.completata = checkbox.checked; salvaSchede(); mostraEsercizi(si,ai);
  if(s.completata){
    let seconds = schede[si].allenamenti[ai].esercizi[ei].recupero;
    const countdown=document.createElement("span"); countdown.className="countdown";
    checkbox.parentElement.appendChild(countdown);
    const interval=setInterval(()=>{
      countdown.textContent=seconds+"s";
      seconds--;
      if(seconds<0){ clearInterval(interval); countdown.remove(); new Audio('assets/beep.mp3').play(); }
    },1000);
  }
}

// ------------------ Salva Allenamento ------------------
function salvaAllenamento(si,ai){ salvaSchede(); mostraAllenamenti(si); }

// ------------------ Modalità ------------------
toggleModeBtn.onclick=()=>{
  modalità = modalità==="creazione"?"allenamento":"creazione";
  toggleModeBtn.textContent=modalità==="creazione"?"Modalità Allenamento":"Modalità Creazione";
  renderSchede();
}

// ------------------ Storico ------------------
viewHistoryBtn.onclick=()=>{ mostraStorico(); }
function mostraStorico(){
  main.innerHTML="<h2>Storico Allenamenti</h2><canvas id='grafico'></canvas><button class='btn' onclick='renderSchede()'>⬅ Torna</button>";
  const ctx=document.getElementById("grafico").getContext("2d");
  const labels = storico.map(s=>s.nomeAllenamento);
  const data = storico.map(s=>s.volume);
  new Chart(ctx,{type:'bar',data:{labels, datasets:[{label:'Volume peso totale',data, backgroundColor:'#0a84ff'}]}});
}

// ------------------ INIT ------------------
renderSchede();
