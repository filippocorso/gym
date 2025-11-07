let schede = JSON.parse(localStorage.getItem("schede")) || [];
let editing = {tipo:null, scheda:null, allenamento:null, esercizio:null, serie:null};
let modalità = "creazione"; // "creazione" o "allenamento"

const main = document.getElementById("main");
const popup = document.getElementById("popup");
const popupInput = document.getElementById("popupInput");
const popupSave = document.getElementById("popupSave");
const popupCancel = document.getElementById("popupCancel");
const toggleModeBtn = document.getElementById("toggleMode");

function salva(){ localStorage.setItem("schede", JSON.stringify(schede)); }

// ------------------- RENDER SCHEDE -------------------
function render(){
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

  if(modalità==="creazione" && addSchedaBtn){
    addSchedaBtn.onclick=()=>{
      editing={tipo:"scheda",index:null};
      popupInput.value="";
      popup.classList.remove("hidden");
    };
  }
}

// ------------------- POPUP -------------------
popupCancel.onclick=()=>popup.classList.add("hidden");
popupSave.onclick=()=>{
  const nome=popupInput.value.trim();
  if(!nome) return;
  switch(editing.tipo){
    case "scheda":
      if(editing.index!==null) schede[editing.index].nome=nome;
      else schede.push({nome,allenamenti:[]});
      break;
    case "allenamento":
      const aIndex=editing.index, sIndex=editing.scheda;
      if(aIndex!==null) schede[sIndex].allenamenti[aIndex].nome=nome;
      else schede[sIndex].allenamenti.push({nome,esercizi:[]});
      break;
    case "esercizio":
      const eIndex=editing.index, si1=editing.scheda, ai=editing.allenamento;
      if(eIndex!==null) schede[si1].allenamenti[ai].esercizi[eIndex].nome=nome;
      else schede[si1].allenamenti[ai].esercizi.push({nome,serie:[],recupero:30});
      break;
  }
  salva();
  popup.classList.add("hidden");
  render();
};

// ------------------- SCHEDE -------------------
function editScheda(i){ editing={tipo:"scheda",index:i}; popupInput.value=schede[i].nome; popup.classList.remove("hidden"); }
function deleteScheda(i){ schede.splice(i,1); salva(); render(); }

// ------------------- ALLENAMENTI -------------------
function mostraAllenamenti(si){
  const s=schede[si];
  main.innerHTML=`<h2>${s.nome}</h2>
  <ul id="allenamentiList" class="list"></ul>
  ${modalità==="creazione"?'<button class="btn" onclick="aggiungiAllenamento('+si+')">+ Aggiungi Allenamento</button>':""}`;
  const list=document.getElementById("allenamentiList");
  s.allenamenti.forEach((a,ai)=>{
    const li=document.createElement("li");
    li.innerHTML=`<span onclick="mostraEsercizi(${si},${ai})" style="flex:1;text-align:left;cursor:pointer">${a.nome}</span>
      ${modalità==="creazione"?`<div>
        <button onclick="editAllenamento(${si},${ai})" class="btn">✏️</button>
        <button onclick="deleteAllenamento(${si},${ai})" class="btn">🗑️</button>
      </div>`:""}`;
    list.appendChild(li);
  });
}

function aggiungiAllenamento(si){ 
  editing={tipo:"allenamento",scheda:si,index:null}; 
  popupInput.value=""; 
  popup.classList.remove("hidden"); 
}

function editAllenamento(si,ai){ 
  editing={tipo:"allenamento",scheda:si,index:ai}; 
  popupInput.value=schede[si].allenamenti[ai].nome; 
  popup.classList.remove("hidden"); 
}

function deleteAllenamento(si,ai){ 
  schede[si].allenamenti.splice(ai,1); 
  salva(); 
  mostraAllenamenti(si); 
}

