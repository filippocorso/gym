function salvaAllenamentoStorico(si,ai){
  const a = schede[si].allenamenti[ai];
  const data = new Date().toLocaleString();
  let volumeTotale=0;

  a.esercizi.forEach(e=>e.serie.forEach(s=>{ volumeTotale+=s.peso*s.reps }));

  storico.push({
    scheda:schede[si].nome,
    allenamento:a.nome,
    data,
    durata:Math.floor((Date.now()-a._cronometroStart)/1000),
    volumeTotale,
    esercizi:JSON.parse(JSON.stringify(a.esercizi))
  });

  salvaStorico();
  alert("Allenamento salvato!");
}

function mostraStorico(){
  main.innerHTML="<h2>Storico Allenamenti</h2><canvas id='grafico'></canvas>";
  const ctx=document.getElementById("grafico").getContext("2d");
  const labels=storico.map(e=>e.data);
  const data=storico.map(e=>e.volumeTotale);

  new Chart(ctx,{
    type:'line',
    data:{
      labels:labels,
      datasets:[{label:'Volume Totale',data:data,borderColor:'#0a84ff',fill:false}]
    },
    options:{responsive:true}
  });
}
