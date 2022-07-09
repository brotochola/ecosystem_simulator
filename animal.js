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
    this.myRandomType = this.id.length % 3;

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
      sightLimit: 10,
      fear: Math.random(),
      // diet: Math.random(), //0 is carnivore, 1herbi, 0.5 omni
      agility: this.cellWidth * 0.1 * Math.random(),
      maxAcceleration: 1,
      // compatibilityTreshhold: 0.5, //if 1 they can breed with anyone
      likability: Math.random(),
      likabilityTreshold: Math.random() * 0.5,
      lifeExpectancy: MAX_LIFE_EXPECTANCY - Math.random() * 5,
      healthRecoveryWhenEating: Math.random() * 0.5,
      //hungerLimit: 10,
      //  hungerIncrease: 0.012,
      pregnancyDuration: (MAX_LIFE_EXPECTANCY - Math.random() * 5) / 20,
      //maxChildrenWhenPregnant: Math.floor(Math.random() * 6) + 1,
      chancesToGetPregnant: 99, // Math.random(),
      minAgeToGetPregnant: MAX_LIFE_EXPECTANCY * 0.14,
      clockEvery: 10,

      //maxSize: RESOLUTION * (Math.random() * 20 + 5),
      maxHealth: 100,
      partOfPregnancyThatEscapes: Math.random() * 0.2,
      r: Math.random(),
      g: Math.random(),
      b: Math.random(),
    };

    //STARTING VALUES
    this.pregnant = false;
    this.prevPregnancyValue = false;
    this.whenDidIGetPregnant = null;

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
    this.initializeValuesAccordingToGenes();
    this.hunger = this.getStartingHunger(parentsHunger);

    //console.log("## new animal is born", this.id, this.lastName);
  }
  getMaxSpeed = () => {
    return this.genes.agility + this.size * COEF_OF_SIZE_THAT_DEFINES_SPEED;
  };

  setHungerLimit = () => {
    let r = this.genes.r;
    let g = this.genes.g;
    let b = this.genes.b;
    let tempHungerLimit = 1 / r + 1 / g + 1 / b;

    if (tempHungerLimit < 1) tempHungerLimit = 1;
    if (tempHungerLimit > 10) tempHungerLimit = 10;
    this.props.hungerLimit = this.size; // Math.round(tempHungerLimit);
  };

  setHungerIncrease = () => {
    let r = this.genes.r;
    let g = this.genes.g;
    let b = this.genes.b;
    let temp = Math.pow(r + g, g + b) * 0.02;
    // let temp = Math.abs(b - g);
    if (temp > 1) temp = 1;
    if (temp < 0.01) temp = 0.01;
    this.props.hungerIncrease = 0.02;
  };

  setMaxSize() {
    let r = this.genes.r;
    let g = this.genes.g;
    let b = this.genes.b;
    //between 5 and 25

    let temp = 5 + 7 * (g + b + r);

    this.props.maxSize = temp;
    return temp;
  }
  setifIAmCarnivore = () => {
    let r = this.genes.r;
    let g = this.genes.g;
    let b = this.genes.b;
    this.props.carnivore = r * g > b + g / 4;
  };

  getNumberOfChildrenWhenPregnant = () => {
    let r = this.genes.r;
    let g = this.genes.g;
    let b = this.genes.b;
    let temp = g * 3 + r * 3 + b * 3;

    if (this.props.carnivore) return temp * COEF_OF_BIRTH_OF_CARNIVORES;
    else return temp;
  };

  initializeValuesAccordingToGenes = () => {
    this.props = {};
    this.props.maxSize = this.setMaxSize();
    this.size = this.defineSize();
    this.getMyTypeOfFood();
    this.setIfImAScavenger();
    this.setHungerLimit();
    this.setHungerIncrease();
    this.setifIAmCarnivore();

    if (this.genes.clockEvery < 1) this.genes.clockEvery = 1;
    if (this.genes.sightLimit < 1) this.genes.sightLimit = 1;
    if (this.props.maxSize > 30)
      this.props.maxSize = MAX_POSSIBLE_SIZE_FOR_ANIMALS;
    // if (this.genes.hungerIncrease < 0.001) this.genes.hungerIncrease = 0.001;
    if (this.genes.lifeExpectancy > MAX_LIFE_EXPECTANCY)
      this.genes.lifeExpectancy = MAX_LIFE_EXPECTANCY;
    // if (this.genes.diet > 1) this.genes.diet = 1;
    // else if (this.genes.diet < 0) this.genes.diet = 0;
  };

  setIfImAScavenger = () => {
    //IT IS RARE TO BECOME A SCAVENGER
    this.props.scavenger =
      this.genes.r > this.genes.g * 4 &&
      this.genes.r > this.genes.b * 4 &&
      this.genes.b > this.genes.g * 4;
  };

  getStartingHunger(parentsHunger) {
    return this.props.hungerLimit * 0.9;
  }

  getPos() {
    return this.pos.copy();
  }

  checkIfTheTargetIsTooFar() {
    if (!this.target || !this.target.pos || !this.pos) return;

    if (
      calcDistanceFaster(this.target, this) >
      this.cellWidth * this.genes.sightLimit
    ) {
      this.goIdle();
    }
  }

  calculateIfItsShorterGoingAround() {
    // /// LET'S CHECK IF I SHOULD GO AROUND,
    //THROUGH THE LIMITS OF THE MAP IN ORDER TO APPEAR ONT HE OTHER SIDE
    let shouldIGoThroughTheOtherSideInX = false;
    let shouldIGoThroughTheOtherSideInY = false;
    let distX = Math.abs(this.target.pos.x - this.pos.x);
    let distY = Math.abs(this.target.pos.y - this.pos.y);
    if (distX > width / 2) shouldIGoThroughTheOtherSideInX = true;
    if (distY > height / 2) shouldIGoThroughTheOtherSideInY = true;

    return {
      invertX: shouldIGoThroughTheOtherSideInX,
      invertY: shouldIGoThroughTheOtherSideInY,
    };
  }

  calculateVelVectorAccordingToTarget() {
    //I REFRESH THIS EVERY 3 FRAMES

    if (!("x" in this.vel) || !("x" in this.pos)) return;

    if (this.target) {
      if (this.target.pos) {
        let vectorThatAimsToTheTarger = p5.Vector.sub(
          this.target.pos,
          this.pos
        );
        let invertedVector = p5.Vector.sub(this.pos, this.target.pos);

        if (this.state != 8) {
          this.vel = vectorThatAimsToTheTarger;
          const { invertX, invertY } = this.calculateIfItsShorterGoingAround();
          if (invertX) this.vel.x *= -1;
          if (invertY) this.vel.y *= -1;
        } else {
          //STATE 8 MEANS ESCAPING FROM TARGET
          this.vel = invertedVector;
        }
      }
    } else {
      //CRAZY WANDER AROUND
      this.vel.add(
        new p5.Vector(Math.random() * 2 - 1, Math.random() * 2 - 1).limit(
          (Math.random() * this.getMaxSpeed()) / 2
        )
      );
    }

    //  this.vel.limit(this.genes.maxSpeed);

    //  console.log(this.vel);
  }

  die() {
    // console.log(
    //   "#",
    //   this.id,
    //   " died",
    //   this.age + " / " + Math.floor(this.genes.lifeExpectancy),
    //   "hunger:",
    //   Math.floor(this.hunger) + "/" + Math.floor(this.props.hungerLimit)
    // );
    this.pregnant = false;
    this.setTarget(null);
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

      if (this.hunger >= this.props.hungerLimit) {
        let factor =
          (this.hunger - this.props.hungerLimit) *
          COEF_HEALTH_DECREASE_BY_HUNGER;
        //WHEN YOU'RE HUNGRY YOU PASS IT TO YOUR KIDS
        this.genes.lifeExpectancy -= factor;
        this.health -= factor;
      }
      return false;
    }
  }

  getCloseCells(howMany) {
    if (howMany == null || howMany == undefined)
      howMany = Math.floor(this.genes.sightLimit / 2);
    // console.log("how many", howMany);
    let cell = this.ImAtCell;
    if (!cell) return [];
    let cells = [];

    let x = cell.x;
    let y = cell.y;
    let fromY = y - howMany;
    let toY = y + howMany;
    let fromX = x - howMany;
    let toX = x + howMany;
    //grid[i][j] :D
    for (let i = fromY; i <= toY; i++) {
      let standarizedCellYIndex = i;
      if (standarizedCellYIndex > this.grid.length - 1)
        standarizedCellYIndex = i % this.grid.length;
      if (standarizedCellYIndex < 0)
        standarizedCellYIndex = this.grid.length + standarizedCellYIndex;

      for (let j = fromX; j <= toX; j++) {
        let standarizedCellXIndex = j;
        if (j > this.grid[0].length - 1)
          standarizedCellXIndex = j % this.grid[0].length;
        if (standarizedCellXIndex < 0)
          standarizedCellXIndex = this.grid[0].length + standarizedCellXIndex;

        cells.push(this.grid[standarizedCellYIndex][standarizedCellXIndex]);
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
    this.props.myTypeOfFood = ret;
  }

  lookForAFood() {
    let mycell = this.ImAtCell;
    if (!mycell) return;

    //IF I CAN EAT DEAD MEAT
    if (this.props.scavenger) {
      //LOOK FOR DEAD ANIMALS
      //AND ANIMALS THAT ARE NOT MY SPECIES

      //IF THERE ISNT ANY, LOOK A BIT FURTHER
      let deadCloseToMe = this.closeAnimals.filter(
        (k) =>
          k.dead &&
          !this.areWeTheSameSpecies(k) &&
          k.howManyAnimalsInSameCell < MAX_ANIMALS_PER_CELL
      );
      if (deadCloseToMe.length > 0) {
        let newTarget = deadCloseToMe[0];
        this.setTarget(newTarget);
        return newTarget;
      }
    } else if (!this.props.carnivore) {
      //VEGGIE
      //CHECK HOW MANY ANIMALS ARE THERE RIGHT NOW
      let filteredCells = this.closeCells.filter(
        (k) => k.animalsHere.length < MAX_ANIMALS_PER_CELL
      );

      for (let cell of filteredCells) {
        if ("food" in cell) {
          if (cell.food > 0) {
            if (this.props.myTypeOfFood == cell.type) {
              this.setTarget(cell);
              return cell;
            }
          }
        }
      }
    } else if (this.props.carnivore) {
      let prey = this.findClosePray();
      if (prey) {
        return prey;
      } else {
        //IF IT CANNOT FIND A PRAY GO IDLE,
        //WHEN ANIMALS ARE IN STATE 0, IDLE, THEY RANDOM WANDER AROUND
        //THEY WILL GO HUNGRY AGAIN, STATE 1, AND THEN WANDER AROUND, EVENTUALLY THEY WILL FIND SOMETHING OR DIE
        this.goIdle();
      }
    }
  }

  findClosePray = () => {
    let closePrays = this.closeAnimals.filter(
      (k) =>
        !k.dead &&
        !this.areWeTheSameSpecies(k) &&
        // !k.props.carnivore &&
        k.id != this.id &&
        k.health > 0 &&
        k.howManyAnimalsInSameCell < MAX_ANIMALS_PER_CELL &&
        k.size < this.size
    );
    if (closePrays.length > 0) {
      this.setTarget(closePrays[0]);
      //SETS IN THE PRAY THAT I'M FOLLOWING IT

      return closePrays[0];
    }
  };

  setTarget(what) {
    if (this.target instanceof Animal) this.target.ImBeingFollowed(null);
    this.target = what;
    if (what instanceof Animal) what.ImBeingFollowed(this);
  }

  ImBeingFollowed(who) {
    // console.log("im being followed");
    this.follower = who;
  }

  amIHungry() {
    return this.hunger > this.props.hungerLimit / 2;
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

    let numKids = Math.floor(
      this.getNumberOfChildrenWhenPregnant() * Math.random()
    );
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
    this.setTarget(null);
  }

  whatToDoIfImHungry() {
    //IF I'M HUNGRY, WILL DECIDE WHAT TO DO BASED ON MY HUNGER, AND IF THERES FOOD HERE IN THIS CELL

    if (this.target instanceof Cell && this.target.type == 1) {
      this.setTarget(null);

      this.lookForAFood(); //WILL LOOK FOR FOOD
      return true;
    }
    if (
      this.hunger <
      COEF_PERCENTAGE_OF_HUNGER_TO_BE_CONSIDERED_FULL * this.props.hungerLimit
    ) {
      //IF IT'S FULL...
      this.goIdle();
      return true;
    } else if (!this.eatFromCell()) {
      //IF I CAN'T EAT FROM THIS CELL

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

    if (this.state == 0) {
      //IDLE
      // if (!this.target) this.lookForFriends();
    } else if (this.state == 1) {
      //HUNGRY
      if (this.whatToDoIfImHungry()) return;
    } else if (this.state == 4) {
      //HORNY
      if (this.pregnant) {
        return this.goIdle();
      }
      let closest = this.getClosestFuckBuddy();
      if (closest) this.setTarget(closest);
      if (this.target) this.checkIfFuckBuddyIsClose();
    } else if (this.state == 6) {
      //EATING

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
        COEF_PERCENTAGE_OF_HUNGER_TO_BE_CONSIDERED_FULL * this.props.hungerLimit
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
    }
  }

  lookForFriends() {
    for (let cell of this.closeCells) {
      if (cell == this.ImAtCell) continue;
      for (let anim of this.closeAnimals) {
        if (this.areWeTheSameSpecies(anim)) {
          this.setTarget(anim);
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
      this.props.hungerIncrease *
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

  isThereAnyoneIShouldEscapeFrom() {
    //if (this.props.carnivore) return false;
    let tempCloseAnimals = ((this.ImAtCell || {}).neighbours || []).map(
      (k) => k.animalsHere
    );
    let tempClosePredators = [];
    for (let t of tempCloseAnimals) {
      tempClosePredators = [
        ...tempClosePredators,
        ...t,
        ...this.ImAtCell.animalsHere,
      ];
    }

    this.closePredators = tempClosePredators.filter(
      (k) =>
        k.props.carnivore && !this.areWeTheSameSpecies(k) && k.id != this.id
    );
    if (this.closePredators.length > 0) return true;
    return false;
  }

  setVectorToEscapeFromPredators() {
    //AKA SEPARATION
    let avg = new p5.Vector();

    let divideByHowMany = this.closePredators.length;
    if (divideByHowMany == 0) return;

    for (let anim of this.closePredators) {
      let diff = p5.Vector.sub(this.pos, anim.pos);
      avg.add(diff);
    }

    //avg.div(divideByHowMany);
    avg.setMag(this.getMaxSpeed());
    this.vel = avg;
  }
  haveIChangedCellSinceTheLastTick() {
    if (!this.prevCell) return true;
    if (this.prevCell && this.ImAtCell) {
      if (this.prevCell != this.ImAtCell) return true;
    }
  }

  tick(FRAMENUM) {
    // this.debug = 0;
    if (this.checkDeath()) return;

    let tempPerfoTime = performance.now();

    this.FRAMENUM = FRAMENUM;
    this.prevPregnancyValue = this.pregnant;
    this.numberOfCloseAnimalsWithMySameTarget = null;

    this.prevCell = this.ImAtCell;
    this.ImAtCell = this.getCell();

    /// THIS SHOULD BE SET ONLY ONCE PER TICK
    if (this.haveIChangedCellSinceTheLastTick()) {
      this.closeCells = this.getCloseCells();
      this.closeAnimals = this.getCloseAnimals(true);
      this.addOrRemoveMeFromCell();
    } else {
    }

    if (!this.dead) this.age++;
    this.setLimits();

    let clockEvery = Math.floor(this.genes.clockEvery);
    clockEvery = clockEvery < 3 ? 3 : clockEvery;

    // this.checkIfItsTooCrowdedHere();

    ////BRAIN STUFF
    this.accordingToStuffChangeState(); //FEEL
    this.accordingToStateSetTarget(); //SEE

    if (this.FRAMENUM % 3 != this.myRandomType) {
      if (this.isThereAnyoneIShouldEscapeFrom()) {
        this.state = 2;
        this.setTarget(null);
        this.setVectorToEscapeFromPredators();
      } else {
        if (this.state == 2) this.goIdle();
        this.calculateVelVectorAccordingToTarget(); //MOVE
      }
    }

    //// POSITION STUFF
    //  this.checkIfTheTargetIsTooFar();
    this.vel.add(this.acc);
    this.makeThemShake();
    this.vel.limit(this.getMaxSpeed());
    this.pos.add(this.vel);

    this.howManyAnimalsInSameCell = (
      (this.ImAtCell || {}).animalsHere || []
    ).length;

    this.sumHunger();

    //if (this.ImAtCell) this.ImAtCell.type = 0; //THIS LINE MAKES THE ANIMAL DRAW GRASS
    ///update it's data:
    this.cellX = Math.floor(this.pos.x / this.cellWidth);
    this.cellY = Math.floor(this.pos.y / this.cellWidth);
    this.defineSize();
    this.perfoCheck = performance.now() - tempPerfoTime;

    //this.showDebug()
  }

  addOrRemoveMeFromCell() {
    if (this.ImAtCell) this.ImAtCell.addMe(this);
    if (this.prevCell) this.prevCell.removeMe(this);
  }
  checkIfItsTooCrowdedHere() {
    if (this.FRAMENUM % 3 == this.myRandomType) return;

    if (this.howManyAnimalsInSameCell > MAX_ANIMALS_PER_CELL && !this.crowded) {
      // this.state = 1;
      // this.lookForAFood();
      // this.goIdle();
      this.vel = new p5.Vector(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).setMag(this.getMaxSpeed());
      console.log(this.id, "crowded");
      this.crowded = true;
    } else {
      this.crowded = false;
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
        this.hunger / this.props.hungerLimit,
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
      hu: (this.hunger / this.props.hungerLimit).toFixed(2),
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
        me.distance2Target = calcDistanceFaster(this, this.target).toFixed(2);
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
    // if (this.highlighted) {
    //   this.size = 30;
    //   return;
    // }

    this.size = (this.age / this.genes.lifeExpectancy) * this.props.maxSize;

    if (this.size > this.props.maxSize) this.size = this.props.maxSize;
    if (this.size < MIN_ANIMAL_SIZE) this.size = MIN_ANIMAL_SIZE;
    return this.size;
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

  drawDebugAura() {
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ff000077";
    ctx.fill();
    ctx.closePath();
  }
  areWeInTheSameCell(animal) {
    return animal.ImAtCell == this.ImAtCell;
  }

  checkIfFuckBuddyIsClose() {
    if (!(this.target instanceof Animal)) return;
    if (this.target && this.target.pos) {
      // let dist = calcDistanceFaster(this, this.target);

      if (
        //  dist < this.cellWidth * MIN_DISTANCE_FACTOR_TO_INTERACT &&
        this.areWeInTheSameCell(this.target) &&
        this.amIOldEnoughToFuck()
      ) {
        if (Math.random() < this.genes.chancesToGetPregnant) {
          this.getPregnant();
          return true;
        } else {
          this.setTarget(null);
        }

        // this.separation();
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

  eatCloseAnimals() {
    if (!this.target) return;
    let distToPray = calcDistanceFaster(this, this.target);

    if (distToPray < this.cellWidth / 2) {
      if (this.target instanceof Animal && this.target.health > 0) {
        //THE HEALTH OF THE VICTIM GOES DOWN RELATIVELY TO THE SIZE OF THE PREDATOR
        this.target.health -= (this.size * this.health) / this.genes.maxHealth;
        //THE HUNGER OF THE PREDATOR HAS TO DO WITH THE SIZE OF THE PRAY
        this.hunger -=
          (this.target.size * this.target.health) / this.target.genes.maxHealth;

        return true;
      }
    }
  }

  eatFromCell() {
    let mycell = this.ImAtCell;
    if (!mycell) return;

    //IF I'M A CARNIVORE
    if (this.props.carnivore && this.eatCloseAnimals()) return true;

    //VEGGIE:
    if (
      mycell.food > 0 &&
      mycell.type == this.props.myTypeOfFood &&
      !this.props.carnivore
    ) {
      mycell.food -=
        this.size * FACTOR_HOW_MUCH_FOOD_ANIMALS_EAT_RELATIVE_TO_SIZE;
      this.hunger--;
      this.health += this.genes.healthRecoveryWhenEating;
      //this.health++;

      return true;
    } else if (this.props.scavenger) {
      //IF THERE'S NO VEGGIES, LOOK FOR DEAD ANIMALS IF YOU RE A SCAVENGER
      let deadAnimalsInThisCel = this.ImAtCell.animalsHere.filter(
        (k) => k.dead && !this.areWeTheSameSpecies(k) && k.decomposition <= 100
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

  areWeFamily(a) {
    return a instanceof Animal && a.lastName == this.lastName;
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
      areWeSimilar &&
      doILikeThem &&
      this.amIHealthy() &&
      animal.amIHealthy() &&
      !this.areWeFamily(animal)
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
    let hungerRatio = 1 - this.hunger / this.props.hungerLimit;
    let ageRatio = 1 - this.age / this.genes.lifeExpectancy;
    if (ageRatio > 1) ageRatio = 1;
    if (ageRatio < 0) ageRatio = 0;

    //if (this.debug) this.drawDebugAura();

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

    if (!this.dead && RENDER_DIRECTION_LINES) {
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

    let c;

    if (this.state == 6) c = "yellow"; // eating
    else if (this.state == 2) c = "white";
    else if (this.state == 8) c = "white"; //escaping from fuck buddy
    else if (this.state == 0) c = "#2222ff"; //idle blue
    else if (this.state == 1) {
      if (!this.props.carnivore) {
        if (this.props.myTypeOfFood == 0) {
          c = "#00ff00"; //hungry green
        } else if (this.props.myTypeOfFood == 2) {
          c = "#faff64";
        }
      } else {
        c = "#ff07ff"; //carnbivore chasing pray
      }
    } else if (this.state == 4) c = "#ff0000"; //horny red
    else if (this.dead) c = "#000000"; //dead black

    //IF YOU EAT DEAD MEAT...
    if (
      this.props.scavenger &&
      this.state == 1 &&
      this.target instanceof Animal
    ) {
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
