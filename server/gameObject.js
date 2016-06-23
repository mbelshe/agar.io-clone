// GameObject.js
//
// All viewable objects in the game are of type GameObject.
//

"use strict";

class GameObject {
  constructor(id) {
    this.id = id;

    this.x = 0;
    this.y = 0;
    this.h = 0;
    this.w = 0;
  };
};

export default GameObject;
