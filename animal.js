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
    parentsHunger
  ) {
    this.cellWidth = cellWidth;
    this.grid = grid;
    this.id = Math.random().toString(36).substring(2, 9);
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
      "pregnant",
    ];

    //CONSCIOUSNESS
    this.state = 0; //Math.floor(Math.random() * this.possibleStates.length);
    this.target = null; //this.pickARandomCell();
    this.loneliness = 0; //if very lonely will try to look for someone to fuck, given compatibility and likabilty of the other animal

    //GENES
    this.genes = genes || {
      sightLimit: Math.random() * 10,
      fear: Math.random(),
      diet: Math.random(), //0 is carnivore, 1herbi, 0.5 omni
      maxSpeed: 5 * Math.random() + 1,
      maxAcceleration: 1,
      compatibilityTreshhold: 100, //if 1 they can breed with anyone
      likability: Math.random(),
      likabilityTreshold: Math.random() * 0.5,
      lifeExpectancy: 25 * YEAR,
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
      maxSize: Math.random() * 6 + 6,
      maxHealth: 100,
      r: Math.floor(Math.random() * 255),
      g: Math.floor(Math.random() * 255),
      b: Math.floor(Math.random() * 255),
    };

    if (this.genes.clockEvery < 1) this.genes.clockEvery = 1;
    this.defineSize();
    //STARTING VALUES
    this.pregnant = false;
    this.whenDidIGetPregnant = null;
    this.hunger =
      (parentsHunger ? parentsHunger * 1 : 0) +
      this.genes.hungerLimit * Math.random() * 0.5;

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

  getPos() {
    return this.pos.copy();
  }

  calculateVelVectorAccordingToTarget() {
    if (!("x" in this.vel)) return;
    if (this.target) {
      if ("getPos" in this.target && this.target.getPos instanceof Function) {
        let targetsPos = this.target.getPos();
        this.vel = p5.Vector.sub(targetsPos, this.pos);
      } else {
        debugger;
      }
    }

    this.vel.limit(this.genes.maxSpeed);
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
    this.dead = true;

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

  lookForAFood() {
    let mycell = this.getCell();
    if (!mycell) return;
    let cells = [mycell, ...mycell.getNeighbours()];

    for (let cell of cells) {
      if (cell instanceof Cell && "food" in cell) {
        if (cell.food > 0) {
          if (this.genes.diet > 0) {
            this.target = cell;
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

    for (let i = 0; i < numKids; i++) {
      let newAnimal = new Animal(
        this.cellWidth,
        this.grid,
        this.crossMyGenesWith(this.pregnant),
        this.pos.x,
        this.pos.y,
        0,
        this.generation + 1,
        this.hunger
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
      this.state = 1;
    } else if (
      this.amIOldEnoughToFuck() &&
      this.amIHealthy() &&
      !this.pregnant
    ) {
      this.state = 4;
    } else if (!this.amIHungry()) {
      this.state = 0;
    }
  }

  accordingToStateSetTarget() {
    if (this.pregnant) this.checkIfImGivingBirth();

    if (this.state == 4) {
      this.getClosestFuckBuddy();
      this.checkIfFuckBuddyIsClose();
      if (this.pregnant) this.state = 0;
    } else if (this.state == 1) {
      if (!this.eatFromCell()) this.lookForAFood();
      else {
        this.state = 6;
      }
    } else if (this.state == 6) {
      //eating
      this.vel = new p5.Vector(0, 0);
    } else if (this.state == 0) {
      //IDLE
      //  this.vel = new p5.Vector(0, 0);
    }
  }

  tick(FRAMENUM) {
    this.FRAMENUM = FRAMENUM;
    if (this.dead) {
      this.decomposition++;
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

    ///update it's data:
    this.cellX = Math.floor(this.pos.x / this.cellWidth);
    this.cellY = Math.floor(this.pos.y / this.cellWidth);
    this.defineSize();

    this.saveInLocalStorage();
  }

  saveInLocalStorage() {
    if (this.getMyI() == 0) {
      if (!localStorage["animal0"]) localStorage["animal0"] = "{}";

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

      let obj = JSON.parse(localStorage["animal0"]);
      obj[this.FRAMENUM] = me;
      localStorage["animal0"] = JSON.stringify(obj);
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
    console.log(1);
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);

    ctx.fillStyle = "#FF0000";

    ctx.fill();
    ctx.closePath();
  }

  checkIfFuckBuddyIsClose() {
    if (this.pregnant) return false;
    if (this.target && this.target.pos) {
      let dist = distance(this.pos, this.target.pos);
      if (dist) {
        if (
          dist < this.size * MIN_DISTANCE_FACTOR_TO_INTERACT &&
          this.amIOldEnoughToFuck()
        ) {
          if (Math.random() < this.genes.chancesToGetPregnant) {
            this.getPregnant();
          }

          // this.separation();
        }
      }
    }
  }

  getPregnant() {
    this.drawPregnancyHappening();
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
      //this.health++;
      this.target = null;
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
    try {
      let ret = [];

      if (this.ImAtCell) {
        let cells = this.ImAtCell.getNeighbours();
        for (let cell of cells) {
          if (cell) {
            for (let cell2 of cell.getNeighbours()) {
              if (cell2) {
                for (animal of cell2.animalsHere) {
                  //check if i dont have it
                  let found = false;
                  for (let animsss of ret) {
                    if (animsss == animal) {
                      found = true;
                    }
                  }
                  if (!found) ret.push(animal);
                }
              }
            }
          }
        }
        if (!Array.isArray(ret)) debugger;
        return ret.filter((k) => k != this);
      }
    } catch (e) {
      return [];
    }
  }

  getClosestFuckBuddy() {
    let aas = this.getCloseAnimals();
    if (aas && Array.isArray(aas)) {
      for (animal of aas) {
        if (this.amICompatibleToBreedWith(animal)) {
          this.target = animal;
          return animal;
        }
      }
    }
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
    // if (this.pregnant) {
    //   this.elem.style.backgroundColor = "white";
    // } else {
    //   this.elem.style.backgroundColor = this.getColorFromGenes();
    // }
    // if (this.dead) {
    //   this.elem.style.backgroundColor = "black";
    // }

    // let transform = "translate3d(" + this.pos.x + "px," + this.pos.y + "px,0)";
    // this.elem.style.transform = transform;
    // this.elem.style.width = this.size + "px";
    // this.elem.style.height = this.size + "px";

    this.renderCanvas();
  }

  renderCanvas() {
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
    ctx.lineWidth = 2;
    let strokeColor =
      "rgb(" +
      (hungerRatio * 255).toFixed(0) +
      "," +
      (ageRatio * 255).toFixed(0) +
      "," +
      (healthRatio * 255).toFixed(0) +
      ")";

    ctx.strokeStyle = this.dead ? "#000000" : strokeColor;

    ctx.arc(this.pos.x, this.pos.y, this.size / 2, 0, 2 * Math.PI);

    ctx.fill();
    if (!this.dead) ctx.stroke();
    ctx.closePath();

    //DIRECTION LINE
    //    ctx.stroke();

    if (!this.dead) {
      ctx.beginPath();

      ctx.moveTo(this.pos.x, this.pos.y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#00000077";
      ctx.lineTo(this.pos.x + this.vel.x * 3, this.pos.y + this.vel.y * 3);
      ctx.stroke();
    }

    ctx.restore();
    //ctx.rotate(1);

    //ctx.fill(
  }

  getCell() {
    let ret;
    try {
      ret = this.grid[this.cellY][this.cellX];
    } catch (e) {}

    return ret;
  }
}
