// ✅ DATI
let schede = JSON.parse(localStorage.getItem("schede")) || [];
let editing = { tipo: null, scheda: null, allenamento: null, esercizio: null, serie: null };

const main = document.getElementById("main");
const schedeList = document.getElementById("schedeList");
const addSchedaBtn = document.getElementById("addSchedaBtn");
const popup = document.getElementById("popup");
const popupInput = document.getElementById("popupInput");
const popupSave = document.getElementById("popupSave");
const popupCancel = document.getElementById("popupCancel");

// ✅ SALVA DATI
function salva() {
  localStorage.setItem("schede", JSON.stringify(schede));
}

// ✅ RENDER HOME SCHEDE
function render() {
  main.innerHTML = `<ul id="schedeList"></ul>
    <button id="addSchedaBtn" class="btn">+ Aggiungi Scheda</button>`;
  const schedeList = document.getElementById("schedeList");
  const addSchedaBtn = document.getElementById("addSchedaBtn");

  schede.forEach((s, si) => {
    const li = document.createElement("li");
    li.className = "scheda";
    li.innerHTML = `
      <span>${s.nome}</span>
      <div>
        <button onclick="editScheda(${si})">✏️</button>
        <button onclick="deleteScheda(${si})">🗑️</button>
        <button onclick="mostraAllenamenti(${si})">📋</button>
      </div>
    `;
    schedeList.appendChild(li);
  });

  addSchedaBtn.onclick = () => {
    editing = { tipo: "scheda", index: null };
    popupInput.value = "";
    popup.classList.remove("hidden");
  };
}

// ✅ POPUP
popupCancel.onclick = () => popup.classList.add("hidden");
popupSave.onclick = () => {
  const nome = popupInput.value.trim();
  if (!nome) return;

  switch(editing.tipo) {
    case "scheda":
      if (editing.index !== null) schede[editing.index].nome = nome;
      else schede.push({ nome, allenamenti: [] });
      break;
    case "allenamento":
      const aIndex = editing.index;
      const sIndex = editing.scheda;
      if (aIndex !== null) schede[sIndex].allenamenti[aIndex].nome = nome;
      else schede[sIndex].allenamenti.push({ nome, esercizi: [] });
      mostraAllenamenti(sIndex);
      break;
    case "esercizio":
      const eIndex = editing.index;
      const sIdx = editing.scheda;
      const aIdx = editing.allenamento;
      if (eIndex !== null) schede[sIdx].allenamenti[aIdx].esercizi[eIndex].nome = nome;
      else schede[sIdx].allenamenti[aIdx].esercizi.push({ nome, serie: [] });
      mostraEsercizi(sIdx, aIdx);
      break;
    case "serie":
      const si = editing.scheda;
      const ai = editing.allenamento;
      const ei = editing.esercizio;
      const serieIndex = editing.index;
      const { peso, reps, recupero } = editing.temp;
      if (serieIndex !== null) {
        let s = schede[si].allenamenti[ai].esercizi[ei].serie[serieIndex];
        s.peso = peso; s.reps = reps; s.recupero = recupero;
      } else {
        schede[si].allenamenti[ai].esercizi[ei].serie.push({ peso, reps, recupero, completata: false });
      }
      mostraEsercizi(si, ai);
      break;
  }

  salva();
  popup.classList.add("hidden");
  if (editing.tipo === "scheda") render();
};

// ✅ SCHEDE
function editScheda(i) {
  editing = { tipo: "scheda", index: i };
  popupInput.value = schede[i].nome;
  popup.classList.remove("hidden");
}
function deleteScheda(i) { schede.splice(i, 1); salva(); render(); }

