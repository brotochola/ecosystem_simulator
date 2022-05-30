var FRAMENUM = 0;
var renderCheckBox;
var grid = [];
var ctx;
var pause = false;
var canvas;
var width = window.innerWidth * 0.95;
var height = window.innerHeight * 0.95;
var animals = [];
/////////////////////////
////control panel ///////
///////////////////////
var cellWidth = 30;
var USE_ANIMAL_LIMIT = true;
var MAX_ANIMALS_PER_CELL = 5;
var numberOfAnimals = 20;
var animalsLimit = 1000;
var PERCENTAGE_OF_ROCK_FLOOR = 0.8;
var MAX_FOOD_OF_CELLS = 400;
var CELLCLOCK_TO_REPRODUCE = 200;
var YEAR = 1;
var MIN_DISTANCE_FACTOR_TO_INTERACT = 2;
var RESOLUTION = 1;
var SAVE_LOG_OF_ANIMALS = true;
//////
const pausebutton = () => {
  console.log("pause");
  pause = !pause;
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
  for (let i = 0; i < animals.length; i++) {
    let a = animals[i];
    if (!isItAGene) sum += a[val];
    else sum += a.genes[val];
  }
  return sum / animals.length;
};

const getMaxGeneration = () => {
  let max = 0;
  for (let a of animals) {
    if (a.generation > max) max = a.generation;
  }
  return max;
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
    FRAMENUM++;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 0; i < height / cellWidth; i++) {
      for (let j = 0; j < width / cellWidth; j++) {
        grid[i][j].tick(FRAMENUM);
      }
    }

    for (animal of animals) animal.tick(FRAMENUM);

    if (renderCheckBox.checked) {
      if (document.querySelector("canvas").style.display != "block")
        document.querySelector("canvas").style.display = "block";

      for (let i = 0; i < height / cellWidth; i++) {
        for (let j = 0; j < width / cellWidth; j++) {
          grid[i][j].render(FRAMENUM);
        }
      }
      for (animal of animals) animal.render(FRAMENUM);
    } else {
      if (document.querySelector("canvas").style.display != "none")
        document.querySelector("canvas").style.display = "none";
    }
  }

  window.durationOfFrame = Date.now() - (window.lastFrame || 0);
  window.lastFrame = Date.now();
  window.frameRate = 1000 / durationOfFrame;
  showDataInControlPanel();

  requestAnimationFrame(gameLoop);
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
    content += "<p>FPS: " + frameRate + "<p>";
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

const createAnimals = (grid) => {
  for (let i = 0; i < numberOfAnimals; i++) {
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
  createAnimals(grid);

  console.log("# grid", grid);
  console.log("# animals", animals);

  canvas = document.createElement("canvas");
  canvas.onclick = (e) => handleClickOnCanvas(e);
  document.body.appendChild(canvas);
  canvas.width = width * RESOLUTION;
  canvas.height = height * RESOLUTION;

  ctx = canvas.getContext("2d");
  renderCheckBox = document.querySelector("#render");
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
