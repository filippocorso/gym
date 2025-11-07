<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Storico Allenamenti</title>
<link rel="stylesheet" href="app.css">
<script src="app.js"></script>
</head>
<body>
<header>
  <h1>Storico Allenamenti</h1>
  <button class="btn" onclick="window.location.href='index.html'">⬅ Torna Home</button>
</header>
<main id="main"></main>

<script>
function renderStorico(){
  const main = document.getElementById("main");
  main.innerHTML="";
  if(storico.length===0){ main.innerHTML="<p>Nessun allenamento salvato</p>"; return; }

  const list=document.createElement("ul");
  list.className="list";
  storico.forEach((a,i)=>{
    const li=document.createElement("li");
    li.innerHTML=`<span style="flex:1;text-align:left;cursor:pointer">${a.data} - ${a.scheda} - ${a.allenamento} - Volume: ${a.volumeTotale}</span>`;
    li.querySelector("span").onclick=()=>mostraDettaglioStorico(i);
    list.appendChild(li);
  });
  main.appendChild(list);
}

function mostraDettaglioStorico(i){
  const a = storico[i];
  const main = document.getElementById("main");
  main.innerHTML=`<h2>${a.scheda} - ${a.allenamento}</h2>
    <p>Data: ${a.data} | Durata: ${a.durata}s | Volume Totale: ${a.volumeTotale}</p>
    <button class="btn" onclick="renderStorico()">⬅ Torna</button>`;
  a.esercizi.forEach(e=>{
    const div=document.createElement("div");
    div.className="nomeEsercizio"; div.textContent=e.nome;
    main.appendChild(div);
    e.serie.forEach((s,si)=>{
      const serieDiv=document.createElement("div");
      serieDiv.className="serie";
      serieDiv.textContent=`Serie ${si+1}: ${s.peso}kg x ${s.reps} reps | Completata: ${s.completata?"✔️":"❌"}`;
      main.appendChild(serieDiv);
    });
  });
}

renderStorico();
</script>
</body>
</html>