// ------------------- ESERCIZI -------------------
function mostraEsercizi(si,ai){
  const a=schede[si].allenamenti[ai];
  main.innerHTML=`<h2>${a.nome}</h2>
    <ul id="eserciziList" class="list"></ul>
    ${modalità==="creazione"?'<button class="btn" onclick="aggiungiEsercizio('+si+','+ai+')">+ Aggiungi Esercizio</button>':""}
    ${modalità==="creazione"?'<button class="btn" onclick="salvaAllenamento('+si+','+ai+')">💾 Salva</button>':""}
    <button class="btn" onclick="mostraAllenamenti('+si+')">⬅ Torna</button>`;

  const list=document.getElementById("eserciziList");
  a.esercizi.forEach((e,ei)=>{
    const li=document.createElement("li");
    li.innerHTML=`<div class="nomeEsercizio">${e.nome}</div>
      <div>Recupero: <input type="number" value="${e.recupero}" onchange="modificaRecupero(${si},${ai},${ei},this.value)"/> s</div>
      ${modalità==="creazione"?`<div>
        <button onclick="editEsercizio(${si},${ai},${ei})" class="btn">✏️</button>
        <button onclick="deleteEsercizio(${si},${ai},${ei})" class="btn">🗑️</button>
      </div>`:""}`;
    list.appendChild(li);

    // Serie
    e.serie.forEach((s,si2)=>{
      const liS=document.createElement("div");
      liS.className="serie "+(s.completata?"completed":"pending");
      liS.innerHTML=`<input type="checkbox" ${s.completata?"checked":""} onclick="toggleSerie(${si},${ai},${ei},${si2},this)">
        <input type="number" value="${s.peso}" onchange="modificaSerie(${si},${ai},${ei},${si2},'peso',this.value)" ${modalità==="allenamento"?"disabled":""}>kg
        <input type="number" value="${s.reps}" onchange="modificaSerie(${si},${ai},${ei},${si2},'reps',this.value)" ${modalità==="allenamento"?"disabled":""}>reps`;
      li.appendChild(liS);
    });

    // Bottone aggiungi serie
    if(modalità==="creazione"){
      const addSerieBtn=document.createElement("button");
      addSerieBtn.textContent="+ Aggiungi Serie";
      addSerieBtn.className="btn";
      addSerieBtn.onclick=()=>{
        e.serie.push({peso:0,reps:0,completata:false});
        salva();
        mostraEsercizi(si,ai);
      };
      li.appendChild(addSerieBtn);
    }
  });
}

// ------------------- Aggiungi/Modifica esercizio -------------------
function aggiungiEsercizio(si,ai){ 
  editing={tipo:"esercizio",scheda:si,allenamento:ai,index:null}; 
  popupInput.value=""; 
  popup.classList.remove("hidden"); 
}

function editEsercizio(si,ai,ei){ 
  editing={tipo:"esercizio",scheda:si,allenamento:ai,index:ei}; 
  popupInput.value=schede[si].allenamenti[ai].esercizi[ei].nome; 
  popup.classList.remove("hidden"); 
}

function deleteEsercizio(si,ai,ei){ 
  schede[si].allenamenti[ai].esercizi.splice(ei,1); 
  salva(); 
  mostraEsercizi(si,ai); 
}

// ------------------- MODIFICA SERIE / RECUPERO -------------------
function modificaSerie(si,ai,ei,si2,param,val){
  schede[si].allenamenti[ai].esercizi[ei].serie[si2][param]=Number(val);
  salva();
}

function modificaRecupero(si,ai,ei,val){
  schede[si].allenamenti[ai].esercizi[ei].recupero=Number(val);
  salva();
}

// ------------------- SERIE ALLENAMENTO -------------------
function toggleSerie(si,ai,ei,si2,checkbox){
  if(modalità==="creazione") return;
  let s = schede[si].allenamenti[ai].esercizi[ei].serie[si2];
  s.completata = checkbox.checked;
  salva();
  mostraEsercizi(si,ai);

  if(s.completata){
    let seconds = schede[si].allenamenti[ai].esercizi[ei].recupero;
    const countdown = document.createElement("span");
    countdown.className="countdown";
    checkbox.parentElement.appendChild(countdown);

    const interval = setInterval(()=>{
      countdown.textContent = seconds + "s";
      seconds--;
      if(seconds < 0){
        clearInterval(interval);
        countdown.remove();
        const audio = new Audio('assets/beep.mp3');
        audio.play();
      }
    }, 1000);
  }
}

// ------------------- SALVA ALLENAMENTO -------------------
function salvaAllenamento(si,ai){
  salva();
  mostraAllenamenti(si);
}

// ------------------- MODALITÀ -------------------
toggleModeBtn.onclick=()=>{
  modalità=modalità==="creazione"?"allenamento":"creazione";
  toggleModeBtn.textContent=modalità==="creazione"?"Modalità Allenamento":"Modalità Creazione";
  render();
};

// ------------------- INIT -------------------
render();
