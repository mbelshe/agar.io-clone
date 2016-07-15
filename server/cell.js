"use strict";

import Config from '../config.json';
import Util from './lib/util';
import GameObject from './gameObject';

let cellId = 0;  // monotonically increasing cell id.
const initMassLog = Util.log(Config.defaultPlayerMass, Config.slowBase);

class Cell extends GameObject {
  constructor(player, x, y, mass, speed, hue) {
    super('C' + player.id + '.' + cellId++);
    this.player = player;
    this.type = 'cell';
    this.radius = Util.massToRadius(mass);
    this.x = x;
    this.y = y;
    this.h = this.radius * 2;
    this.w = this.radius * 2;
    this.mass = mass;
    this.speed = speed;
    this.hue = hue;

    Config.gameBoard.insert(this);
  }

  // Set cell mass.
  // Also update's the cell's player's mass.
  set mass(x) {
    if (!this._mass) {  // may have been undefined
      this._mass = 0;
    }
    let delta = x - this._mass;
    this._mass = x;
    this.radius = Util.massToRadius(this._mass);
    this.player.mass += delta;
  };

  get mass() {
    return this._mass;
  }
  
  die() {
    Config.gameBoard.remove(this.id);

    // TODO:  Tell Player object that cell died?
  }

  move(target) {
    let x = 0;
    let y = 0;

    const dist = Math.sqrt(Math.pow(target.y, 2) + Math.pow(target.x, 2));
    const deg = Math.atan2(target.y, target.x);
    let slowDown = 1;
    if (this.speed <= 6.25) {
      slowDown = Util.log(this.mass, Config.slowBase) - initMassLog + 1;
    }

    let deltaY = this.speed * Math.sin(deg) / slowDown;
    let deltaX = this.speed * Math.cos(deg) / slowDown;

    if (this.speed > 6.25) {
      this.speed -= 0.5;
    }
    if (dist < (50 + this.radius)) {
      deltaY *= dist / (50 + this.radius);
      deltaX *= dist / (50 + this.radius);
    }
    var newPosition = {};
    if (!isNaN(deltaY)) {
      this.y += deltaY;
      newPosition.y = this.y + deltaY;
    }
    if (!isNaN(deltaX)) {
      this.x += deltaX;
      newPosition.x = this.x + deltaX;
    }
    Config.gameBoard.update(this, newPosition);
    this.x = newPosition.x;
    this.y = newPosition.y;
  };

  toJSON() {
    return {
      id: this.id,
      player: this.player,
      type: this.type,
      mass: this._mass,
      radius: this.radius,
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      hue: this.hue
    };
  }
};

export default Cell;
