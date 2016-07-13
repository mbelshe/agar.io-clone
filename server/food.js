"use strict";

import Config from '../config.json';
import GameObject from './gameObject.js';
import Util from './lib/util';

var foodCount = 0;

class Food extends GameObject {
  static get count() {
    return foodCount;
  };

  static get mass() {
    return foodCount * Config.foodMass;
  };

  static addFood(foodToAdd) {
    while (foodToAdd--) {
      const radius = Util.massToRadius(Config.foodMass);
      const position = Util.uniformPosition(Config.gameBoard.objects, radius);
      new Food(position.x, position.y);
    }
  }

  static removeFood(foodToRemove) {
    // TODO: implement me

    while (foodToRemove--) {
      food.pop();
    }

  }

  constructor(x, y) {
    super('F' + foodCount++);  // Give all food objects the identifier "F<XXXX>"
    this.type = 'food';

    this.x = x;
    this.y = y;
    this.radius = Util.massToRadius(Config.foodMass);
    this._mass = Config.foodMass;
    this.hue = Math.round(Math.random() * 360);
    Config.gameBoard.insert(this);
  }

  get mass() {
    return this._mass;
  }

  eat() {
    foodCount--;
    Config.gameBoard.remove(this.id);
  }
  
  toJSON() {
    return {
      type: this.type,
      radius: this.radius,
      mass: this.mass,
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      hue: this.hue,
    };
  }
};

export default Food;
