"use strict";

const LeaderboardSize = 10;

class Leaderboard {
  constructor() {
    this.leaders = [];
  }

  get leaderboard() {
    return this.leaders;
  }
  
  update(player) {
    this.remove(player);

    for (let index = 0; index < this.leaders.length; ++index) {
      let leader = this.leaders[index];
      if (leader.score < player.massTotal) {
        var newLeader = {
          id: player.id,
          name: player.name,
          score: player.massTotal
        };
        this.leaders.splice(index, 0, newLeader);  // Insert into the list.
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
        score: player.massTotal
      };
      this.leaders.push(newLeader);
    }
  }

  remove(player) {
    for (let index = 0; index < this.leaders.length; ++index) {
      let leader = this.leaders[index];
      if (leader.id == player.id) {
        this.leaders.splice(index, 1);  // Remove from list;
        break;
      }
    }
  }
};

export default Leaderboard;
