"use strict";

import Config from '../config.json';
import Util from './lib/util';
import GameObject from './gameObject';

const initMassLog = Util.log(Config.defaultPlayerMass, Config.slowBase);

let playerCount = 0;

class Player extends GameObject {
  constructor(id, name, position, type, speed) {
    super(id);
    this.name = name;
    this.type = type;

    this.radius = Util.massToRadius(Config.defaultPlayerMass);
    this.cells = [{
      mass: Config.defaultPlayerMass,
      x: position.x,
      y: position.y,
      radius: this.radius,
      speed: speed
    }];
    this.massTotal = Config.defaultPlayerMass;
    this.admin = false;
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
  }

  static get playerCount() {
    return playerCount;
  }

  heartbeat(target) {
    this.lastHeartbeat = new Date().getTime();
    const {x, y} = target;
    if (x !== this.x || y !== this.y) {
      this.target = target;
    }
  };

  resize(dim) {
    this.w = dim.w;
    this.h = dim.h;
  };

  move() {
    let x = 0;
    let y = 0;

    this.cells.forEach((cell, i) => {
      const target = {
        x: this.x - cell.x + this.target.x,
        y: this.y - cell.y + this.target.y
      };
      const dist = Math.sqrt(Math.pow(target.y, 2) + Math.pow(target.x, 2));
      const deg = Math.atan2(target.y, target.x);
      let slowDown = 1;
      if (cell.speed <= 6.25) {
        slowDown = Util.log(cell.mass, Config.slowBase) - initMassLog + 1;
      }

      let deltaY = cell.speed * Math.sin(deg) / slowDown;
      let deltaX = cell.speed * Math.cos(deg) / slowDown;

      if (cell.speed > 6.25) {
        cell.speed -= 0.5;
      }
      if (dist < (50 + cell.radius)) {
        deltaY *= dist / (50 + cell.radius);
        deltaX *= dist / (50 + cell.radius);
      }
      if (!isNaN(deltaY)) {
        cell.y += deltaY;
      }
      if (!isNaN(deltaX)) {
        cell.x += deltaX;
      }
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
    this.x = x / this.cells.length;
    this.y = y / this.cells.length;
  };
};

export default Player;
