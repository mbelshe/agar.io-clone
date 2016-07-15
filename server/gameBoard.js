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
    this.qt.put(gameObject);
    this.gameObjects[gameObject.id] = gameObject
    return true;
  }

  // Update the gameObject.
  // gameObject's x/y/h/w must exactly match the prior value already in the quadtree.
  // After this function is called, gameObject's x/y/h/w will be set to position.
  update(gameObject, position) {
    if ((!position.x || position.x == gameObject.x) &&
        (!position.y || position.y == gameObject.y) &&
        (!position.h || position.h == gameObject.h) &&
        (!position.w || position.w == gameObject.w)) {
      return;
    }

    // TODO: Fix the quadtree.  The simple-quadtree library has bugs in update.
    // this.qt.update(gameObject, 'id', position);
    this.qt.remove(gameObject, 'id');
    if (position.x) {
      gameObject.x = position.x;
    }
    if (position.y) {
      gameObject.y = position.y;
    }
    if (position.h) {
      gameObject.h = position.h;
    }
    if (position.w) {
      gameObject.w = position.w;
    }
    this.qt.put(gameObject);
  }

  // Remove a GameObject to the board.
  // Returns true if deleted or false otherwise.
  remove(id) {
    let object = this.gameObjects[id];
    if (object === undefined) {
      return false;
    }

    var objToRemove = this.gameObjects[id];
    this.qt.remove(objToRemove, 'id');
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
