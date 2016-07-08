"use strict";

const LeaderboardSize = 10;

class Leaderboard {
  constructor() {
    this._leaders = [];
    this._dirty = false;
  }

  // Return the current list of leaders
  get leaders() {
    return this._leaders;
  }

  // Return true if the leaders list has changed
  get dirty() {
    return this._dirty;
  }

  // Set the dirty bit to false
  clearDirty() {
    this._dirty = false;
  }
  
  update(player) {
    this.remove(player);

    for (let index = 0; index < this.leaders.length; ++index) {
      let leader = this.leaders[index];
      if (leader.score < player.mass) {
        var newLeader = {
          id: player.id,
          name: player.name,
          score: player.mass
        };
        this.leaders.splice(index, 0, newLeader);  // Insert into the list.
        this._dirty = true;
        if (this.leaders.length > LeaderboardSize) {
          this.leaders.pop();
        }
        return;
      }
    }
    if (this.leaders.length < LeaderboardSize) {
      var newLeader = {
        id: player.id,
        name: player.name,
        score: player.mass
      };
      this.leaders.push(newLeader);
      this._dirty = true;
    }
  }

  remove(player) {
    for (let index = 0; index < this.leaders.length; ++index) {
      let leader = this.leaders[index];
      if (leader.id == player.id) {
        this.leaders.splice(index, 1);  // Remove from list;
        this._dirty = true;
        break;
      }
    }
  }
};

export default Leaderboard;
