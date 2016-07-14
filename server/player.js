"use strict";

import Cell from './cell';
import Config from '../config.json';
import Leaderboard from './leaderboard';
import GameObject from './gameObject';
import Util from './lib/util';

const initMassLog = Util.log(Config.defaultPlayerMass, Config.slowBase);

var totalMass = 0;
var totalCount = 0;
var leaders = new Leaderboard();

class Player extends GameObject {
  static get mass() {
    return totalMass;
  };

  static get count() {
    return totalCount;
  };

  static get leaderboard() {
    return leaders;
  }

  constructor(id, socket, name, position) {
    super(id);
    this.socket = socket;
    this.name = name;
    this.type = 'player';
    this.cells = [];
    this.mass = Config.defaultPlayerMass;
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

    let firstCell = new Cell(this, position.x, position.y,
                             Config.defaultPlayerMass, Config.initialSpeed, this.hue);
    this.cells.push(firstCell);
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
    this.radius = Util.massToRadius(this._mass);
    leaders.update(this);
  };

  get mass() {
    return this._mass;
  }

  spawn() {
    Config.gameBoard.insert(this);
  }

  die() {
    totalMass -= this._mass;
    this._mass = 0;
    totalCount--;
    Config.gameBoard.remove(this.id);
    leaders.remove(this);
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
    Config.gameBoard.update(this, newPosition);
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
    Config.gameBoard.update(this, newPosition);
    this.x = newPosition.x;
    this.y = newPosition.y;
  };

  // Return the client's representation of the Player object
  toJSON() {
    return {
      name: this.name,
      id: this.id,
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