// ✅ ALLENAMENTI
function mostraAllenamenti(si) {
  const s = schede[si];
  main.innerHTML = `<h2>${s.nome}</h2>
    <ul id="allenamentiList"></ul>
    <button class="btn" onclick="aggiungiAllenamento(${si})">+ Aggiungi Allenamento</button>
    <button class="btn" onclick="render()">⬅ Torna</button>
  `;
  const list = document.getElementById("allenamentiList");
  s.allenamenti.forEach((a, ai) => {
    const li = document.createElement("li");
    li.className = "allenamento";
    li.innerHTML = `
      <span>${a.nome}</span>
      <div>
        <button onclick="editAllenamento(${si},${ai})">✏️</button>
        <button onclick="deleteAllenamento(${si},${ai})">🗑️</button>
        <button onclick="mostraEsercizi(${si},${ai})">📋</button>
      </div>
    `;
    list.appendChild(li);
  });
}
function aggiungiAllenamento(si) { editing = { tipo:"allenamento", scheda:si, index:null }; popupInput.value=""; popup.classList.remove("hidden"); }
function editAllenamento(si, ai) { editing = { tipo:"allenamento", scheda:si, index:ai }; popupInput.value=schede[si].allenamenti[ai].nome; popup.classList.remove("hidden"); }
function deleteAllenamento(si, ai) { schede[si].allenamenti.splice(ai,1); salva(); mostraAllenamenti(si); }

// ✅ ESERCIZI
function mostraEsercizi(si, ai) {
  const a = schede[si].allenamenti[ai];
  main.innerHTML = `<h2>${a.nome}</h2>
    <ul id="eserciziList"></ul>
    <button class="btn" onclick="aggiungiEsercizio(${si},${ai})">+ Aggiungi Esercizio</button>
    <button class="btn" onclick="mostraAllenamenti(${si})">⬅ Torna</button>
  `;
  const list = document.getElementById("eserciziList");
  a.esercizi.forEach((e, ei) => {
    const li = document.createElement("li");
    li.className = "esercizio";
    li.innerHTML = `<span>${e.nome}</span>
      <div>
        <button onclick="editEsercizio(${si},${ai},${ei})">✏️</button>
        <button onclick="deleteEsercizio(${si},${ai},${ei})">🗑️</button>
      </div>
      <ul id="serieList${ei}"></ul>
      <button class="btn" onclick="aggiungiSerie(${si},${ai},${ei})">+ Aggiungi Serie</button>
    `;
    list.appendChild(li);
    const serieList = document.getElementById(`serieList${ei}`);
    e.serie.forEach((s, si2) => {
      const li2 = document.createElement("li");
      li2.className = "serie";
      li2.innerHTML = `
        Serie: ${si2+1} | Peso: ${s.peso}kg | Reps: ${s.reps} | Recupero: ${s.recupero}s
        <input type="checkbox" ${s.completata ? "checked" : ""} onclick="toggleSerie(${editing.scheda},${editing.allenamento},${ei},${si2},this)">
      `;
      serieList.appendChild(li2);
    });
  });
}
function aggiungiEsercizio(si, ai) { editing={tipo:"esercizio", scheda:si, allenamento:ai, index:null}; popupInput.value=""; popup.classList.remove("hidden"); }
function editEsercizio(si, ai, ei) { editing={tipo:"esercizio", scheda:si, allenamento:ai, index:ei}; popupInput.value=schede[si].allenamenti[ai].esercizi[ei].nome; popup.classList.remove("hidden"); }
function deleteEsercizio(si, ai, ei){ schede[si].allenamenti[ai].esercizi.splice(ei,1); salva(); mostraEsercizi(si,ai); }

// ✅ SERIE
function aggiungiSerie(si, ai, ei){
  const peso = prompt("Peso (kg):", "50");
  const reps = prompt("Reps:", "10");
  const recupero = prompt("Recupero (s):", "60");
  if(!peso || !reps || !recupero) return;
  schede[si].allenamenti[ai].esercizi[ei].serie.push({peso:+peso, reps:+reps, recupero:+recupero, completata:false});
  salva();
  mostraEsercizi(si,ai);
}

function toggleSerie(si, ai, ei, seIdx, checkbox){
  let s = schede[si].allenamenti[ai].esercizi[ei].serie[seIdx];
  s.completata = checkbox.checked;
  salva();
  mostraEsercizi(si, ai); // aggiorna classe colori

  if(s.completata){
    let seconds = s.recupero;
    const liSerie = document.querySelectorAll(".serie")[seIdx]; // li della serie
    const countdownSpan = document.createElement("span");
    countdownSpan.className = "countdown";
    liSerie.appendChild(countdownSpan);

    const interval = setInterval(()=>{
      countdownSpan.textContent = seconds;
      seconds--;
      if(seconds<0){
        clearInterval(interval);
        countdownSpan.remove();
        const audio = new Audio('assets/beep.mp3');
        audio.play();
        alert("Recupero terminato, inizia la prossima serie!");
      }
    }, 1000);
  }
}
