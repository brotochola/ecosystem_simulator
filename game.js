var FRAMENUM = 0;
var renderStrokes;
var renderCheckBox;
var grid = [];
var ctx;
var pause = false;
var canvas;
var width = window.innerWidth * 0.95;
var height = window.innerHeight * 0.95;
var animals = [];
let targetsCheckbox;
let pregnancyCheckbox;
let statsCanvas;
let stats = [];
let updateDataEveryFrames;
/////////////////////////
////control panel ///////
///////////////////////
var cellWidth = 22;
var USE_ANIMAL_LIMIT = true;
var MAX_ANIMALS_PER_CELL = 5;
var numberOfAnimals = 600;
var animalsLimit = 800;
var PERCENTAGE_OF_ROCK_FLOOR = 0.6;
var MAX_FOOD_OF_CELLS = 800;
var MAX_POSSIBLE_SIZE_FOR_ANIMALS = 25;
var CELLCLOCK_TO_REPRODUCE = 15;
var COEF_FERTILIZATION_OF_DEAD_ANIMALS = 0.005;
var COEF_HEALTH_DECREASE_BY_HUNGER = 0.01;
var COEF_HEALTH_DECREASE_BY_AGE = 2;
var MAX_LIFE_EXPECTANCY = 60;
var COEF_PERCENTAGE_OF_HUNGER_TO_BE_CONSIDERED_FULL = 0.2;
var COMPATIBILITY_TRESHOLD = 0.2;
var RENDER_TARGET_LINES = false;
var RENDER_PREGNANCY_BOOM = false;

var YEAR = 1;
var MIN_DISTANCE_FACTOR_TO_INTERACT = 2;
var FACTOR_HOW_MUCH_FOOD_ANIMALS_EAT_RELATIVE_TO_SIZE = 1;
var MAX_MUTATION_FACTOR = 0.05;
var RESOLUTION = 1;
var SAVE_LOG_OF_ANIMALS = true;
//////
const pausebutton = () => {
  console.log("pause");
  pause = !pause;

  if (!pause) gameLoop();
};
const showLifeLogOfAnimal0 = () => {
  console.table(JSON.parse(localStorage.animal0));
};
const togglePanel = () => {
  let panel = document.querySelector("control");
  if (panel.style.display == "none") panel.style.display = "block";
  else panel.style.display = "none";
};

function uniq(a) {
  var prims = { boolean: {}, number: {}, string: {} },
    objs = [];

  return a.filter(function (item) {
    var type = typeof item;
    if (type in prims)
      return prims[type].hasOwnProperty(item)
        ? false
        : (prims[type][item] = true);
    else return objs.indexOf(item) >= 0 ? false : objs.push(item);
  });
}

const getMaxVal = (val, isItAGene) => {
  let max = 0;
  for (let i = 0; i < animals.length; i++) {
    let a = animals[i];
    if (!isItAGene) {
      if (a[val] > max) max = a[val];
    } else if (a.genes[val] > max) max = a.genes[val];
  }
  return max;
};

const getAvgVal = (val, isItAGene) => {
  let sum = 0;
  let filteredAnimals = animals.filter((k) => !k.dead);
  for (let i = 0; i < filteredAnimals.length; i++) {
    let a = filteredAnimals[i];
    if (!isItAGene) sum += a[val];
    else sum += a.genes[val];
  }
  return Number((sum / filteredAnimals.length).toFixed(4));
};

const getMaxGeneration = () => {
  let max = 0;
  for (let a of animals) {
    if (a.generation > max) max = a.generation;
  }
  return max;
};

const getAvgAgeOfDeath = () => {
  let count = 0;
  let deads = animals.filter((k) => k.dead);
  for (let a of deads) {
    count += a.age;
  }
  return count / deads.length;
};

const getTotalNumberOfAnimalsInCells = () => {
  let t = 0;
  for (let i = 0; i < height / cellWidth; i++) {
    for (let j = 0; j < width / cellWidth; j++) {
      t += grid[i][j].animalsHere.filter((k) => !k.dead).length;
    }
  }
  return t;
};

const removeAnimalFromAllCells = (animal) => {
  for (let i = 0; i < height / cellWidth; i++) {
    for (let j = 0; j < width / cellWidth; j++) {
      grid[i][j].removeMe(animal);
    }
  }
};

