let schede = JSON.parse(localStorage.getItem('schede')) || [];
let storico = JSON.parse(localStorage.getItem('storico')) || [];
let paginaCorrente = 'mainMenu';
let schedaCorrente = null;

// Navigazione
function apriPagina(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  paginaCorrente = id;
}

function goBack(current) {
  if (current === 'schedePage' || current === 'storicoPage') {
    apriPagina('mainMenu');
  } else if (current === 'creazionePage') {
    apriPagina('schedePage');
  } else if (current === 'allenamentoPage') {
    apriPagina('schedePage');
  }
}

function openSchede() {
  apriPagina('schedePage');
  mostraSchede();
}

function openCreazione() {
  apriPagina('creazionePage');
  document.getElementById('eserciziContainer').innerHTML = '';
  document.getElementById('nomeScheda').value = '';
}

function openStorico() {
  apriPagina('storicoPage');
  mostraStorico();
}

// Creazione scheda
function aggiungiEsercizio() {
  const container = document.getElementById('eserciziContainer');
  const div = document.createElement('div');
  div.className = 'esercizio';
  div.innerHTML = `
    <input type="text" placeholder="Nome esercizio" class="nomeEsercizio">
    <div class="serieContainer"></div>
    <button onclick="aggiungiSerie(this)">+ Serie</button>
    <button onclick="rimuoviEsercizio(this)">Elimina esercizio</button>
  `;
  container.appendChild(div);
}

function aggiungiSerie(btn) {
  const container = btn.parentElement.querySelector('.serieContainer');
  const div = document.createElement('div');
  div.className = 'serie';
  div.innerHTML = `
    <input type="number" placeholder="kg" class="pesoInput" min="0">
    <input type="number" placeholder="reps" class="repInput" min="0">
    <button onclick="this.parentElement.remove()">🗑️</button>
  `;
  container.appendChild(div);
}

function rimuoviEsercizio(btn) {
  btn.parentElement.remove();
}

function salvaScheda() {
  const nome = document.getElementById('nomeScheda').value.trim();
  if (!nome) return alert('Inserisci un nome per la scheda.');

  const esercizi = [];
  document.querySelectorAll('#eserciziContainer .esercizio').forEach(ex => {
    const nomeEx = ex.querySelector('.nomeEsercizio').value.trim();
    const serie = [];
    ex.querySelectorAll('.serie').forEach(s => {
      const peso = parseFloat(s.querySelector('.pesoInput').value) || 0;
      const reps = parseInt(s.querySelector('.repInput').value) || 0;
      serie.push({ peso, reps });
    });
    if (nomeEx) esercizi.push({ nome: nomeEx, serie });
  });

  schede.push({ nome, esercizi });
  localStorage.setItem('schede', JSON.stringify(schede));
  openSchede();
}

// Mostra schede
function mostraSchede() {
  const lista = document.getElementById('listaSchede');
  lista.innerHTML = '';
  schede.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'esercizio';
    div.innerHTML = `
      <h3>${s.nome}</h3>
      <button onclick="avviaAllenamento(${i})">Avvia allenamento</button>
      <button onclick="eliminaScheda(${i})">Elimina</button>
    `;
    lista.appendChild(div);
  });
}

function eliminaScheda(i) {
  if (confirm('Eliminare questa scheda?')) {
    schede.splice(i, 1);
    localStorage.setItem('schede', JSON.stringify(schede));
    mostraSchede();
  }
}

// Allenamento
function avviaAllenamento(i) {
  schedaCorrente = schede[i];
  apriPagina('allenamentoPage');
  document.getElementById('titoloAllenamento').textContent = schedaCorrente.nome;
  mostraAllenamento();
}

function mostraAllenamento() {
  const lista = document.getElementById('listaEserciziAllenamento');
  lista.innerHTML = '';
  schedaCorrente.esercizi.forEach((ex, i) => {
    const div = document.createElement('div');
    div.className = 'esercizio';
    div.innerHTML = `<h3>${ex.nome}</h3>`;
    ex.serie.forEach((s, j) => {
      const serieDiv = document.createElement('div');
      serieDiv.className = 'serie';
      serieDiv.innerHTML = `
        <div class="checkbox" onclick="toggleCheck(this)"></div>
        <span>${s.peso}kg × ${s.reps} reps</span>
      `;
      div.appendChild(serieDiv);
    });
    lista.appendChild(div);
  });
}

function toggleCheck(box) {
  box.classList.toggle('checked');
  const beep = new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');
  beep.play();
}

function salvaAllenamento() {
  const volume = schedaCorrente.esercizi.reduce((tot, ex) => {
    return tot + ex.serie.reduce((sTot, s) => sTot + s.peso * s.reps, 0);
  }, 0);

  const totaleSerie = schedaCorrente.esercizi.reduce((t, e) => t + e.serie.length, 0);
  const durata = (Math.random() * 60 + 20).toFixed(0); // placeholder

  storico.push({
    nome: schedaCorrente.nome,
    data: new Date().toLocaleString(),
    volume,
    serie: totaleSerie,
    durata
  });

  localStorage.setItem('storico', JSON.stringify(storico));

  // reset check
  document.querySelectorAll('.checkbox.checked').forEach(c => c.classList.remove('checked'));

  alert('Allenamento salvato!');
  apriPagina('schedePage');
}

// Storico
function mostraStorico() {
  const container = document.getElementById('storicoContainer');
  container.innerHTML = '';
  storico.forEach(item => {
    const div = document.createElement('div');
    div.className = 'esercizio';
    div.innerHTML = `
      <h3>${item.nome}</h3>
      <p>${item.data}</p>
      <p>Volume: ${item.volume} kg</p>
      <p>Serie: ${item.serie}</p>
      <p>Durata: ${item.durata} min</p>
    `;
    container.appendChild(div);
  });
}
