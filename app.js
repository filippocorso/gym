let schede = JSON.parse(localStorage.getItem("schede")) || [];
let editing = { tipo: null, scheda: null, allenamento: null, esercizio: null, serie: null };

const main = document.getElementById("main");
const schedeList = document.getElementById("schedeList");
const addSchedaBtn = document.getElementById("addSchedaBtn");
const popup = document.getElementById("popup");
const popupInput = document.getElementById("popupInput");
const popupSave = document.getElementById("popupSave");
const popupCancel = document.getElementById("popupCancel");

function salva() {
  localStorage.setItem("schede", JSON.stringify(schede));
}

function render() {
  schedeList.innerHTML = "";
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
}

addSchedaBtn.onclick = () => {
  editing = { tipo: "scheda", index: null };
  popupInput.value = "";
  popup.classList.remove("hidden");
};

popupCancel.onclick = () => popup.classList.add("hidden");

popupSave.onclick = () => {
  const nome = popupInput.value.trim();
  if (!nome) return;

  if (editing.tipo === "scheda") {
    if (editing.index !== null) schede[editing.index].nome = nome;
    else schede.push({ nome, allenamenti: [] });
  }
  salva();
  render();
  popup.classList.add("hidden");
};

function editScheda(i) {
  editing = { tipo: "scheda", index: i };
  popupInput.value = schede[i].nome;
  popup.classList.remove("hidden");
}

function deleteScheda(i) {
  schede.splice(i, 1);
  salva();
  render();
}

// Mostra Allenamenti di una scheda
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

function aggiungiAllenamento(si) {
  editing = { tipo: "allenamento", scheda: si, index: null };
  popupInput.value = "";
  popup.classList.remove("hidden");
}

function editAllenamento(si, ai) {
  editing = { tipo: "allenamento", scheda: si, index: ai };
  popupInput.value = schede[si].allenamenti[ai].nome;
  popup.classList.remove("hidden");
}

function deleteAllenamento(si, ai) {
  schede[si].allenamenti.splice(ai, 1);
  salva();
  mostraAllenamenti(si);
}

// TODO: mostraEsercizi con serie e timer (posso fare il passo successivo)
render();
