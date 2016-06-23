// GameBoard.js
//
// Represents the game board we play on
//

"use strict";

import Config from '../config.json';
import SimpleQuadTree from 'simple-quadtree';

class GameBoard {
  constructor() {
    this.qt = SimpleQuadTree(0, 0, Config.gameWidth, Config.gameHeight)

    // A list of objects on the gameboard.
    this.gameObjects = {};
  };

  // Search the QuadTree for GameObjects.
  find(region) {
    return this.qt.get(region);
  }

  // Add a GameObject to the board.
  // Returns true if inserted or false otherwise.
  insert(gameObject) {
    if (this.gameObjects[gameObject.id] != undefined) {
      return false;
    }
console.log("GAMEBOARD: New Object " + gameObject.id + ', ' +  gameObject.x + ', ' + gameObject.y + ', ' + gameObject.h + ', ' + gameObject.w);
    this.qt.put(gameObject);
    this.gameObjects[gameObject.id] = gameObject
    return true;
  }

  // Remove a GameObject to the board.
  // Returns true if deleted or false otherwise.
  remove(id) {
    let object = this.gameObjects[id];
    if (object === undefined) {
      return false;
    }

    // Search the entire game board for the 'id' and remove it.
    // TODO:  If this returns all objects (searching the entire gameboard), then this is very inefficient.
    let region = {x: 0, y: 0, w: Config.gameWidth, h: Config.gameHeight, id: id};
    this.qt.remove(region, 'id');

    delete this.gameObjects[id];
    return true;
  }

  // Return the list of all objects on the board.
  get objects() {
    // TODO:  Reconstructing the list of objects may not be efficient for large numbers of objects.
    let result = [];
    var self = this;
    Object.keys(this.gameObjects).forEach(function(key) {
      result.push(self.gameObjects[key]);
    });
    return result;
  }

  // Find an object on the board by id.
  findObjectById(id) {
    return this.gameObjects[id];
  }
};

export default GameBoard;
