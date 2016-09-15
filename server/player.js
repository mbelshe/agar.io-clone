"use strict";

import Cell from './cell';
import Config from '../config.json';
import Leaderboard from './leaderboard';
import Util from './lib/util';
import GameEvents from './gameEvents.js';
import BitGoAccount from './BitGoAccount.js';

const initMassLog = Util.log(Config.defaultPlayerMass, Config.slowBase);

var totalMass = 0;
var totalCount = 0;
var leaders = new Leaderboard();
var activePlayers = {};

class Player {
  static get mass() {
    return totalMass;
  };

  static get count() {
    return totalCount;
  };

  static get leaderboard() {
    return leaders;
  }

  // Returns a map of all active players.
  // The map maps from player.id to the player object.
  static get players() {
    return activePlayers; 
  }

  constructor(id, socket, name, position, email, password) {
    this.id = id;
    this.socket = socket;
    this.name = name;
    this.type = 'player';
    this.cells = [];
    this.mass = 0;
    this.admin = false;
    this.email = email;
    this.password = password;
    this.BitGoAccount = undefined;

    //for testing bitgo integration, credential is in form of email#password$walletName%walletPwd
    if(!Config.isProduction) {
      var tempName = '';
      if(tempName.search("#") > 0) {      
        var credentialArray = tempName.split("#");
        this.email = credentialArray[0];
        var passwordArray = credentialArray[1].split("$");
        this.password = passwordArray[0];
        var walletArray = passwordArray[1].split("%");
        var walletName = walletArray[0];
        var walletPwd = walletArray[1];
        this.BitGoAccount = new BitGoAccount(this.email, this.password);

        this.BitGoAccount.login();

        this.BitGoAccount.useWallet(walletName, walletPwd);
      }
    }
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
    leaders.update(this);
  };

  get mass() {
    return this._mass;
  }

  spawn() {
    // Create our first cell.
    let firstCell = new Cell(this, this.x, this.y, Config.defaultPlayerMass, Config.initialSpeed, this.hue);
    this.cells.push(firstCell);
    this.mass = Config.defaultPlayerMass;

    // Add to global tables.
    activePlayers[this.id] = this;
  }

  die() {
    if (activePlayers[this.id] == undefined) {
      console.log("ERROR: Player.die() called for player already dead.");
    }

    // Remove all cells from gameboard.
    if (this.cells.length > 0) {
      this.cells.forEach(function(cell) { cell.die(); });
      this.cells = [];
    }
  };

  canSplit() {
    return this.cells.length < Config.limitSplit && this.mass >= Config.defaultPlayerMass * 2;
  };

  splitAllCells() {
    if (this.canSplit()) {
      this.cells.forEach((cell) => cell.split());
    }
  };

  onCellDied(deadCell) {
    // iterate the list of cells and find the dead cell
    for (let index = 0; index < this.cells.length; ++index) {
      if (this.cells[index].id == deadCell.id) {
        this.cells.splice(index, 1);
        break;
      }
    }

    if (this.cells.length == 0) {
      // Remove from global counters and set mass to zero.
      totalCount--;
      this.mass = 0;

      // Remove from leaderboard.
      leaders.remove(this);
 
      // Remove from active players list.
      delete activePlayers[this.id];
      
      if(this.socket) {
        this.socket.emit(GameEvents.RIP);
      }
    }
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
    this.w = dim.w;
    this.h = dim.h;
  };

  move() {
    let x = 0;
    let y = 0;

    this.cells.forEach((cell) => {
      const target = {
        x: this.x - cell.x + this.target.x,
        y: this.y - cell.y + this.target.y,
      };

      cell.move(target);

      x += cell.x;
      y += cell.y;
    });

    // Set player position to the middle of the cell group.
    var newPosition = { x: x / this.cells.length, y: y / this.cells.length };
    this.x = newPosition.x;
    this.y = newPosition.y;

    this.mergeCells();
  };

  mergeCells() {
    // Iterate all cells and see if any should merge.
    for (let i = 0; i < this.cells.length; i++) {
      let cell1 = this.cells[i];
      
      for (let j = 0; j < this.cells.length; j++) {
        let cell2 = this.cells[j];
        if (j !== i) {
          const distance = Math.sqrt(Math.pow(cell2.y - cell1.y, 2) + Math.pow(cell2.x - cell1.x, 2));
          const radiusTotal = (cell1.radius + cell2.radius);
          if (distance < radiusTotal) {
            if (cell2.lastSplit > new Date() - 1000 * Config.mergeTimer) {
              let newPosition = { x: cell1.x, y: cell1.y };
              if (cell1.x < cell2.x) {
                newPosition.x--;
              } else if (cell1.x > cell2.x) {
                newPosition.x++;
              }
              if (cell1.y < cell2.y) {
                newPosition.y--;
              } else if ((cell1.y > cell2.y)) {
                newPosition.y++;
              }
              Config.gameBoard.update(cell1, newPosition);
              cell1.x = newPosition.x;
              cell1.y = newPosition.y;
            } else if (distance < radiusTotal / 1.75) {
              cell1.mass += cell2.mass;
              this.mass -= cell2.mass;
              cell1.radius = Util.massToRadius(cell1.mass);
              cell2.die();
              // cell2.die() can modify the cells array.
              // so we need to break out here.  We can merge more cells
              // on the next iteration.
              return;
            }
          }
        }
      }
    }
  };

  // Return the client's representation of the Player object
  toJSON() {
    return {
      name: this.name,
      id: this.id,            // LEAKING ID IS A SECURITY HOLE
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
