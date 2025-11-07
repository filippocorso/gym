function render() {
  const container = document.getElementById("workouts");
  container.innerHTML = "";

  workouts.forEach((w, i) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <span>${w.name}</span>
      <div style="display:flex; gap:10px;" onclick="event.stopPropagation()">
        <button style="background:#444;padding:6px 10px;" onclick="renameWorkout(${i})">✏️</button>
        <button style="background:#900;padding:6px 10px;" onclick="deleteWorkout(${i})">🗑️</button>
      </div>
    `;

    // 👇 Quando clicchi sulla card apri gli esercizi
    div.addEventListener("click", () => {
      window.location.href = `workout.html?i=${i}`;
    });

    container.appendChild(div);
  });
}
