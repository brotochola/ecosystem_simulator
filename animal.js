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
    this.cellWidth = cellWidth;
    this.grid = grid;
    this.id = generateID();
    this.lastName = lastName || generateID();
    this.type = "animal";
    this.generation = generation ? generation : 0;

    //CONSTANTS:
    this.possibleStates = [
      "idle",
      "hungry",
      "escaping",
      "goingToGroup",
      "horny",
      "givingBirth",
      "eating",
      "dead",
    ];

    //CONSCIOUSNESS
    this.state = 0; //Math.floor(Math.random() * this.possibleStates.length);
    this.target = null; //this.pickARandomCell();
    this.loneliness = 0; //if very lonely will try to look for someone to fuck, given compatibility and likabilty of the other animal

    //GENES
    this.genes = genes || {
      sightLimit: 10,
      fear: Math.random(),
      diet: Math.random(), //0 is carnivore, 1herbi, 0.5 omni
      maxSpeed: 1 * Math.random() + 1,
      maxAcceleration: 1,
      compatibilityTreshhold: 100, //if 1 they can breed with anyone
      likability: Math.random(),
      likabilityTreshold: Math.random() * 0.5,
      lifeExpectancy: 65 * YEAR,
      healthRecoveryWhenEating: Math.random() * 0.5,
      hungerLimit: 10,
      hungerIncrease: 0.03,
      healthDecreaseByHunger: 0.1,
      healthDecreaseByAge: 1,
      pregnancyDuration: 10 * YEAR,
      maxChildrenWhenPregnant: Math.floor(Math.random() * 3) + 1,
      chancesToGetPregnant: Math.random(),
      minAgeToGetPregnant: 10 * YEAR,
      clockEvery: 10,
      maxMutationWhenBreeding: Math.random() * 0.2 - 0.1,
      maxSize: RESOLUTION * (Math.random() * 10 + 5),
      maxHealth: 100,
      r: Math.floor(Math.random() * 255),
      g: Math.floor(Math.random() * 255),
      b: Math.floor(Math.random() * 255),
    };

    if (this.genes.clockEvery < 1) this.genes.clockEvery = 1;
    if (this.genes.sightLimit < 1) this.genes.sightLimit = 1;
    this.defineSize();
    //STARTING VALUES
    this.pregnant = false;
    this.prevPregnancyValue = false;
    this.whenDidIGetPregnant = null;

    this.hunger = this.getStartingHunger(parentsHunger);

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

  calculateVelVectorAccordingToTarget() {
    if (!("x" in this.vel)) return;
    if (this.target) {
      if ("getPos" in this.target && this.target.getPos instanceof Function) {
        let targetsPos = this.target.getPos();

        this.vel = p5.Vector.sub(targetsPos, this.getPos());
      }
    } else {
      this.vel.add(
        new p5.Vector(Math.random(), Math.random()).setMag(
          Math.random() * this.genes.maxSpeed
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
    this.state = 7; //dead

    //animals.splice(i, 1);

    //this.elem.remove();
  }

  checkDeath() {
    if (this.health < 0) {
      this.die();
    }
    if (this.age > this.genes.lifeExpectancy) {
      this.health -= this.genes.healthDecreaseByAge;
    }

    //if hungry, it hurts

    if (this.hunger >= this.genes.hungerLimit) {
      this.health -= this.genes.healthDecreaseByHunger;
      this.hunger = this.genes.hungerLimit;
    }
  }

  getCloseCells(howMany) {
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
    let filteredCells = cells.filter(
      (k) => k.animalsHere.length < MAX_ANIMALS_PER_CELL
    );

    return filteredCells;
  }

  lookForAFood() {
    let mycell = this.getCell();
    if (!mycell) return;
    let cells = this.getCloseCells();

    for (let cell of cells) {
      if ("food" in cell) {
        if (cell.food > 0) {
          if (this.genes.diet > 0) {
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
    console.log(this.id + " " + this.lastName, "got ", numKids, " kids");
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
        this.genes.maxMutationWhenBreeding * Math.random() +
        (1 - this.genes.maxMutationWhenBreeding / 2);

      if (Math.random() > 0.5) result[k] = mygen * mutationCoef;
      else result[k] = theirgen * mutationCoef;
    }

    return result;
  }

  checkIfTheresSomeoneTooClose() {
    if (this.ImAtCell && this.ImAtCell.animalsHere)
      for (let a of this.ImAtCell.animalsHere) {
        if (distance(a.pos, this.pos) < this.size) {
          this.vel = p5.Vector.add(a.pos, this.pos);
        }
      }
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
        let dist = distance(anim.pos, this.pos);

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
    // if (this.pregnant) this.state = 7;
    if (this.amIHungry()) {
      if (this.state != 6) this.state = 1;
    } else if (
      this.amIOldEnoughToFuck() &&
      this.amIHealthy() &&
      !this.pregnant &&
      this.state == 0
    ) {
      this.state = 4;
    }
  }

  goIdle() {
    this.state = 0;
    this.target = null;

    this.lookForAFood();
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
        if (this.amIHungry()) this.state = 1;
        else this.goIdle();
      }
      //WILL EAT UNTIL HE'S OK
      if (this.hunger <= 1) {
        this.goIdle();
      }
    } else if (this.state == 0) {
      //IDLE
      //  this.vel = new p5.Vector(0, 0);
    }
  }

  tick(FRAMENUM) {
    this.FRAMENUM = FRAMENUM;
    this.prevPregnancyValue = this.pregnant;
    if (this.dead) {
      this.decomposition += 2;
      //this.decomposition *= 1.1;
      if (this.decomposition > 100) {
        let i = this.getMyI();
        animals.splice(i, 1);
      }
      return;
    }
    //age, in days/frames
    this.age++;

    // let increase =
    //   this.genes.hungerIncrease * (this.genes.lifeExpectancy / this.age);
    // if (increase > 1) increase = 1;
    this.hunger += this.genes.hungerIncrease;

    this.checkDeath();

    //  this.checkIfTheresSomeoneTooClose();

    this.setLimits();

    //this.flockBehaviour();

    let clockEvery = Math.floor(this.genes.clockEvery);
    clockEvery = clockEvery < 3 ? 3 : clockEvery;

    // if (this.FRAMENUM % clockEvery == 0) {
    this.accordingToStuffChangeState();
    this.accordingToStateSetTarget();

    this.calculateVelVectorAccordingToTarget();
    // }

    //limit the speed
    //this.acc.limit(this.genes.maxAcceleration);
    this.vel.limit(this.genes.maxSpeed);
    this.vel.add(this.acc);
    this.pos.add(this.vel);

    if (this.ImAtCell != this.getCell()) {
      if (this.ImAtCell) this.ImAtCell.removeMe(this);
      this.ImAtCell = this.getCell();
      if (this.ImAtCell) this.ImAtCell.addMe(this);
    }

    //if (this.ImAtCell) this.ImAtCell.type = 0; //THIS LINE MAKES THE ANIMAL DRAW GRASS
    ///update it's data:
    this.cellX = Math.floor(this.pos.x / this.cellWidth);
    this.cellY = Math.floor(this.pos.y / this.cellWidth);
    this.defineSize();

    this.saveInLocalStorage();
  }

  saveInLocalStorage() {
    if (this.getMyI() == 0) {
      if (!window.animal0) window.animal0 = {};

      let me = {
        id: this.id,
        hu: (this.hunger / this.genes.hungerLimit).toFixed(2),
        st: this.state,
        hea: (this.health / this.genes.maxHealth).toFixed(2),
        tgt: (this.target || {}).type,
        preg: !!this.pregnant ? 1 : 0,
        age: (this.age / this.genes.lifeExpectancy).toFixed(2),
      };

      if (this.target) {
        try {
          me.distance2Target = distance(this.pos, this.target.pos).toFixed(2);
        } catch (e) {
          //console.warn(e);
        }
      }

      let obj = window.animal0;
      obj[this.FRAMENUM] = me;
      window.animal0 = obj;
    }
  }

  defineSize() {
    //it's size
    this.size =
      (this.age / this.genes.lifeExpectancy) * this.genes.maxSize +
      this.genes.maxSize / 2;
    if (this.size > this.genes.maxSize) this.size = this.genes.maxSize;
    if (this.size < 5) this.size = 5;
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
    ctx.arc(this.pos.x, this.pos.y, this.size * 1.5, 0, Math.PI * 2);

    ctx.fillStyle = "#FF0000";

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
    return;
  }

  getPregnant() {
    //this.drawPregnancyHappening();
    console.log(this.id + " " + this.lastName, "got p");
    this.pregnant = JSON.parse(JSON.stringify(this.target.genes));

    this.target = null;
    this.whenDidIGetPregnant = this.FRAMENUM;
  }
  eatFromCell() {
    let mycell = this.getCell();
    if (!mycell) return;
    if (mycell.food > 0) {
      mycell.food--;
      this.hunger--;
      this.health += this.genes.healthRecoveryWhenEating;
      //this.health++;
      //this.target = null;
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

    // this.target = getCenterCell();
  }

  getCloseAnimals() {
    let animalsToRet = [];
    let cells = this.getCloseCells();

    for (let c of cells) {
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
    this.strokeColor =
      this.state == 6
        ? "white" // eating white
        : this.state == 0
        ? "#0000ff" //idle blue
        : this.state == 1
        ? "#00ff00" //hungry green
        : this.state == 4
        ? "#ff0000" //horny red
        : this.dead
        ? "#000000" //dead black
        : null;

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
      if (this.target && (this.state == 4 || this.state == 1)) {
        this.drawTargetLine();
      }

      if (this.pregnant && !this.prevPregnancyValue)
        this.drawPregnancyHappening();
    }

    ctx.restore();
    //ctx.rotate(1);

    //ctx.fill(
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
