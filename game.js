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
var numberOfAnimals = 700;
var animalsLimit = 800;
var PERCENTAGE_OF_ROCK_FLOOR = 0.5;
var MAX_FOOD_OF_CELLS = 800;
var MAX_POSSIBLE_SIZE_FOR_ANIMALS = 25;
var CELLCLOCK_TO_REPRODUCE = 20;
var COEF_FERTILIZATION_OF_DEAD_ANIMALS = 0.005;
var COEF_HEALTH_DECREASE_BY_HUNGER = 0.01;
var COEF_HEALTH_DECREASE_BY_AGE = 2;
var MAX_LIFE_EXPECTANCY = 100;
var COEF_PERCENTAGE_OF_HUNGER_TO_BE_CONSIDERED_FULL = 0.2;
var COMPATIBILITY_TRESHOLD = 0.2;
var RENDER_TARGET_LINES = false;
var RENDER_PREGNANCY_BOOM = false;
var COEF_OF_MAX_FOOD_TO_REPRODUCE = 0.9;
var SEASON_YEAR_DURATION = 365;
var MIN_ANIMAL_SIZE = 5;
var COEF_OF_SIZE_THAT_DEFINES_SPEED = 0.1;
var COEF_OF_SIZE_THAT_DEFINES_HUNGER_INCREASE = 0.3;
var FACTOR_HOW_MUCH_FOOD_ANIMALS_EAT_RELATIVE_TO_SIZE = 1;

var YEAR = 1;
var MIN_DISTANCE_FACTOR_TO_INTERACT = 2;
var MAX_MUTATION_FACTOR = 0.05;
var RESOLUTION = 1;
var SAVE_LOG_OF_ANIMALS = true;
//////
const pausebutton = () => {
  console.log("pause");
  pause = !pause;

  if (!pause) gameLoop();
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
    // if (animals.length == 0) {
    //   alert("all animals died");
    //   return;
    // }
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
