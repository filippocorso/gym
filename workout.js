let workouts = JSON.parse(localStorage.getItem("workouts"));
const index = new URLSearchParams(location.search).get("i");

const workout = workouts[index];

document.getElementById("title").textContent = workout.name;

function save() {
  localStorage.setItem("workouts", JSON.stringify(workouts));
  render();
}

function addExercise() {
  const name = prompt("Nome esercizio?");
  if (!name) return;
  workout.exercises.push({
    name,
    sets: []
  });
  save();
}

function deleteExercise(i) {
  if (!confirm("Elimino esercizio?")) return;
  workout.exercises.splice(i, 1);
  save();
}

function render() {
  const list = document.getElementById("exercises");
  list.innerHTML = "";

  workout.exercises.forEach((ex, i) => {
    const div = document.createElement("div");
    div.className = "exercise";
    div.innerHTML = `
      <span>${ex.name}</span>
      <button class="small" onclick="deleteExercise(${i})">🗑️</button>
    `;
    list.appendChild(div);
  });
}

render();
