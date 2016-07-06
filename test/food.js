import GameObject from '../server/gameObject';
import GameBoard from '../server/gameBoard';
import Food from '../server/food';
import Config from '../config.json';

var expect = require('chai').expect;

/**
 * Tests for server/food.js
 */

describe('food.js', function() {
  Config.gameBoard = new GameBoard();
  
  describe('Food', function() {
    let foodList = [];

    it('should create a new food', function () {
      foodList.push(new Food(1));
      expect(Food.count).to.be.eq(1);
      expect(Food.mass).to.be.eq(Config.foodMass);
    });

    it('should create a second food', function () {
      foodList.push(new Food(2));
      expect(Food.count).to.be.eq(2);
      expect(Food.mass).to.be.eq(2 * Config.foodMass);
    });

    it('should eat food', function () {
      var food = foodList.pop();
      food.eat();
      expect(Food.count).to.be.eq(1);
      expect(Food.mass).to.be.eq(1 * Config.foodMass);

      food = foodList.pop();
      food.eat();
      expect(Food.count).to.be.eq(0);
      expect(Food.mass).to.be.eq(0);
    });
  });
  
});
