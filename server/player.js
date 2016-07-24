"use strict";

import Cell from './cell';
import Config from '../config.json';
import Leaderboard from './leaderboard';
import Util from './lib/util';
import GameEvents from './gameEvents.js';

const initMassLog = Util.log(Config.defaultPlayerMass, Config.slowBase);

var totalMass = 0;
var totalCount = 0;
var leaders = new Leaderboard();
var activePlayers = {};

class Player {
  static get mass() {
    return totalMass;
  };

  static get count() {
    return totalCount;
  };

  static get leaderboard() {
    return leaders;
  }

  // Returns a map of all active players.
  // The map maps from player.id to the player object.
  static get players() {
    return activePlayers; 
  }

  constructor(id, socket, name, position) {
    this.id = id;
    this.socket = socket;
    this.name = name;
    this.type = 'player';
    this.cells = [];
    this.mass = 0;
    this.admin = false;

    // The x/y/w/h is the user's view into the gameboard
    this.x = position.x;
    this.y = position.y;
    this.w = Config.gameWidth;
    this.h = Config.gameHeight;

    this.hue = Math.round(Math.random() * 360);
    this.lastHeartBeat = +new Date();
    this.target = {
      x: 0,
      y: 0
    };
    totalCount++;
  }

  set name(value) {
    this._name = value;
    leaders.update(this);  // Update scores to show the new name
  }

  get name() {
    return this._name;
  }
  
  set mass(x) {
    if (!this._mass) {  // may have been undefined
      this._mass = 0;
    }
    totalMass += (x - this._mass);
    this._mass = x;
    leaders.update(this);
  };

  get mass() {
    return this._mass;
  }

  spawn() {
    // Create our first cell.
    let firstCell = new Cell(this, this.x, this.y, Config.defaultPlayerMass, Config.initialSpeed, this.hue);
    this.cells.push(firstCell);
    this.mass = Config.defaultPlayerMass;

    // Add to global tables.
    activePlayers[this.id] = this;
  }

  die() {
    if (activePlayers[this.id] == undefined) {
      console.log("ERROR: Player.die() called for player already dead.");
    }

    // Remove all cells from gameboard.
    if (this.cells.length > 0) {
      this.cells.forEach(function(cell) { cell.die(); });
      this.cells = [];
    }
  };

  canSplit() {
    return this.cells.length < Config.limitSplit && this.mass >= Config.defaultPlayerMass * 2;
  };

  splitCell(cell) {
    console.log("cell " + cell + "Cell mass: " + cell.mass);
    if (cell && cell.mass >= Config.defaultPlayerMass * 2) {
    cell.mass = cell.mass / 2;
    cell.radius = Util.massToRadius(cell.mass);
    new Cell(this, cell.x, cell.y, cell.mass, 25, cell.hue);
    }
  };

  splitAllCells() {
    if (this.cells.length < Config.limitSplit && this.mass >= Config.defaultPlayerMass * 2) {
      this.cells.forEach((c) => this.splitCell(c));
    }
  };

  onCellDied(deadCell) {
    // iterate the list of cells and find the dead cell
    for (let index = 0; index < this.cells.length; ++index) {
      if (this.cells[index].id == deadCell.id) {
        this.cells.splice(index, 1);
        break;
      }
    }
    if (this.cells.length == 0) {
      // Remove from global counters and set mass to zero.
      totalCount--;
      this.mass = 0;

      // Remove from leaderboard.
      leaders.remove(this);

      // Remove from active players list.
      delete activePlayers[this.id];
      
      if(this.socket) {
        this.socket.emit(GameEvents.RIP);
      }
    }
  };

  heartbeat(target) {
    this.lastHeartbeat = new Date().getTime();
    const {x, y} = target;
    if (x !== this.x || y !== this.y) {
      this.target = target;
    }
  };

  resize(dim) {
    var newPosition = { h: dim.h, w: dim.w };
    this.w = dim.w;
    this.h = dim.h;
  };

  move() {
    let x = 0;
    let y = 0;

    this.cells.forEach((cell, i) => {
      const target = {
        x: this.x - cell.x + this.target.x,
        y: this.y - cell.y + this.target.y,
      };

      cell.move(target);

      // Find best solution.
      this.cells.forEach((c, j) => {
        if (j !== i && cell !== undefined) {
          const distance = Math.sqrt(Math.pow(c.y - cell.y, 2) + Math.pow(c.x - cell.x, 2));
          const radiusTotal = (cell.radius + c.radius);
          if (distance < radiusTotal) {
            if (this.lastSplit > new Date().getTime() - 1000 * Config.mergeTimer) {
              if (cell.x < c.x) {
                cell.x--;
              } else if (cell.x > c.x) {
                cell.x++;
              }
              if (cell.y < c.y) {
                cell.y--;
              } else if ((cell.y > c.y)) {
                cell.y++;
              }
            } else if (distance < radiusTotal / 1.75) {
              cell.mass += c.mass;
              cell.radius = Util.massToRadius(cell.mass);
              this.cells.splice(j, 1);
            }
          }
        }
      });
      if (this.cells.length > i) {
        const borderCalc = cell.radius / 3;
        if (cell.x > Config.gameWidth - borderCalc) {
          cell.x = Config.gameWidth - borderCalc;
        }
        if (cell.y > Config.gameHeight - borderCalc) {
          cell.y = Config.gameHeight - borderCalc;
        }
        if (cell.x < borderCalc) {
          cell.x = borderCalc;
        }
        if (cell.y < borderCalc) {
          cell.y = borderCalc;
        }
        x += cell.x;
        y += cell.y;
      }
    });

    var newPosition = { x: x / this.cells.length, y: y / this.cells.length };
    this.x = newPosition.x;
    this.y = newPosition.y;
  };

  // Return the client's representation of the Player object
  toJSON() {
    return {
      name: this.name,
      id: this.id,            // LEAKING ID IS A SECURITY HOLE
      type: this.type,
      mass: this.mass,
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      hue: this.hue,
      target: this.target
    };
  }

};

export default Player;