const gameLoop = () => {
  if (!pause) {
    if (animals.length == 0) {
      alert("all animals died");
      return;
    }
    FRAMENUM++;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 0; i < height / cellWidth; i++) {
      for (let j = 0; j < width / cellWidth; j++) {
        grid[i][j].tick(FRAMENUM);
      }
    }

    for (animal of animals) animal.tick(FRAMENUM);

    if (renderCheckBox.checked) {
      if (document.querySelector("#renderCanvas").style.display != "block")
        document.querySelector("#renderCanvas").style.display = "block";

      for (let i = 0; i < height / cellWidth; i++) {
        for (let j = 0; j < width / cellWidth; j++) {
          grid[i][j].render(FRAMENUM);
        }
      }
      for (animal of animals) animal.render(FRAMENUM);
    } else {
      if (document.querySelector("#renderCanvas").style.display != "none")
        document.querySelector("#renderCanvas").style.display = "none";
    }

    if (targetsCheckbox) RENDER_TARGET_LINES = targetsCheckbox.checked;

    if (pregnancyCheckbox) RENDER_PREGNANCY_BOOM = pregnancyCheckbox.checked;

    window.durationOfFrame = Date.now() - (window.lastFrame || 0);
    window.lastFrame = Date.now();
    window.frameRate = 1000 / durationOfFrame;

    getStatsData();

    showDataInControlPanel();

    requestAnimationFrame(gameLoop);
  }
};
const generateID = () => {
  let vowels = "aeiou";
  let numbers = "0123456789";
  let name = Math.random().toString(36).substring(2, 9);
  let newName = "";
  for (let i = 0; i < name.length; i++) {
    try {
      let letter = name[i];
      let isItConsonant = vowels.indexOf(letter) == -1;
      let isPrevConsonant = vowels.indexOf(name[i - 1]) == -1;
      if (isItConsonant && isPrevConsonant)
        newName += vowels[Math.floor(Math.random() * vowels.length)];

      if (numbers.indexOf(letter) == -1) newName += letter;
    } catch (e) {}
  }
  newName = newName.substring(
    Math.floor(Math.random() * 4),
    Math.floor(Math.random() * 5 + 5)
  );
  if (newName.length < 4)
    newName += vowels[Math.floor(Math.random() * vowels.length)];

  return capitalize(newName);
};
function capitalize(word) {
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

const showDataInControlPanel = () => {
  let every = document.querySelector("#everyHowManyFrames").value;
  if (!every) return;

  if (
    FRAMENUM % every == 0 &&
    document.querySelector("control").style.display == "block"
  ) {
    let cont = document.querySelector("#contentOfControl");
    let content = "<p>ANIMALS:" + animals.length + "</p>";
    content += "<p>FPS: " + frameRate.toFixed(2) + "<p>";
    content += "<p>generation: " + getMaxGeneration() + "<p>";

    content += "<p>total food: " + getAllAvailableFood() + "<p>";
    content +=
      "<p>age/life expect" +
      (getAvgVal("age") / getAvgVal("lifeExpectancy", true)).toFixed(2) +
      "</p>";

    content +=
      "<p>hunger/hungerlimit : " +
      (getAvgVal("hunger") / getAvgVal("hungerLimit", true)).toFixed(2) +
      "</p>";
    cont.innerHTML = content;
    renderStatsData();
  }
};

const getStatsData = () => {
  if (animals.length == 0) return;
  updateDataEveryFrames =
    (document.querySelector("#everyHowManyFrames") || {}).value || 1;
  let an = animals[0];
  let ret = {};
  ret.numberOfAnimals = animals.length;
  if ("genes" in an) {
    let genes = Object.keys(an.genes);
    for (let gen of genes) {
      ret[gen] = getAvgVal(gen, true);
    }
  }

  stats.push(ret);
  if (stats.length > statsCanvas.width) stats.splice(0, 1);
};

const getLineColorForGenes = () => {
  let colors = {
    sightLimit: "#447755",
    diet: "#00ffaa",
    maxSpeed: "#aabb06",
    likability: "pink",
    likabilityTreshold: "#1111aa",
    lifeExpectancy: "yellow",
    healthRecoveryWhenEating: "violet",
    hungerLimit: "#7eef0a",
    hungerIncrease: "#9884aa",
    pregnancyDuration: "white",
    maxChildrenWhenPregnant: "#aa00ee",
    chancesToGetPregnant: "#07aa99",
    minAgeToGetPregnant: "#aa00e1",
    clockEvery: "#9a3388",
    maxSize: "#abcd51",
    maxHealth: "#BCBC01",
    partOfPregnancyThatEscapes: "#0684aa",
    r: "#ff0000",
    g: "#00ff00",
    b: "#0000ff",
  };

  return colors;
};

const renderStatsData = () => {
  if (stats.length < 2) return;

  let ct = statsCanvas.getContext("2d");
  let colors = getLineColorForGenes();
  let colorKeys = Object.keys(colors);
  let colorNamesContent = "";
  colorKeys.map((k) => {
    colorNamesContent +=
      "<p style='color:" +
      colors[k] +
      "'>" +
      k +
      " " +
      ((stats[stats.length - 1] || [])[k] || -1).toFixed(2) +
      "</p>";
  });

  document.querySelector("#colorNames").innerHTML = colorNamesContent;

  ct.fillStyle = "#000000";
  ct.save();
  ct.beginPath();
  ct.rect(0, 0, statsCanvas.width, statsCanvas.height);
  ct.fill();
  ct.closePath();

  for (let i = 1; i < stats.length; i++) {
    let st = stats[i];

    let prev_st = stats[i - 1];
    let genes = Object.keys(st);

    ct.lineWidth = 2;

    for (let g of genes) {
      ct.beginPath();
      let geneColor = colors[g];
      if (!geneColor) continue;
      ct.strokeStyle = geneColor;
      ct.moveTo(
        i,
        statsCanvas.height - (st[g] < 2 ? st[g] * statsCanvas.height : st[g])
      );
      ct.lineTo(
        i - 1,
        statsCanvas.height -
          (prev_st[g] < 2 ? prev_st[g] * statsCanvas.height : st[g])
      );

      ct.stroke();

      ct.closePath();
    }
  }
};

const distance = (a, b) => {
  let difx = b.x - a.x;
  let dify = b.y - a.y;
  let ret = Math.sqrt(difx * difx + dify * dify);
  //if (isNaN(ret)) debugger;
  return ret;
};
const getAnimalByID = (id) => {
  for (let a of animals) {
    if (a.id == id) return a;
  }
};

const getAvgMaxFood = () => {
  let total = 0;
  for (let i = 0; i < height / cellWidth; i++) {
    for (let j = 0; j < width / cellWidth; j++) {
      total += grid[i][j].maxFood;
    }
  }
  return Math.floor(total / (grid.length * grid[0].length));
};

const getAllAvailableFood = () => {
  let total = 0;
  for (let i = 0; i < height / cellWidth; i++) {
    for (let j = 0; j < width / cellWidth; j++) {
      total += grid[i][j].food;
    }
  }
  return Math.floor(total);
};

const createGrid = () => {
  for (let i = 0; i < height / cellWidth; i++) {
    grid[i] = [];
    for (let j = 0; j < width / cellWidth; j++) {
      grid[i][j] = new Cell(i, j, cellWidth, document.querySelector("#game"));
    }
  }
  return grid;
};

const createAnimals = (grid, howMany) => {
  for (let i = 0; i < howMany; i++) {
    animals.push(
      new Animal(
        cellWidth,
        grid,
        null,
        null,
        null,
        Math.floor(Math.random() * 100) //starting age
      )
    );
  }
};

const handleClickOnCanvas = (e) => {
  let cellX = Math.floor(e.x / cellWidth);
  let cellY = Math.floor(e.y / cellWidth);
  let cell = grid[cellY][cellX];
  window.cell = cell;
  console.log("#CELL", cell.food, "Animals", cell.animalsHere.length);
};

const init = () => {
  localStorage.clear();
  grid = createGrid();
  createAnimals(grid, numberOfAnimals);

  console.log("# grid", grid);
  console.log("# animals", animals);

  canvas = document.createElement("canvas");
  canvas.id = "renderCanvas";
  canvas.onclick = (e) => handleClickOnCanvas(e);
  document.body.appendChild(canvas);
  canvas.width = width * RESOLUTION;
  canvas.height = height * RESOLUTION;

  ctx = canvas.getContext("2d");
  renderCheckBox = document.querySelector("#render");
  targetsCheckbox = document.querySelector("#targetsCheckbox");
  renderStrokes = document.querySelector("#renderStrokes");

  statsCanvas = document.querySelector("#statsCanvas");
  gameLoop();
};

const getCenterCell = () => {
  let cellX = Math.floor(width / 2 / cellWidth);
  let cellY = Math.floor(height / 2 / cellWidth);
  let ret;
  try {
    ret = grid[cellY][cellX];
  } catch (e) {}

  return ret;
};
