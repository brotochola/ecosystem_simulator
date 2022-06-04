class Animal {
  getColorFromGenes() {
    if (this.pregnant) {
      return "#ffffff";
    }
    if (this.dead) return "rgb(0,0,0," + (100 - this.decomposition) / 100 + ")";
    return (
      "rgb(" + this.genes.r + "," + this.genes.g + "," + this.genes.b + ")"
    );
  }

  constructor(
    cellWidth,
    grid,
    genes,
    x,
    y,
    startingAge,
    generation,
    parentsHunger,
    lastName
  ) {
    this.log = [];
    this.cellWidth = cellWidth;
    this.grid = grid;
    this.id = generateID();
    this.lastName = lastName || generateID();
    this.type = "animal";
    this.generation = generation ? generation : 0;

    //CONSTANTS:
    this.possibleStates = [
      "idle", //0
      "hungry", //1
      "escaping", //2
      "goingToGroup", //3
      "horny", //4
      "givingBirth", //5
      "eating", ///6
      "dead", //7
      "escapingFromFuckBuddy", //8
    ];

    //CONSCIOUSNESS
    this.state = 0; //Math.floor(Math.random() * this.possibleStates.length);
    this.target = null; //this.pickARandomCell();
    this.loneliness = 0; //if very lonely will try to look for someone to fuck, given compatibility and likabilty of the other animal
    this.cellsClose = [];
    //GENES
    this.genes = genes || {
      sightLimit: 8,
      fear: Math.random(),
      diet: Math.random(), //0 is carnivore, 1herbi, 0.5 omni
      maxSpeed: 1 * Math.random() + 1,
      maxAcceleration: 1,
      compatibilityTreshhold: 100, //if 1 they can breed with anyone
      likability: Math.random(),
      likabilityTreshold: Math.random() * 0.5,
      lifeExpectancy: 50 * YEAR,
      healthRecoveryWhenEating: Math.random() * 0.5,
      hungerLimit: 10,
      hungerIncrease: 0.012,
      pregnancyDuration: 6 * YEAR,
      maxChildrenWhenPregnant: Math.floor(Math.random() * 6) + 1,
      chancesToGetPregnant: Math.random(),
      minAgeToGetPregnant: 12 * YEAR,
      clockEvery: 10,

      maxSize: RESOLUTION * (Math.random() * 20 + 5),
      maxHealth: 100,
      partOfPregnancyThatEscapes: Math.random() * 0.2,
      r: Math.floor(Math.random() * 255),
      g: Math.floor(Math.random() * 255),
      b: Math.floor(Math.random() * 255),
    };

    this.myTypeOfFood = this.getMyTypeOfFood();
    if (this.genes.clockEvery < 1) this.genes.clockEvery = 1;
    if (this.genes.sightLimit < 1) this.genes.sightLimit = 1;
    if (this.maxSize > 30) this.maxSize = MAX_POSSIBLE_SIZE_FOR_ANIMALS;
    if (this.hungerIncrease < 0.001) this.hungerIncrease = 0.001;
    if (this.genes.lifeExpectancy > MAX_LIFE_EXPECTANCY)
      this.genes.lifeExpectancy = MAX_LIFE_EXPECTANCY;

    this.defineSize();
    //STARTING VALUES
    this.pregnant = false;
    this.prevPregnancyValue = false;
    this.whenDidIGetPregnant = null;

    this.hunger = this.getStartingHunger(parentsHunger);
    if (this.hunger < 0) this.hunger = 0;

    this.startingHunger = Number(this.hunger);

    this.ImAtCell = null;
    this.dead = false;
    this.pos = new p5.Vector(
      x || width * RESOLUTION * Math.random(),
      y || height * RESOLUTION * Math.random()
    );

    this.decomposition = 0;
    this.age = startingAge || 0;
    this.health = this.genes.maxHealth;
    this.vel = new p5.Vector(Math.random() * 10 - 5, Math.random() * 10 - 5); //this is a vector, from 0 to 1 both values
    this.acc = new p5.Vector(0, 0);
    this.vel.limit(this.genes.maxSpeed);

    //console.log("## new animal is born", this.id);
  }

  getStartingHunger(parentsHunger) {
    return (parentsHunger || 0) + this.genes.hungerLimit * Math.random();
  }

  getPos() {
    return this.pos.copy();
  }

  checkIfTheTargetIsTooFar() {
    if (!this.target || !this.target.getPos || !this.getPos) return;
    if (
      distance(this.target.getPos(), this.getPos()) >
      this.cellWidth * this.genes.sightLimit
    ) {
      this.goIdle();
    }
  }

  calculateVelVectorAccordingToTarget() {
    if (!("x" in this.vel)) return;

    if (this.target) {
      if ("getPos" in this.target && this.target.getPos instanceof Function) {
        let targetsPos = this.target.getPos();

        if (this.state != 8) {
          this.vel = p5.Vector.sub(targetsPos, this.getPos());
        } else {
          //STATE 8 MEANS ESCAPING FROM TARGET
          this.vel = p5.Vector.sub(this.getPos(), targetsPos);
        }
      }
    } else {
      this.vel.add(
        new p5.Vector(Math.random() * 2 - 1, Math.random() * 2 - 1).setMag(
          (Math.random() * this.genes.maxSpeed) / 2
        )
      );
    }

    //  this.vel.limit(this.genes.maxSpeed);
    // debugger;

    //  console.log(this.vel);
  }

  die() {
    // console.log(
    //   "#",
    //   this.id,
    //   " died",
    //   this.age + " / " + Math.floor(this.genes.lifeExpectancy),
    //   "hunger:",
    //   Math.floor(this.hunger) + "/" + Math.floor(this.genes.hungerLimit)
    // );
    this.pregnant = false;
    this.target = null;
    this.dead = true;
    // removeAnimalFromAllCells(this);
    this.state = 7; //dead
    this.vel = new p5.Vector(0, 0);

    //animals.splice(i, 1);

    //this.elem.remove();
  }

  checkDeath() {
    if (this.dead) {
      this.vel.x = 0;
      this.vel.y = 0;
      this.decomposition += Math.random() * 10;
      //this.decomposition *= 1.1;
      if (this.decomposition > 100) {
        let i = this.getMyI();
        animals.splice(i, 1);
        removeAnimalFromAllCells(this);
      }
      return true;
    } else {
      if (this.health < 0) {
        this.die();
        return true;
      }
      if (this.age > this.genes.lifeExpectancy) {
        this.health -=
          (this.age - this.genes.lifeExpectancy) * COEF_HEALTH_DECREASE_BY_AGE;
      }

      //if hungry, it hurts

      if (this.hunger >= this.genes.hungerLimit) {
        let factor =
          (this.hunger - this.genes.hungerLimit) *
          COEF_HEALTH_DECREASE_BY_HUNGER;
        //WHEN YOU'RE HUNGRY YOU PASS IT TO YOUR KIDS
        this.genes.lifeExpectancy -= factor;
        this.health -= factor;
      }
      return false;
    }
  }

  getCloseCells(howMany) {
    if (this.closeCells.length > 0) return this.closeCells;
    if (!howMany) howMany = Math.floor(this.genes.sightLimit) / 2;
    let cell = this.getCell();
    if (!cell) return [];
    let cells = [cell];

    let x = cell.x;
    let y = cell.y;
    let fromY = y - howMany;
    let toY = y + howMany;
    let fromX = x - howMany;
    let toX = x + howMany;
    for (let i = fromY; i <= toY; i++) {
      for (let j = fromX; j <= toX; j++) {
        if (grid[i] && grid[i][j]) cells.push(grid[i][j]);
      }
    }

    // THE SORT FUNCTION PUTS THE NEIGHTBOORS CELLS FIRST:

    cells = cells.sort((a, b) => {
      let distA = Math.abs(cell.x - a.x) + Math.abs(cell.y - a.y);
      let distB = Math.abs(cell.x - b.x) + Math.abs(cell.y - b.y);
      if (distA > distB) return 1;
      else return -1;
    });

    return cells;
  }

  getMyTypeOfFood() {
    //SEE cell.type
    let what = this.genes.b > this.genes.r;
    if (what) return 0;
    else return 2;
  }

  lookForAFood() {
    let mycell = this.getCell();
    if (!mycell) return;
    this.closeCells = this.getCloseCells();
    //CHECK HOW MANY ANIMALS ARE THERE RIGHT NOW
    let filteredCells = this.closeCells.filter(
      (k) => k.animalsHere.length < MAX_ANIMALS_PER_CELL
    );

    for (let cell of filteredCells) {
      if ("food" in cell) {
        if (cell.food > 0) {
          if (this.myTypeOfFood == cell.type) {
            this.target = cell;
            return cell;
          }
        }
      }
    }
  }

  amIHungry() {
    return this.hunger > this.genes.hungerLimit / 2;
  }

  checkIfImGivingBirth() {
    if (
      this.pregnant &&
      this.FRAMENUM - this.whenDidIGetPregnant > this.genes.pregnancyDuration
    ) {
      this.giveBirth();
      this.pregnant = false;
      this.whenDidIGetPregnant = false;
    }
  }

  giveBirth() {
    if (
      USE_ANIMAL_LIMIT &&
      animals.filter((k) => !k.dead).length > animalsLimit
    )
      return;

    let numKids =
      Math.floor(this.genes.maxChildrenWhenPregnant * Math.random()) + 1;
    //console.log(this.id + " " + this.lastName, "got ", numKids, " kids");
    for (let i = 0; i < numKids; i++) {
      let newAnimal = new Animal(
        this.cellWidth,
        this.grid,
        this.crossMyGenesWith(this.pregnant),
        this.pos.x,
        this.pos.y,
        0,
        this.generation + 1,
        this.hunger,
        this.lastName
      );
      animals.push(newAnimal);
    }
  }

  crossMyGenesWith(externalGenes) {
    let result = {};
    let keys = Object.keys(this.genes);
    for (let k of keys) {
      let mygen = this.genes[k];
      let theirgen = externalGenes[k];
      let mutationCoef =
        Math.random() * MAX_MUTATION_FACTOR - MAX_MUTATION_FACTOR * 0.5 + 1;
      if (Math.random() > 0.5) result[k] = mygen * mutationCoef;
      else result[k] = theirgen * mutationCoef;
    }

    return result;
  }

  flockBehaviour() {
    if (this.age < 3) return;
    //ARREGLAR
    this.acc = new p5.Vector(0, 0);
    // this.acc.add(this.align());
    //  this.acc.add(this.cohesion());
    this.acc.add(this.separation());
  }

  align() {
    let avg = new p5.Vector();

    let closeanimals = this.getCloseAnimals() || [];

    let divideByHowMany = 0;
    for (let anim of closeanimals) {
      if (this.areWeTheSameSpecies(anim)) {
        avg.add(anim.vel);
        divideByHowMany++;
      }
    }
    if (divideByHowMany > 0) {
      avg.div(divideByHowMany);
      avg.sub(this.vel);
      avg.limit(this.genes.maxAcceleration);
      return avg;
    }
    return new p5.Vector(0, 0);
  }

  cohesion() {
    let avg = new p5.Vector();
    let closeanimals = this.getCloseAnimals() || [];

    let divideByHowMany = 0;
    for (let anim of closeanimals) {
      if (this.areWeTheSameSpecies(anim)) {
        avg.add(anim.pos);
        divideByHowMany++;
      }
    }
    if (divideByHowMany > 0) {
      avg.div(divideByHowMany);
      avg.sub(this.pos);
      avg.limit(this.genes.maxAcceleration);

      //this.vel = avg;
      return avg;
    }
    return new p5.Vector(0, 0);
  }

  separation() {
    let avg = new p5.Vector();
    let closeanimals = this.getCloseAnimals() || [];

    let divideByHowMany = 0;
    for (let anim of closeanimals) {
      if (this.areWeTheSameSpecies(anim)) {
        let diff = p5.Vector.sub(this.pos, anim.pos);
        let dist = distance(this.pos, anim.pos);

        diff.div(dist);
        avg.add(diff);
        divideByHowMany++;
      }
    }
    if (divideByHowMany > 0) {
      avg.div(divideByHowMany);
      //  avg.sub(this.vel);
      avg.limit(this.genes.maxAcceleration);

      return avg;
    }
    return new p5.Vector(0, 0);
  }

  accordingToStuffChangeState() {
    if (this.amIHungry()) {
      //STATE 6 IS EATING
      if (this.state != 6 && this.state != 8) this.state = 1;
    } else if (
      this.amIOldEnoughToFuck() &&
      this.amIHealthy() &&
      !this.pregnant &&
      this.state == 0
    ) {
      this.state = 4;
    } else {
    }
  }

  goIdle() {
    this.state = 0;
    this.target = null;
  }

  accordingToStateSetTarget() {
    if (this.pregnant) this.checkIfImGivingBirth();

    if (this.state == 4) {
      if (this.pregnant) {
        return this.goIdle();
      }
      let closest = this.getClosestFuckBuddy();
      if (closest) this.target = closest;
      if (this.target) this.checkIfFuckBuddyIsClose();
    } else if (this.state == 1) {
      //IF IT'S HUNGRY
      //AND CAN'T EAT FROM THIS CELL
      if (
        this.hunger <
        COEF_PERCENTAGE_OF_HUNGER_TO_BE_CONSIDERED_FULL * this.genes.hungerLimit
      )
        this.goIdle();
      if (!this.eatFromCell()) {
        if (this.amIHungry()) this.lookForAFood(); //WILL LOOK FOR FOOD
      } else {
        //IF IT COULD FIND FOOD IN THIS CELL CHANGES THE STATE
        this.state = 6;
      }
    } else if (this.state == 6) {
      //eating

      if (this.eatFromCell()) this.vel = new p5.Vector(0, 0);
      else {
        //IF THERE'S NO MORE FOOD IN THIS CELL, BEFORE IT GOES TO STATE 1 (HUNGRY)
        //IT WILL CHECK IF IT'S STILL HUNGRY (>50%)
        if (this.amIHungry()) this.state = 1;
        else this.goIdle();
      }
      //WILL EAT UNTIL HE'S OK
      if (
        this.hunger <=
        COEF_PERCENTAGE_OF_HUNGER_TO_BE_CONSIDERED_FULL * this.genes.hungerLimit
      ) {
        this.goIdle();
      }
    } else if (this.state == 8) {
      //THE FIRST QUARTER OF THE PREGNANCY IT WILL ESCAPE FROM THE LOVER
      if (
        this.FRAMENUM - this.whenDidIGetPregnant >
        this.genes.pregnancyDuration * this.genes.partOfPregnancyThatEscapes
      ) {
        this.goIdle();
      }
    } else if (this.state == 0) {
      //IDLE
      // if (!this.target) this.lookForFriends();
    }
  }

  lookForFriends() {
    this.closeCells = this.getCloseCells();
    for (let cell of this.closeCells) {
      if (cell == this.getCell()) continue;
      for (let anim of cell.animalsHere) {
        if (this.areWeTheSameSpecies(anim)) {
          this.target = anim;
          return;
        }
      }
    }
  }

  // checkIfTargetIsTooRequested() {
  //   //REMOVE CELLS WHERE TOO MANY ANIMALS ARE AIMING TO:
  //   this.closeAnimals = this.getCloseAnimals();

  //   let targets = this.closeAnimals.map((a) => a.target).filter((k) => k);
  //   this.numberOfCloseAnimalsWithMySameTarget = targets.filter(
  //     (k) => k == this.target
  //   ).length;

  //   if (this.numberOfCloseAnimalsWithMySameTarget > MAX_ANIMALS_PER_CELL) {
  //     this.goIdle();
  //   }
  // }
  sumHunger() {
    //THE HUNGER ADDS REALTIVE TO THE SIZE AND MOVEMENT
    let howMuch =
      this.genes.hungerIncrease *
      this.size *
      (Math.abs(this.vel.x) + Math.abs(this.vel.y));
    if (!isNaN(howMuch)) this.hunger += howMuch;
  }
  tick(FRAMENUM) {
    this.FRAMENUM = FRAMENUM;
    this.prevPregnancyValue = this.pregnant;
    this.numberOfCloseAnimalsWithMySameTarget = null;
    this.closeCells = [];

    //age, in days/frames
    if (!this.dead) this.age++;

    // let increase =
    //   this.genes.hungerIncrease * (this.genes.lifeExpectancy / this.age);
    // if (increase > 1) increase = 1;
    if (this.checkDeath()) return;

    this.setLimits();

    //this.flockBehaviour();

    let clockEvery = Math.floor(this.genes.clockEvery);
    clockEvery = clockEvery < 3 ? 3 : clockEvery;

    this.accordingToStuffChangeState();
    this.accordingToStateSetTarget();
    this.calculateVelVectorAccordingToTarget();

    // if (this.FRAMENUM % clockEvery == 0) {
    this.checkIfTheTargetIsTooFar();
    //   this.checkIfTargetIsTooRequested();
    //}

    //limit the speed
    //this.acc.limit(this.genes.maxAcceleration);
    this.vel.add(this.acc);
    this.makeThemShake();
    this.vel.limit(this.genes.maxSpeed);

    this.pos.add(this.vel);

    this.sumHunger();

    if (this.ImAtCell != this.getCell()) {
      if (this.ImAtCell) this.ImAtCell.removeMe(this);
      this.ImAtCell = this.getCell();
      if (this.ImAtCell) this.ImAtCell.addMe(this);
    }

    this.howManyAnimalsInSameCell = (
      (this.ImAtCell || {}).animalsHere || []
    ).length;

    this.checkIfItsTooCrowdedHere();

    //if (this.ImAtCell) this.ImAtCell.type = 0; //THIS LINE MAKES THE ANIMAL DRAW GRASS
    ///update it's data:
    this.cellX = Math.floor(this.pos.x / this.cellWidth);
    this.cellY = Math.floor(this.pos.y / this.cellWidth);
    this.defineSize();
    //this.showDebug()
  }

  checkIfItsTooCrowdedHere() {
    //MAKE IT HUNGRY
    //LIKE.. I GET OUTTA HERE, I'M GONN' EAT SOMETHIN'
    if (this.howManyAnimalsInSameCell > MAX_ANIMALS_PER_CELL) {
      this.state = 1;
      this.lookForAFood();
    }
  }

  makeThemShake() {
    if (this.dead) return;
    if (this.vel.x == 0 && this.vel.y == 0) {
      this.vel = new p5.Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
    }
  }
  showDebug() {
    if (this.vel.x == 0 && this.vel.y == 0) {
      console.log(
        "#",
        "st",
        this.state,
        "h",
        this.hunger / this.genes.hungerLimit,
        "age",
        this.age / this.genes.lifeExpectancy
      );
    }
  }

  saveLog() {
    //  if (this.getMyI() == 0) {
    // if (!window.animal0) window.animal0 = {};

    let me = {
      id: this.id,
      hu: (this.hunger / this.genes.hungerLimit).toFixed(2),
      st: this.state,
      hea: (this.health / this.genes.maxHealth).toFixed(2),
      tgt: (this.target || {}).id ? this.target.id : (this.target || {}).type,
      preg: !!this.pregnant ? 1 : 0,
      age: (this.age / this.genes.lifeExpectancy).toFixed(2),
      velX: this.vel.x,
      velY: this.vel.y,
    };

    if (this.target) {
      try {
        me.distance2Target = distance(this.pos, this.target.pos).toFixed(2);
      } catch (e) {
        //console.warn(e);
      }
    }

    this.log[this.FRAMENUM] = me;
    //  window.animal0 = obj;
    // }
  }

  defineSize() {
    //it's size
    this.size = (this.age / this.genes.lifeExpectancy) * this.genes.maxSize;

    if (this.size > this.genes.maxSize) this.size = this.genes.maxSize;
    if (this.size < 3) this.size = 3;
  }

  getMyI() {
    for (let i = 0; i < animals.length; i++) {
      let anim = animals[i];
      if (anim.id == this.id) {
        return i;
      }
    }
  }

  drawPregnancyHappening() {
    ctx.moveTo(this.pos.x, this.pos.y);

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);

    ctx.fillStyle = "#FFffff77";

    ctx.fill();
    ctx.closePath();
  }

  checkIfFuckBuddyIsClose() {
    if (!(this.target instanceof Animal)) return;
    if (this.target && this.target.pos) {
      let dist = distance(this.pos, this.target.pos);
      if (dist) {
        if (
          dist < this.size * MIN_DISTANCE_FACTOR_TO_INTERACT &&
          this.amIOldEnoughToFuck()
        ) {
          if (Math.random() < this.genes.chancesToGetPregnant) {
            this.getPregnant();
            return true;
          }

          // this.separation();
        }
      }
    }
    return false;
  }

  getPregnant() {
    //console.log(this.id + " " + this.lastName, "got p");
    this.pregnant = JSON.parse(JSON.stringify(this.target.genes));
    //THE TARGET IS THE ONE YOU'RE ESCAPING FROM AFTER YOU GOT PREGNANT!
    this.whenDidIGetPregnant = this.FRAMENUM;
    this.state = 8;
  }
  eatFromCell() {
    let mycell = this.getCell();
    if (!mycell) return;
    if (mycell.food > 0 && mycell.type == this.myTypeOfFood) {
      mycell.food -=
        this.size * FACTOR_HOW_MUCH_FOOD_ANIMALS_EAT_RELATIVE_TO_SIZE;
      this.hunger--;
      this.health += this.genes.healthRecoveryWhenEating;
      //this.health++;

      return true;
    }
    return false;
  }

  pickARandomCell() {
    let g = this.grid[Math.floor(this.grid.length * Math.random())];
    return g[Math.floor(Math.random() * g.length)];
  }

  //   goTo(entity) {
  //     let difX = entity.x - this.pos.x;
  //     let difY = entity.y - this.pos.y;

  //     let hypotenuse = Math.sqrt(difX * difX, difY * difY);

  //     let sin = difX / hypotenuse;

  //     (Math.asin(sinOfAngleX) * 180) / Math.PI;
  //   }

  setLimits() {
    if (this.pos.x > width * RESOLUTION) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width * RESOLUTION;
    if (this.pos.y > height * RESOLUTION) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height * RESOLUTION;
  }

  getCloseAnimals() {
    let animalsToRet = [];
    this.closeCells = this.getCloseCells();

    for (let c of this.closeCells) {
      for (let a of c.animalsHere) {
        if (a.id != this.id) animalsToRet.push(a);
      }
    }

    return uniq(animalsToRet);
  }

  getClosestFuckBuddy() {
    let aas = this.getCloseAnimals();
    let filteredCloseAnimals = aas.filter((k) =>
      this.amICompatibleToBreedWith(k)
    );

    return filteredCloseAnimals[0];
  }

  areWeTheSameSpecies(animal) {
    //if (true) return true;
    if (!animal) return false;
    let areThemCompatToMe =
      Math.abs(animal.genes.r - this.genes.r) <
        this.genes.compatibilityTreshhold &&
      Math.abs(animal.genes.g - this.genes.g) <
        this.genes.compatibilityTreshhold &&
      Math.abs(animal.genes.b - this.genes.b) <
        this.genes.compatibilityTreshhold;

    let amICompatTothem =
      Math.abs(animal.genes.r - this.genes.r) <
        animal.genes.compatibilityTreshhold &&
      Math.abs(animal.genes.g - this.genes.g) <
        animal.genes.compatibilityTreshhold &&
      Math.abs(animal.genes.b - this.genes.b) <
        animal.genes.compatibilityTreshhold;

    return areThemCompatToMe && amICompatTothem;
  }

  amIHealthy() {
    return this.health > this.genes.maxHealth / 2 && !this.amIHungry();
  }

  amIOldEnoughToFuck = () => {
    return animal.age > animal.genes.minAgeToGetPregnant;
  };

  amICompatibleToBreedWith(animal) {
    if (animal.dead) return false;

    let areWeSimilar = this.areWeTheSameSpecies(animal);

    let legalAge = this.amIOldEnoughToFuck() && animal.amIOldEnoughToFuck();

    let doILikeThem =
      animal.genes.likability > this.genes.likabilityTreshold &&
      !animal.pregnant &&
      legalAge;

    return (
      areWeSimilar && doILikeThem && this.amIHealthy() && animal.amIHealthy()
    );
  }

  makeMeGoBack() {
    let difX = this.pos.x - width / 2;
    let difY = this.pos.y - height / 2;
    if (difX < difY) {
      this.vel.x = 1;
      this.vel.y = difY / difX;
    } else {
      this.vel.y = 1;
      this.vel.y = difX / difY;
    }
  }

  render() {
    ctx.save();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.fillStyle = this.getColorFromGenes();
    // ctx.rotate(0.01);

    //ctx.rotate(((this.vel.angleBetween / 57.2958) * Math.PI) / 180);

    // ctx.fillRect(
    //   this.pos.x - this.size / 2,
    //   this.pos.y - this.size / 2,
    //   this.size,
    //   this.size
    // );

    let healthRatio = this.health / this.genes.maxHealth;
    let hungerRatio = 1 - this.hunger / this.genes.hungerLimit;
    let ageRatio = 1 - this.age / this.genes.lifeExpectancy;
    if (ageRatio > 1) ageRatio = 1;
    if (ageRatio < 0) ageRatio = 0;

    ctx.beginPath();
    ctx.lineWidth = 3;
    this.strokeColor = this.getStrokeColor();

    ctx.arc(this.pos.x, this.pos.y, this.size / 2, 0, 2 * Math.PI);

    if (this.strokeColor && !this.dead) {
      ctx.strokeStyle = this.strokeColor;
      ctx.stroke();
    }

    ctx.fill();
    ctx.closePath();

    //DIRECTION LINE

    if (!this.dead) {
      this.drawDirectionLine();

      //TARGET LINE
      if (this.target) {
        if (RENDER_TARGET_LINES) this.drawTargetLine();
      }

      if (this.pregnant && !this.prevPregnancyValue)
        if (RENDER_PREGNANCY_BOOM) this.drawPregnancyHappening();
    }

    ctx.restore();

    if (SAVE_LOG_OF_ANIMALS) this.saveLog();
  }

  getStrokeColor() {
    let c =
      this.state == 6
        ? "yellow" // eating
        : this.state == 8
        ? "white" //escaping from fuck buddy
        : this.state == 0
        ? "#2222ff" //idle blue
        : this.state == 1
        ? this.myTypeOfFood == 0
          ? "#00ff00" //hungry green
          : "#faff64" //yellow
        : this.state == 4
        ? "#ff0000" //horny red
        : this.dead
        ? "#000000" //dead black
        : null;

    return c;
  }

  drawDirectionLine() {
    ctx.beginPath();

    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00000077";
    ctx.lineTo(this.pos.x + this.vel.x * 3, this.pos.y + this.vel.y * 3);
    ctx.stroke();
    ctx.closePath();
  }

  drawTargetLine() {
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(this.target.pos.x, this.target.pos.y);

    ctx.strokeStyle = this.strokeColor;

    ctx.stroke();
  }

  getCell() {
    let ret;
    try {
      ret = this.grid[this.cellY][this.cellX];
    } catch (e) {}

    return ret;
  }
}
