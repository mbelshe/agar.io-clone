"use strict";

import GameObject from './gameObject.js';
import Config from '../config.json';

var foodCount = 0;

class Food extends GameObject {
  static get count() {
    return foodCount;
  };

  static get mass() {
    return foodCount * Config.foodMass;
  };

  static addFood(foodToAdd) {
/*
    const radius = Util.massToRadius(Config.foodMass);
    while (foodToAdd--) {
      const position = Config.foodUniformDisposition ? Util.uniformPosition(food, radius) : Util.randomPosition(radius);
      food.push({
        // Make IDs unique.
        id: ((new Date()).getTime() + '' + food.length) >>> 0,
        x: position.x,
        y: position.y,
        radius: radius,
        mass: Math.random() + 2,
        hue: Math.round(Math.random() * 360)
      });
    }
*/
  }

  static removeFood(foodToRemove) {
/*
    while (foodToRemove--) {
      food.pop();
    }
*/
  }

  constructor(position) {
    super('F' + foodCount++);  // Give all food objects the identifier "F<XXXX>"
  }

  eat() {
    foodCount--;
  }
};

export default Food;
