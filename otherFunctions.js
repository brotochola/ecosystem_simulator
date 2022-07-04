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

const getMaxVal = (val, subObj) => {
  let max = 0;
  for (let i = 0; i < animals.length; i++) {
    let a = animals[i];
    if (!subObj) {
      if (a[val] > max) max = a[val];
    } else if (a[subObj][val] > max) max = a[subObj][val];
  }
  return max;
};

const getAvgVal = (val, subObj) => {
  let sum = 0;
  let filteredAnimals = animals.filter((k) => !k.dead);
  for (let i = 0; i < filteredAnimals.length; i++) {
    let a = filteredAnimals[i];
    if (!subObj) sum += a[val];
    else sum += a[subObj][val];
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

const getRandomColor = () => Math.floor(Math.random() * 16777215).toString(16);

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

const getAnimalAtPosition = (x, y, cell) => {
  let temp = [];
  if (USE_QUADTREE) {
    temp = tree.retrieve({
      x: x - cellWidth / 2,
      y: y - cellWidth / 2,
      width: cellWidth,
      height: cellWidth,
    });
    temp = temp.map((k) => k.animal);
  } else {
    temp = cell.animalsHere;
  }

  let sortedAnimals = temp.sort((a, b) => {
    if (distance(a.getPos(), { x, y }) > distance(b.getPos(), { x, y })) {
      return 1;
    } else {
      return -1;
    }
  });

  /////////// THIS DRAWS THE SELECTION BOX, WHEN YOU CLICK
  // ctx.beginPath();
  // ctx.moveTo(x - cellWidth / 2, y - cellWidth / 2);
  // ctx.lineWidth = 2;
  // ctx.strokeStyle = "#ff00ff";
  // ctx.rect(x - cellWidth / 2, y - cellWidth / 2, cellWidth, cellWidth);
  // ctx.stroke();
  // ctx.closePath();
  //////////////
  console.log(temp);
  return sortedAnimals[0];
};

const handleMouseMoveOnCanvas = (e) => {
  window.mouseX = e.x;
  window.mouseY = e.y;
};

const sortAnimalsByDistanceTo = (animalsArr, obj) => {
  let sortedAnimals = animals.sort((a, b) => {
    let distA = calcDistanceFaster(a, obj);
    let distB = calcDistanceFaster(b, obj);

    if (distA > distB) {
      return 1;
    } else {
      return -1;
    }
  });

  return sortedAnimals;
};

const addAnimalAtPosition = (age, genes) => {
  animals.push(
    new Animal(
      cellWidth,
      grid,
      genes ? genes : null,
      window.mouseX,
      window.mouseY,
      age //starting age
    )
  );
};

const getPredatorGenes = () => {
  return JSON.parse(
    '{"sightLimit":4.964255007009292,"fear":0.7035665277371901,"agility":1.6961887138240577,"maxAcceleration":1.0292728463064431,"likability":0.9702793718031613,"likabilityTreshold":0.3615422169081898,"lifeExpectancy":489.45864578230965,"healthRecoveryWhenEating":0.3544978373180971,"pregnancyDuration":5.808918737404682,"maxChildrenWhenPregnant":5.008062038710774,"chancesToGetPregnant":0.708951569744307,"minAgeToGetPregnant":12.65913635586488,"clockEvery":9.731181896590392,"maxHealth":101.51880149150294,"partOfPregnancyThatEscapes":0.13457914207387514,"r":0.9271444200574264,"g":0.1793406145526005,"b":0.08944965697432442}'
  );
};

const addShortCuts = () => {
  window.onkeydown = (e) => {
    let key = e.key.toLowerCase();

    if (key == "p" || key == " ") pausebutton();
    else if (key == "q") SHOW_QUADTREE = !SHOW_QUADTREE;
    else if (key == "s") renderStrokes.checked = !renderStrokes.checked;
    else if (key == "r") renderCheckBox.checked = !renderCheckBox.checked;
    else if (key == "t") targetsCheckbox.checked = !targetsCheckbox.checked;
    else if (key == "a") addAnimalAtPosition(0);
    else if (key == "d") addAnimalAtPosition(9999);
    else if (key == "w")
      addAnimalAtPosition(MAX_LIFE_EXPECTANCY * 0.3, getPredatorGenes());
  };
};

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
      (getAvgVal("age") / getAvgVal("lifeExpectancy", "genes")).toFixed(2) +
      "</p>";

    content +=
      "<p>hunger/hungerlimit : " +
      (getAvgVal("hunger") / getAvgVal("hungerLimit", "genes")).toFixed(2) +
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
      ret[gen] = getAvgVal(gen, "genes");
    }
  }

  stats.push(ret);
  if (stats.length > statsCanvas.width) stats.splice(0, 1);
};

const getLineColorForGenes = () => {
  let colors = {
    sightLimit: "#447755",
    diet: "#00ffaa",
    agility: "#aabb06",
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

const calcDistanceFaster = (a, b) => {
  if (a.cellX == undefined || b.cellX == undefined) {
    return 9999;
  }
  let distNonDiagonal =
    Math.abs(a.cellX - b.cellX) + Math.abs(a.cellY - b.cellY);
  //0.8 I USE INSTEAD OF SQRT OR SINE OR ANYTHING, I WANT THIS FUNCTION TO BE KEPT SIMPLE
  return distNonDiagonal * (cellWidth * 0.8);
};

const distance = (a, b) => {
  let difx = b.x - a.x;
  let dify = b.y - a.y;
  let ret = Math.sqrt(difx * difx + dify * dify);
  return ret;
};

const setCellWidth = (w) => {
  let temp = w;
  for (let i = 0; i < 10; i++) {
    if (temp > MAX_CELL_SIZE) temp *= 0.5;
    else return Math.round(temp);
  }
  return Math.round(temp);
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

const getCenterCell = () => {
  let cellX = Math.floor(width / 2 / cellWidth);
  let cellY = Math.floor(height / 2 / cellWidth);
  let ret;
  try {
    ret = grid[cellY][cellX];
  } catch (e) {}

  return ret;
};
