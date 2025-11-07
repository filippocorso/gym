let schede = JSON.parse(localStorage.getItem("schede")) || [];
let editingIndex = null;

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

  schede.forEach((s, i) => {
    const li = document.createElement("li");
    li.className = "scheda";
    li.innerHTML = `
      <span>${s}</span>
      <div>
        <button onclick="editScheda(${i})">✏️</button>
        <button onclick="deleteScheda(${i})">🗑️</button>
      </div>
    `;
    schedeList.appendChild(li);
  });
}

addSchedaBtn.onclick = () => {
  editingIndex = null;
  popupInput.value = "";
  popup.classList.remove("hidden");
};

popupCancel.onclick = () => {
  popup.classList.add("hidden");
};

popupSave.onclick = () => {
  const nome = popupInput.value.trim();
  if (!nome) return;

  if (editingIndex !== null) {
    schede[editingIndex] = nome;
  } else {
    schede.push(nome);
  }

  salva();
  render();
  popup.classList.add("hidden");
};

function editScheda(i) {
  editingIndex = i;
  popupInput.value = schede[i];
  popup.classList.remove("hidden");
}

function deleteScheda(i) {
  schede.splice(i, 1);
  salva();
  render();
}

render();
