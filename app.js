// DATI
let schede = JSON.parse(localStorage.getItem("schede")) || [];
let editing = { tipo:null, scheda:null, allenamento:null, esercizio:null, serie:null };

const main = document.getElementById("main");
const popup = document.getElementById("popup");
const popupInput = document.getElementById("popupInput");
const popupSave = document.getElementById("popupSave");
const popupCancel = document.getElementById("popupCancel");

// SALVATAGGIO
function salva() { localStorage.setItem("schede", JSON.stringify(schede)); }

// HOME SCHEDE
function render(){
  main.innerHTML = `<ul id="schedeList" class="list"></ul>
    <button id="addSchedaBtn" class="btn">+ Aggiungi Scheda</button>`;
  const schedeList = document.getElementById("schedeList");
  const addSchedaBtn = document.getElementById("addSchedaBtn");

  schede.forEach((s, si)=>{
    const li = document.createElement("li");
    li.innerHTML = `<span>${s.nome}</span>
      <div>
        <button onclick="editScheda(${si})" class="btn">✏️</button>
        <button onclick="deleteScheda(${si})" class="btn">🗑️</button>
        <button onclick="mostraAllenamenti(${si})" class="btn">📋</button>
      </div>`;
    schedeList.appendChild(li);
  });

  addSchedaBtn.onclick = ()=>{
    editing={tipo:"scheda",index:null};
    popupInput.value="";
    popup.classList.remove("hidden");
  };
}

// POPUP
popupCancel.onclick = ()=>popup.classList.add("hidden");
popupSave.onclick = ()=>{
  const nome = popupInput.value.trim();
  if(!nome) return;

  switch(editing.tipo){
    case "scheda":
      if(editing.index!==null) schede[editing.index].nome=nome;
      else schede.push({nome, allenamenti:[]});
      break;
    case "allenamento":
      const aIndex=editing.index, sIndex=editing.scheda;
      if(aIndex!==null) schede[sIndex].allenamenti[aIndex].nome=nome;
      else schede[sIndex].allenamenti.push({nome, esercizi:[]});
      mostraAllenamenti(sIndex);
      break;
    case "esercizio":
      const eIndex=editing.index, si=editing.scheda, ai=editing.allenamento;
      if(eIndex!==null) schede[si].allenamenti[ai].esercizi[eIndex].nome=nome;
      else schede[si].allenamenti[ai].esercizi.push({nome, serie:[]});
      mostraEsercizi(si,ai);
      break;
  }

  salva();
  popup.classList.add("hidden");
  if(editing.tipo==="scheda") render();
};

// SCHEDE
function editScheda(i){ editing={tipo:"scheda",index:i}; popupInput.value=schede[i].nome; popup.classList.remove("hidden"); }
function deleteScheda(i){ schede.splice(i,1); salva(); render(); }

// ALLENAMENTI
function mostraAllenamenti(si){
  const s=schede[si];
  main.innerHTML=`<h2>${s.nome}</h2>
    <ul id="allenamentiList" class="list"></ul>
    <button class="btn" onclick="aggiungiAllenamento(${si})">+ Aggiungi Allenamento</button>
    <button class="btn" onclick="render()">⬅ Torna</button>`;
  const list=document.getElementById("allenamentiList");
  s.allenamenti.forEach((a,ai)=>{
    const li=document.createElement("li");
    li.innerHTML=`<span>${a.nome}</span>
      <div>
        <button onclick="editAllenamento(${si},${ai})" class="btn">✏️</button>
        <button onclick="deleteAllenamento(${si},${ai})" class="btn">🗑️</button>
        <button onclick="mostraEsercizi(${si},${ai})" class="btn">📋</button>
      </div>`;
    list.appendChild(li);
  });
}
function aggiungiAllenamento(si){ editing={tipo:"allenamento",scheda:si,index:null}; popupInput.value=""; popup.classList.remove("hidden"); }
function editAllenamento(si,ai){ editing={tipo:"allenamento",scheda:si,index:ai}; popupInput.value=schede[si].allenamenti[ai].nome; popup.classList.remove("hidden"); }
function deleteAllenamento(si,ai){ schede[si].allenamenti.splice(ai,1); salva(); mostraAllenamenti(si); }

// ESERCIZI
function mostraEsercizi(si,ai){
  const a=schede[si].allenamenti[ai];
  main.innerHTML=`<h2>${a.nome}</h2>
    <ul id="eserciziList" class="list"></ul>
    <button class="btn" onclick="aggiungiEsercizio(${si},${ai})">+ Aggiungi Esercizio</button>
    <button class="btn" onclick="mostraAllenamenti(${si})">⬅ Torna</button>`;
  const list=document.getElementById("eserciziList");
  a.esercizi.forEach((e,ei)=>{
    const li=document.createElement("li");
    li.innerHTML=`<span>${e.nome}</span>
      <div>
        <button onclick="editEsercizio(${si},${ai},${ei})" class="btn">✏️</button>
        <button onclick="deleteEsercizio(${si},${ai},${ei})" class="btn">🗑️</button>
      </div>
      <ul id="serieList${ei}"></ul>
      <button class="btn" onclick="aggiungiSerie(${si},${ai},${ei})">+ Serie</button>`;
    list.appendChild(li);
    const serieList=document.getElementById(`serieList${ei}`);
    e.serie.forEach((s,si2)=>{
      const li2=document.createElement("li");
      li2.className="serie "+(s.completata?"completed":"pending");
      li2.innerHTML=`Serie ${si2+1}: ${s.peso}kg | Reps: ${s.reps} | Recupero: ${s.recupero}s
        <input type="checkbox" ${s.completata?"checked":""} onclick="toggleSerie(${si},${ai},${ei},${si2},this)">`;
      serieList.appendChild(li2);
    });
  });
}

function aggiungiEsercizio(si,ai){ editing={tipo:"esercizio",scheda:si,allenamento:ai,index:null}; popupInput.value=""; popup.classList.remove("hidden"); }
function editEsercizio(si,ai,ei){ editing={tipo:"esercizio",scheda:si,allenamento:ai,index:ei}; popupInput.value=schede[si].allenamenti[ai].esercizi[ei].nome; popup.classList.remove("hidden"); }
function deleteEsercizio(si,ai,ei){ schede[si].allenamenti[ai].esercizi.splice(ei,1); salva(); mostraEsercizi(si,ai); }

// SERIE
function aggiungiSerie(si,ai,ei){
  const peso=prompt("Peso (kg):","50");
  const reps=prompt("Reps:","10");
  const recupero=prompt("Recupero (s):","60");
  if(!peso||!reps||!recupero) return;
  schede[si].allenamenti[ai].esercizi[ei].serie.push({peso:+peso,reps:+reps,recupero:+recupero,completata:false});
  salva(); mostraEsercizi(si,ai);
}

function toggleSerie(si,ai,ei,si2,checkbox){
  let s=schede[si].allenamenti[ai].esercizi[ei].serie[si2];
  s.completata=checkbox.checked;
  salva(); mostraEsercizi(si,ai);

  if(s.completata){
    let seconds=s.recupero;
    const liSerie=document.querySelectorAll(".serie")[si2];
    const countdown=document.createElement("span");
    countdown.className="countdown";
    liSerie.appendChild(countdown);

    const interval=setInterval(()=>{
      countdown.textContent=seconds;
      seconds--;
      if(seconds<0){ clearInterval(interval); countdown.remove(); const audio=new Audio('assets/beep.mp3'); audio.play(); alert("Recupero terminato!"); }
    },1000);
  }
}

// INIT
render();
