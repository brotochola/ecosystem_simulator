class Cell {
  constructor(y, x, cellWidth, elem) {
    this.cellWidth = cellWidth;
    this.pos = new p5.Vector(x * cellWidth, y * cellWidth);
    this.x = x;
    this.y = y;
    this.cellX = x;
    this.cellY = y;
    // this.container = elem;
    this.animalsHere = [];
    this.latitude = (this.y / (height / cellWidth) - 0.5) * 2;
    this.genes = {
      foodIncrease: 30,
    };

    // this.elem = document.createElement("cell");
    // this.elem.style.width = cellWidth + "px";
    // this.elem.style.height = cellWidth + "px";
    // this.elem.style.left = x * cellWidth + "px";
    // this.elem.style.top = y * cellWidth + "px";

    // this.elem.classList.add("cell");
    // this.elem.setAttribute("x", x);
    // this.elem.setAttribute("y", y);
    // this.container.appendChild(this.elem);
    // this.elem.onclick = (e) => {
    //   console.log("# CLICK ON CELL", this);
    //   // for (let a of animals) {
    //   //   a.target = this;
    //   // }
    // };

    this.typesOfSoil = ["grass", "dirt", "grass2"];

    this.type = Math.floor(Math.random() * this.typesOfSoil.length);

    if (Math.random() > 1 - PERCENTAGE_OF_ROCK_FLOOR) this.type = 1;

    if (this.type == 1) this.maxFood = 0;
    else this.maxFood = this.getMaxFood();

    this.food = Number(this.maxFood);

    /////definition of stuff:
  }
  removeMe(who) {
    if (USE_QUADTREE) return;
    let where;
    for (let i = 0; i < this.animalsHere.length; i++) {
      let a = this.animalsHere[i];
      if (a == who) {
        this.animalsHere.splice(i, 1);
        break;
      }
    }
  }
  addMe(who) {
    if (USE_QUADTREE) return;
    // console.log("# add me", this, who);
    let areYouHere = false;
    for (let a of this.animalsHere) {
      if (a == who) {
        areYouHere = true;
        break;
      }
    }
    if (!areYouHere) {
      this.animalsHere.push(who);
    }
  }

  getNeighbours() {
    if (this.neighbours) return this.neighbours;
    let arrRet = [];
    let x = this.x;
    let y = this.y;
    try {
      arrRet.push(grid[y - 1][x - 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[y - 1][x]);
    } catch (e) {}
    try {
      arrRet.push(grid[y - 1][x + 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[y][x - 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[y][x + 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[y + 1][x - 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[y + 1][x]);
    } catch (e) {}
    try {
      arrRet.push(grid[y + 1][x + 1]);
    } catch (e) {}

    if (y == 0) {
      try {
        arrRet.push(grid[grid.length - 1][x - 1]);
      } catch (e) {}
      try {
        arrRet.push(grid[grid.length - 1][x]);
      } catch (e) {}
      try {
        arrRet.push(grid[grid.length - 1][x + 1]);
      } catch (e) {}
    }
    if (y == grid.length - 1) {
      try {
        arrRet.push(grid[0][x - 1]);
      } catch (e) {}
      try {
        arrRet.push(grid[0][x]);
      } catch (e) {}
      try {
        arrRet.push(grid[0][x + 1]);
      } catch (e) {}
    }

    if (x == 0) {
      try {
        arrRet.push(grid[y - 1][grid[0].length - 1]);
      } catch (e) {}
      try {
        arrRet.push(grid[y][grid[0].length - 1]);
      } catch (e) {}
      try {
        arrRet.push(grid[y + 1][grid[0].length - 1]);
      } catch (e) {}
    }
    if (x == grid[0].length - 1) {
      try {
        arrRet.push(grid[y - 1][0]);
      } catch (e) {}
      try {
        arrRet.push(grid[y][0]);
      } catch (e) {}
      try {
        arrRet.push(grid[y + 1][0]);
      } catch (e) {}
    }

    let ret = arrRet.filter((k) => k);
    this.neighbours = ret;
    return ret;
  }

  getPos() {
    return new p5.Vector(
      this.pos.x + this.cellWidth / 2,
      this.pos.y + this.cellWidth / 2
    );
  }

  // color(col) {
  //   this.elem.style.backgroundColor = col;
  // }

  getMaxFood() {
    return Math.floor(Math.random() * MAX_FOOD_OF_CELLS * 0.1);
  }

  getGrowthAccordingToSeason = () => {
    let tempGrowth = Math.sin(this.FRAMENUM / SEASON_YEAR_DURATION);
    tempGrowth *= this.latitude;
    tempGrowth *= this.genes.foodIncrease;
    if (this.type == 2) tempGrowth *= -1;
    this.growth = tempGrowth; //+ this.genes.foodIncrease
    return this.growth;
  };

  grow() {
    this.food += this.genes.foodIncrease;
    if (this.food >= this.maxFood * COEF_OF_MAX_FOOD_TO_REPRODUCE) {
      let neighs = this.getNeighbours();
      //console.log(neighs);
      for (let n of neighs) {
        if (n.type == 1) {
          //IF THE CELL IS ROCK, CONVERT IT
          n.type = this.type;
          if (!n.maxFood) n.maxFood = this.getMaxFood();
        }
        if (n.type == this.type) {
          this.food += this.genes.foodIncrease;
        }
      }
    }
  }
  getAnimalsHereWithQuadtree() {
    let tempResult = tree.retrieve({
      x: this.pos.x,
      y: this.pos.y,
      width: this.cellWidth - 1,
      height: this.cellWidth - 1,
    });
    this.animalsHere = tempResult.map((k) => k.animal);
  }

  tick(FRAMENUM) {
    this.FRAMENUM = FRAMENUM;

    //if (this.type == 1) return;
    //EVERY 10 FRAMES THEY GET 1 MORE FOOD, WHEN THEY GET TO THE LIMIT THEY GROW OUTWARDS
    if (this.food <= 0) this.type = 1;

    if (Math.floor(Math.random() * CELLCLOCK_TO_REPRODUCE_GRASS) == 0) {
      this.grow();
      this.food += this.getGrowthAccordingToSeason();
    }
    // }
    this.checkCorpsesHere();

    if (this.food < 0) this.food = 0;
    if (this.food > this.maxFood) this.food = this.maxFood;

    if (USE_QUADTREE) this.getAnimalsHereWithQuadtree();

    //DEBUG STUFF:
    //   if (this == grid[0][0]) console.log(this.getGrowthAccordingToSeason());
  }

  checkCorpsesHere() {
    if (Math.floor(Math.random() * CELLCLOCK_TO_REPRODUCE_GRASS) == 0) {
      let dead = this.animalsHere.filter((k) => k.dead);

      for (let animal of dead) {
        let howMuchMoreFood =
          animal.decomposition *
          animal.size *
          COEF_FERTILIZATION_OF_DEAD_ANIMALS;

        this.food += howMuchMoreFood;
        //THIS MAKES NEW GRASS IF IT WAS DESERT, FROMT HE TYPE OF FOOD THE ANIMAL ATE
        if (this.food > this.maxFood * 0.1 && this.type == 1)
          this.type = animal.props.myTypeOfFood;
      }
    }
  }

  getColor() {
    // if (
    //   ((animals[0] || {}).closeCells || []).filter((k) => k == this).length > 0
    // ) {
    //   return "blue";
    // }
    if (this.type == 1) return "rgba(0,0,0,0)";
    this.coefOpacity = this.food / MAX_FOOD_OF_CELLS;
    if (this.type == 0) {
      return "rgb(0, " + (this.coefOpacity * 200 + 50).toFixed(0) + ", 0)";
    } else if (this.type == 2) {
      return (
        "rgb(" +
        (this.coefOpacity * 200 + 50).toFixed(0) +
        ", " +
        (this.coefOpacity * 20).toFixed(0) +
        ", " +
        (this.coefOpacity * 150 - 50).toFixed(0) +
        ")"
      );
    }
  }

  render(FRAMENUM) {
    ctx.beginPath();

    ctx.rect(this.pos.x, this.pos.y, this.cellWidth + 1, this.cellWidth + 1);
    ctx.fillStyle = this.getColor();
    ctx.fill();
    ctx.closePath();
    // if (this.type == 1) this.elem.style.backgroundColor = "gray";

    // if (this.type != 1) {
    //   this.coefOpacity = this.food / this.maxFood;
    //   this.elem.innerHTML =
    //     Math.floor(this.food) + "/" + Math.floor(this.maxFood);
    //   if (this.type == 0) {
    //     //grass
    //     let bgVal = "rgba(0,255,0," + this.coefOpacity.toFixed(5) + ")";

    //     this.elem.style.backgroundColor = bgVal;
    //   } else if (this.type == 2) {
    //     //berries
    //     if (this.type == 2) {
    //       //grass
    //       let bgVal = "rgba(255,0,0," + this.coefOpacity.toFixed(5) + ")";

    //       this.elem.style.backgroundColor = bgVal;
    //     }
    //   }
    // }

    // if (this.type == 0 && this.food == 0) {
    //   this.type = 1;
    //   this.elem.style.opacity = 1;
    // }
  }
}
