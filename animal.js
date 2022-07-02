class Animal {
  getColorFromGenes() {
    if (this.highlighted) return "#0000ff";
    if (this.pregnant) {
      return "#ffffff";
    }
    if (this.dead) return "rgb(0,0,0," + (100 - this.decomposition) / 100 + ")";
    return (
      "rgb(" +
      Math.floor(this.genes.r * 255) +
      "," +
      Math.floor(this.genes.g * 255) +
      "," +
      Math.floor(this.genes.b * 255) +
      ")"
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

    //console.log(this.id + " " + this.lastName);

    //CONSCIOUSNESS
    this.state = 0; //Math.floor(Math.random() * this.possibleStates.length);
    this.target = null; //this.pickARandomCell();
    this.loneliness = 0; //if very lonely will try to look for someone to fuck, given compatibility and likabilty of the other animal
    this.cellsClose = [];
    //GENES
    this.genes = genes || {
      sightLimit: 5,
      fear: Math.random(),
      diet: Math.random(), //0 is carnivore, 1herbi, 0.5 omni
      agility: 2 * Math.random() + 1,
      maxAcceleration: 1,
      // compatibilityTreshhold: 0.5, //if 1 they can breed with anyone
      likability: Math.random(),
      likabilityTreshold: Math.random() * 0.5,
      lifeExpectancy: MAX_LIFE_EXPECTANCY,
      healthRecoveryWhenEating: Math.random() * 0.5,
      hungerLimit: 10,
      hungerIncrease: 0.012,
      pregnancyDuration: 6 * YEAR,
      maxChildrenWhenPregnant: Math.floor(Math.random() * 6) + 1,
      chancesToGetPregnant: Math.random(),
      minAgeToGetPregnant: 13 * YEAR,
      clockEvery: 10,

      maxSize: RESOLUTION * (Math.random() * 20 + 5),
      maxHealth: 100,
      partOfPregnancyThatEscapes: Math.random() * 0.2,
      r: Math.random(),
      g: Math.random(),
      b: Math.random(),
    };

    this.initializeValuesAccordingToGenes();

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
    this.vel.limit(this.getMaxSpeed());

    this.perfoCheck = 999;

    //console.log("## new animal is born", this.id);
  }
  getMaxSpeed = () => {
    return this.genes.agility * this.size * COEF_OF_SIZE_THAT_DEFINES_SPEED;
  };

  initializeValuesAccordingToGenes = () => {
    this.getMyTypeOfFood();
    this.setIfImAScavenger();

    if (this.genes.clockEvery < 1) this.genes.clockEvery = 1;
    if (this.genes.sightLimit < 1) this.genes.sightLimit = 1;
    if (this.maxSize > 30) this.maxSize = MAX_POSSIBLE_SIZE_FOR_ANIMALS;
    if (this.hungerIncrease < 0.001) this.hungerIncrease = 0.001;
    if (this.genes.lifeExpectancy > MAX_LIFE_EXPECTANCY)
      this.genes.lifeExpectancy = MAX_LIFE_EXPECTANCY;
    if (this.genes.diet > 1) this.genes.diet = 1;
    else if (this.genes.diet < 0) this.genes.diet = 0;
  };

  setIfImAScavenger = () => {
    //IT IS RARE TO BECOME A SCAVENGER
    this.scavenger =
      this.genes.r > this.genes.g &&
      this.genes.r > this.genes.b &&
      this.genes.b > this.genes.g &&
      this.genes.diet < 0.2;
  };

  getStartingHunger(parentsHunger) {
    return this.genes.hungerLimit * 0.9;
  }

  getPos() {
    return this.pos.copy();
  }

  checkIfTheTargetIsTooFar() {
    if (!this.target || !this.target.getPos || !this.getPos) return;
    if (
      calcDistanceFaster(this.target, this) >
      this.cellWidth * this.genes.sightLimit
    ) {
      this.goIdle();
    }
  }

  calculateVelVectorAccordingToTarget() {
    //I REFRESH THIS EVERY 3 FRAMES
    let myRandomType = this.id.length % 3;
    if (this.FRAMENUM % 3 == myRandomType) return;

    if (!("x" in this.vel)) return;

    if (this.target) {
      if ("getPos" in this.target && this.target.getPos instanceof Function) {
        let targetsPos = this.target.getPos(); //getpos returns a copy of the vector

        if (this.state != 8) {
          this.vel = p5.Vector.sub(targetsPos, this.pos);
        } else {
          //STATE 8 MEANS ESCAPING FROM TARGET
          this.vel = p5.Vector.sub(this.pos, targetsPos);
        }
      }
    } else {
      this.vel.add(
        new p5.Vector(Math.random() * 2 - 1, Math.random() * 2 - 1).limit(
          (Math.random() * this.getMaxSpeed()) / 2
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
    // if (!USE_QUADTREE) removeAnimalFromAllCells(this);
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

  getCloseCells(howMany = Math.floor(this.genes.sightLimit / 2)) {
    let cell = this.ImAtCell;
    if (!cell) return [];
    let cells = [];

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
      let distA = calcDistanceFaster(cell, a);
      let distB = calcDistanceFaster(cell, b);
      if (distA > distB) return 1;
      else return -1;
    });

    return cells;
  }

  getMyTypeOfFood() {
    //SEE cell.type
    let ret;
    let what = this.genes.b > this.genes.r;

    if (what) ret = 0;
    else ret = 2;
    this.myTypeOfFood = ret;
    return ret;
  }

  lookForAFood() {
    let mycell = this.ImAtCell;
    if (!mycell) return;

    //IF I CAN EAT DEAD MEAT
    if (this.scavenger) {
      //LOOK FOR DEAD ANIMALS
      //AND ANIMALS THAT ARE NOT MY SPECIES

      //IF THERE ISNT ANY, LOOK A BIT FURTHER
      let deadCloseToMe = this.closeAnimals.filter(
        (k) => k.dead && !this.amICompatibleToBreedWith(k)
      );
      if (deadCloseToMe.length > 0) {
        let newTarget = deadCloseToMe[0];
        this.target = newTarget;
        return newTarget;
      }
    } else {
      //VEGGIE
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

  lightUpToDebug() {
    this.highlighted = true;
  }

  flockBehaviour() {
    if (this.age < 3) return;
    //ARREGLAR
    this.acc = new p5.Vector(0, 0);
    // this.acc.add(this.align());
    //  this.acc.add(this.cohesion());
    this.acc.add(this.separation());
  }

  // align() {
  //   let avg = new p5.Vector();

  //   let closeanimals = this.getCloseAnimals() || [];

  //   let divideByHowMany = 0;
  //   for (let anim of closeanimals) {
  //     if (this.areWeTheSameSpecies(anim)) {
  //       avg.add(anim.vel);
  //       divideByHowMany++;
  //     }
  //   }
  //   if (divideByHowMany > 0) {
  //     avg.div(divideByHowMany);
  //     avg.sub(this.vel);
  //     avg.limit(this.genes.maxAcceleration);
  //     return avg;
  //   }
  //   return new p5.Vector(0, 0);
  // }

  // cohesion() {
  //   let avg = new p5.Vector();
  //   let closeanimals = this.getCloseAnimals() || [];

  //   let divideByHowMany = 0;
  //   for (let anim of closeanimals) {
  //     if (this.areWeTheSameSpecies(anim)) {
  //       avg.add(anim.pos);
  //       divideByHowMany++;
  //     }
  //   }
  //   if (divideByHowMany > 0) {
  //     avg.div(divideByHowMany);
  //     avg.sub(this.pos);
  //     avg.limit(this.genes.maxAcceleration);

  //     //this.vel = avg;
  //     return avg;
  //   }
  //   return new p5.Vector(0, 0);
  // }

  // separation() {
  //   let avg = new p5.Vector();
  //   let closeanimals = this.getCloseAnimals() || [];

  //   let divideByHowMany = 0;
  //   for (let anim of closeanimals) {
  //     if (this.areWeTheSameSpecies(anim)) {
  //       let diff = p5.Vector.sub(this.pos, anim.pos);
  //       let dist = distance(this.pos, anim.pos);

  //       diff.div(dist);
  //       avg.add(diff);
  //       divideByHowMany++;
  //     }
  //   }
  //   if (divideByHowMany > 0) {
  //     avg.div(divideByHowMany);
  //     //  avg.sub(this.vel);
  //     avg.limit(this.genes.maxAcceleration);

  //     return avg;
  //   }
  //   return new p5.Vector(0, 0);
  // }

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

  whatToDoIfImHungry() {
    //IF I'M HUNGRY, WILL DECIDE WHAT TO DO BASED ON MY HUNGER, AND IF THERES FOOD HERE IN THIS CELL

    if (this.target instanceof Cell && this.target.type == 1) {
      this.target = null;
      this.lookForAFood(); //WILL LOOK FOR FOOD
      return true;
    }
    if (
      this.hunger <
      COEF_PERCENTAGE_OF_HUNGER_TO_BE_CONSIDERED_FULL * this.genes.hungerLimit
    ) {
      //IF IT'S FULL...
      this.goIdle();
      return true;
    } else if (!this.eatFromCell()) {
      //AND CAN'T EAT FROM THIS CELL
      if (this.amIHungry()) {
        //AND STILL HUNGRY
        this.lookForAFood(); //WILL LOOK FOR FOOD
        return true;
      }
    } else {
      //IF IT COULD FIND FOOD IN THIS CELL CHANGES THE STATE
      this.state = 6;
    }
    return false;
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
      if (this.whatToDoIfImHungry()) return;
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
    for (let cell of this.closeCells) {
      if (cell == this.ImAtCell) continue;
      for (let anim of this.closeAnimals) {
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
      (this.size * COEF_OF_SIZE_THAT_DEFINES_HUNGER_INCREASE) *
      (Math.abs(this.vel.x) + Math.abs(this.vel.y));
    if (!isNaN(howMuch)) this.hunger += howMuch;
  }

  addInQuadTree() {
    tree.insert({
      x: this.pos.x,
      y: this.pos.y,
      width: this.size,
      height: this.size,
      animal: this,
    });
  }
  tick(FRAMENUM) {
    this.addOrRemoveMeFromCell();

    if (this.checkDeath()) return;

    let tempPerfoTime = performance.now();

    this.FRAMENUM = FRAMENUM;
    this.prevPregnancyValue = this.pregnant;
    this.numberOfCloseAnimalsWithMySameTarget = null;
    /// THIS SHOULD BE SET ONLY ONCE PER TICK
    this.closeCells = this.getCloseCells();
    this.closeAnimals = this.getCloseAnimals(true);

    if (!this.dead) this.age++;
    this.setLimits();

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
    this.vel.limit(this.getMaxSpeed());

    this.pos.add(this.vel);

    this.sumHunger();

    this.howManyAnimalsInSameCell = (
      (this.ImAtCell || {}).animalsHere || []
    ).length;

    //  this.checkIfItsTooCrowdedHere();

    //if (this.ImAtCell) this.ImAtCell.type = 0; //THIS LINE MAKES THE ANIMAL DRAW GRASS
    ///update it's data:
    this.cellX = Math.floor(this.pos.x / this.cellWidth);
    this.cellY = Math.floor(this.pos.y / this.cellWidth);
    this.defineSize();

    this.perfoCheck = performance.now() - tempPerfoTime;

    //this.showDebug()
  }

  addOrRemoveMeFromCell() {
    if (USE_QUADTREE) {
      this.ImAtCell = this.getCell();
    } else {
      let tempGetcell = this.getCell();
      if (this.ImAtCell != tempGetcell) {
        if (this.ImAtCell) this.ImAtCell.removeMe(this);
        this.ImAtCell = tempGetcell;
        if (this.ImAtCell) this.ImAtCell.addMe(this);
      }
    }
  }
  checkIfItsTooCrowdedHere() {
    //MAKE IT HUNGRY
    //LIKE.. I GET OUTTA HERE, I'M GONN' EAT SOMETHIN'
    //   if (this.howManyAnimalsInSameCell > MAX_ANIMALS_PER_CELL) {
    // this.state = 1;
    // this.lookForAFood();
    //this.goIdle();
    //}
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
      deco: this.decomposition,
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
    if (this.highlighted) {
      this.size = 30;
      return;
    }
    this.size = (this.age / this.genes.lifeExpectancy) * this.genes.maxSize;

    if (this.size > this.genes.maxSize) this.size = this.genes.maxSize;
    if (this.size < MIN_ANIMAL_SIZE) this.size = MIN_ANIMAL_SIZE;
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
      let dist = calcDistanceFaster(this, this.target);
      if (dist) {
        if (
          dist < this.cellWidth * MIN_DISTANCE_FACTOR_TO_INTERACT &&
          this.amIOldEnoughToFuck()
        ) {
          if (Math.random() < this.genes.chancesToGetPregnant) {
            this.getPregnant();
            return true;
          } else {
            this.target = null;
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
    let mycell = this.ImAtCell;
    if (!mycell) return;

    //VEGGIE:

    if (mycell.food > 0 && mycell.type == this.myTypeOfFood) {
      mycell.food -=
        this.size * FACTOR_HOW_MUCH_FOOD_ANIMALS_EAT_RELATIVE_TO_SIZE;
      this.hunger--;
      this.health += this.genes.healthRecoveryWhenEating;
      //this.health++;

      return true;
    } else if (this.scavenger) {
      //IF THERE'S NO VEGGIES, LOOK FOR DEAD ANIMALS IF YOU RE A SCAVENGER
      let deadAnimalsInThisCel = this.ImAtCell.animalsHere.filter(
        (k) =>
          k.dead && !this.amICompatibleToBreedWith(k) && k.decomposition <= 100
      );

      if (deadAnimalsInThisCel.length > 0) {
        let myDead = deadAnimalsInThisCel[0];
        myDead.decomposition +=
          this.size * FACTOR_HOW_MUCH_FOOD_ANIMALS_EAT_RELATIVE_TO_SIZE;
        this.hunger--;
        return true;
      }
    }

    //IF YOU DIDNT FIND FOOR HERE IN THIS CELL.. RETURN FALSE
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

  getCloseAnimals(asFarAsICanSee) {
    //HASHTABLE IMPLEMENTATION, EACH CELL KNOWS WHICH ANIMALS ARE THERE
    let animalsToRet = [];

    for (let c of this.closeCells) {
      for (let a of c.animalsHere) {
        if (a.id != this.id) animalsToRet.push(a);
      }
    }

    return animalsToRet;

    //QUADTREE IMPLEMENTATION

    // let x;
    // let y;
    // let side;

    // if (asFarAsICanSee) {
    //   x = this.pos.x - this.cellWidth * this.genes.sightLimit;
    //   y = this.pos.y - this.cellWidth * this.genes.sightLimit;
    //   side = this.cellWidth * this.genes.sightLimit * 2;
    // } else {
    //   x = this.pos.x - this.cellWidth / 2;
    //   y = this.pos.y - this.cellWidth / 2;
    //   side = this.cellWidth;
    // }

    // this.sightSquare = { x, y, side };

    // let ret = tree.retrieve({
    //   x: Math.floor(x),
    //   y: Math.floor(y),
    //   height: Math.floor(side),
    //   width: Math.floor(side),
    // });
    // return ret.map((k) => k.animal).filter((k) => k.id != this.id);
  }

  getClosestFuckBuddy() {
    let filteredCloseAnimals = this.closeAnimals.filter(
      (k) => this.amICompatibleToBreedWith(k) && k.id != this.id
    );

    return filteredCloseAnimals[0];
  }

  areWeTheSameSpecies(animal) {
    //if (true) return true;
    if (!animal) return false;
    let areThemCompatToMe =
      Math.abs(animal.genes.r - this.genes.r) < COMPATIBILITY_TRESHOLD &&
      Math.abs(animal.genes.g - this.genes.g) < COMPATIBILITY_TRESHOLD &&
      Math.abs(animal.genes.b - this.genes.b) < COMPATIBILITY_TRESHOLD;

    let amICompatTothem =
      Math.abs(animal.genes.r - this.genes.r) < COMPATIBILITY_TRESHOLD &&
      Math.abs(animal.genes.g - this.genes.g) < COMPATIBILITY_TRESHOLD &&
      Math.abs(animal.genes.b - this.genes.b) < COMPATIBILITY_TRESHOLD;

    return areThemCompatToMe && amICompatTothem;
  }

  amIHealthy() {
    return this.health > this.genes.maxHealth / 2 && !this.amIHungry();
  }

  amIOldEnoughToFuck = () => {
    return this.age > this.genes.minAgeToGetPregnant;
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
    ctx.lineWidth = this.highlighted ? 15 : 3;
    this.strokeColor = this.getStrokeColor();

    ctx.arc(
      Math.floor(this.pos.x),
      Math.floor(this.pos.y),
      Math.floor(this.size / 2),
      0,
      2 * Math.PI
    );

    if (this.strokeColor && !this.dead) {
      ctx.strokeStyle = this.strokeColor;
      if (!!renderStrokes.checked) ctx.stroke();
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

    if (SHOW_SIGHT_SQUARE) this.drawSightSquareToDebug();

    ctx.restore();

    if (SAVE_LOG_OF_ANIMALS) this.saveLog();
  }

  getStrokeColor() {
    if (this.highlighted) return "#00ff00";

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

    //IF YOU EAT DEAD MEAT...
    if (this.scavenger && this.state == 1 && this.target instanceof Animal) {
      return "black";
    }

    return c;
  }

  drawSightSquareToDebug() {
    if (!this.sightSquare) return;
    ctx.beginPath();

    ctx.moveTo(this.sightSquare.x, this.sightSquare.y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffff00";
    ctx.rect(
      this.sightSquare.x,
      this.sightSquare.y,
      this.sightSquare.side,
      this.sightSquare.side
    );
    ctx.stroke();
    ctx.closePath();
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
    ctx.lineTo(this.target.getPos().x, this.target.getPos().y);

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
