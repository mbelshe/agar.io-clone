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
/*
    while (foodToRemove--) {
      food.pop();
    }
*/
  }

  constructor(x, y) {
    super('F' + foodCount++);  // Give all food objects the identifier "F<XXXX>"
    this.type = 'food';

    this.x = x;
    this.y = y;
    this.radius = Util.massToRadius(Config.foodMass);
    this.mass = Config.foodMass;
    this.hue = Math.round(Math.random() * 360);
    Config.gameBoard.insert(this);
  }

  eat() {
    foodCount--;
    Config.gameBoard.insert(this.id);
  }
};

export default Food;
