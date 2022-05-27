class Cell {
  constructor(y, x, cellWidth, elem) {
    this.cellWidth = cellWidth;
    this.x = x;
    this.y = y;
    this.container = elem;
    this.animalsHere = [];

    this.elem = document.createElement("cell");
    this.elem.style.width = cellWidth + "px";
    this.elem.style.height = cellWidth + "px";
    this.elem.style.left = x * cellWidth + "px";
    this.elem.style.top = y * cellWidth + "px";

    this.elem.classList.add("cell");
    this.elem.setAttribute("x", x);
    this.elem.setAttribute("y", y);
    this.container.appendChild(this.elem);
    this.elem.onclick = (e) => {
      console.log("# CLICK ON CELL", this);
      // for (let a of animals) {
      //   a.target = this;
      // }
    };

    this.typesOfSoil = ["grass", "dirt", "berries"];

    this.type = Math.floor(Math.random() * this.typesOfSoil.length);

    if (Math.random() > 1 - PERCENTAGE_OF_ROCK_FLOOR) this.type = 1;

    if (this.type == 1) this.maxFood = 0;
    else this.maxFood = Math.floor(Math.random() * MAX_FOOD_OF_CELLS);

    this.food = Number(this.maxFood);
    /////definition of stuff:
  }
  removeMe(who) {
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
    let arrRet = [];
    try {
      arrRet.push(grid[this.y - 1][this.x - 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[this.y - 1][this.x]);
    } catch (e) {}
    try {
      arrRet.push(grid[this.y - 1][this.x + 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[this.y][this.x - 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[this.y][this.x + 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[this.y + 1][this.x - 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[this.y + 1][this.x]);
    } catch (e) {}
    try {
      arrRet.push(grid[this.y + 1][this.x + 1]);
    } catch (e) {}
    return arrRet.filter((k) => k);
  }

  getPos() {
    return new p5.Vector(
      this.x * this.cellWidth + this.cellWidth / 2,
      this.y * this.cellWidth + this.cellWidth / 2
    );
  }

  color(col) {
    this.elem.style.backgroundColor = col;
  }

  tick(FRAMENUM) {
    if (this.type == 1) return;
    //EVERY 10 FRAMES THEY GET 1 MORE FOOD, WHEN THEY GET TO THE LIMIT THEY GROW OUTWARDS
    if (Math.floor(Math.random() * CELLCLOCK_TO_REPRODUCE) == 0) {
      this.food++;
      if (this.food >= this.maxFood) {
        this.food = this.maxFood;
        let neighs = this.getNeighbours();
        //console.log(neighs);
        for (let n of neighs) {
          if (n.type == 1) {
            //IF THE CELL IS ROCK, CONVERT IT
            n.type = 0;
            if (!n.MaxFood) n.maxFood = Math.random() * MAX_FOOD_OF_CELLS;
          }
          if (n.type == 0) {
            n.food++;
          }
        }
      }
    }
    if (this.food < 0) this.food = 0;
  }

  render(FRAMENUM) {
    if (this.type == 1) this.elem.style.backgroundColor = "gray";

    if (this.type != 1) {
      this.coefOpacity = this.food / this.maxFood;
      this.elem.innerHTML =
        Math.floor(this.food) + "/" + Math.floor(this.maxFood);
      if (this.type == 0) {
        //grass
        let bgVal = "rgba(0,255,0," + this.coefOpacity.toFixed(5) + ")";

        this.elem.style.backgroundColor = bgVal;
      } else if (this.type == 2) {
        //berries
        if (this.type == 2) {
          //grass
          let bgVal = "rgba(255,0,0," + this.coefOpacity.toFixed(5) + ")";

          this.elem.style.backgroundColor = bgVal;
        }
      }
    }

    // if (this.type == 0 && this.food == 0) {
    //   this.type = 1;
    //   this.elem.style.opacity = 1;
    // }
  }
}
