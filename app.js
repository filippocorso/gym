let workouts = JSON.parse(localStorage.getItem("workouts")) || [];

function save() {
  localStorage.setItem("workouts", JSON.stringify(workouts));
  render();
}

function addWorkout() {
  const name = prompt("Nome della scheda?");
  if (!name) return;
  workouts.push({ name, exercises: [] });
  save();
}

function deleteWorkout(index) {
  if (!confirm("Eliminare la scheda?")) return;
  workouts.splice(index, 1);
  save();
}

function renameWorkout(index) {
  const newName = prompt("Nuovo nome della scheda:", workouts[index].name);
  if (!newName) return;
  workouts[index].name = newName;
  save();
}

function render() {
  const container = document.getElementById("workouts");
  container.innerHTML = "";

  workouts.forEach((w, i) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <span>${w.name}</span>
      <div style="display:flex; gap:10px;">
        <button style="background:#444;padding:6px 10px;" onclick="renameWorkout(${i})">✏️</button>
        <button style="background:#900;padding:6px 10px;" onclick="deleteWorkout(${i})">🗑️</button>
      </div>
    `;
    container.appendChild(div);
  });
}

render();
