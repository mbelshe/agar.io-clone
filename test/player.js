import GameObject from '../server/gameObject';
import GameBoard from '../server/gameBoard';
import Player from '../server/player';
import Config from '../config.json';

var expect = require('chai').expect;

/**
 * Tests for server/player.js
 */

describe('player.js', function() {
  Config.gameBoard = new GameBoard();
  
  describe('Player', function() {
    let player;

    it('should have zero totals to start', function() {
      expect(Player.mass).to.be.eq(0);
      expect(Player.count).to.be.eq(0);
    });

    it('should create a new player', function () {
      player = new Player(1, undefined, 'aniketh', {x: 0, y: 0});
      expect(player).to.not.be.undefined;
      expect(Player.mass).to.be.eq(Config.defaultPlayerMass);
      expect(Player.count).to.be.eq(1);
    });
    
    it('should return the totalPlayerMass for two players', function() {
      let player2 = new Player(2, undefined, 'mike', {x: 0, y: 0});
      expect(Player.mass).to.be.eq(2 * Config.defaultPlayerMass);
      player2.die();
      expect(Player.mass).to.be.eq(1 * Config.defaultPlayerMass);
      expect(Player.count).to.be.eq(1);
    });
  
    it('should set mass of the player and update total player mass', function() {
      player.mass = 5;
      expect(player.mass).to.be.eq(5);
      expect(Player.mass).to.be.eq(player.mass);
    });
  
    it('should kill the player and update mass', function() {
      player.die();
      expect(Player.mass).to.be.eq(0);
      expect(Player.count).to.be.eq(0);
    });
  
    it('should return the number of players', function() {
      expect(Player.count).to.be.eq(0);
    });
  
    it('should resize the player',function() {
      var dim = {w: 500, h: 400};
      player.resize(dim);
      expect(player.w).to.be.eq(dim.w);
      expect(player.h).to.be.eq(dim.h);
    });

    it('should have no active players', function() {
      var allPlayers = Player.allPlayers;
      expect(Object.keys(Player.players).length).to.be.eq(0);
    });
    it('spawn should create active players', function() {
      player.spawn();
      expect(Object.keys(Player.players).length).to.be.eq(1);
      expect(Player.players[player.id]).to.not.be.undefined;
    });
    it('die should remove active players', function() {
      player.die();
      expect(Object.keys(Player.players).length).to.be.eq(0);
    });
  });

  describe('Player', function() {
    let player;
    it('should get leaderboard',function() {
      player = new Player(3, undefined, 'leader', {x: 0, y: 0});
      let leaderboard = Player.leaderboard.leaders;
      expect(leaderboard.length).to.be.eq(1);
      expect(leaderboard[0].id).to.be.eq(player.id);
    });

    it('should get two players in leaderboard',function() {
      let player2 = new Player(4, undefined, 'leader', {x: 0, y: 0});
      let leaderboard = Player.leaderboard.leaders;
      expect(leaderboard.length).to.be.eq(2);
      expect(leaderboard[0].id).to.be.eq(player.id);
      expect(leaderboard[1].id).to.be.eq(player2.id);
      expect(leaderboard[0].score).to.be.eq(leaderboard[1].score);
    });

    it('should insert new leader', function() {
      let player3 = new Player(5, undefined, 'leader', {x: 0, y: 0});
      player3.mass = 100;
      let leaderboard = Player.leaderboard.leaders;
      expect(leaderboard.length).to.be.eq(3);
      expect(leaderboard[0].id).to.be.eq(player3.id);
    });

    it('should max out leaderboard', function() {
      let players = [];
      for (var index = 0; index < 20; ++index) {
        let player = new Player(100 + index, undefined, 'leader', {x: 0, y: 0});
        player.mass = 1000 + index;
        let leaderboard = Player.leaderboard.leaders;
        expect(leaderboard.length).to.be.eq(Math.min(4 +index, 10));
        expect(leaderboard[0].id).to.be.eq(player.id);
        players.push(player);
      }
      for (var index = 0; index < 20; ++index) {
        players[index].die();
      }
      expect(Player.leaderboard.leaders.length).to.be.eq(0);
    });

    it('should be dirty', function() {
      expect(Player.leaderboard.dirty).to.be.true;
    });

    it('should clear dirty', function() {
      Player.leaderboard.clearDirty();
      expect(Player.leaderboard.dirty).to.be.false;
    });

    it('should be dirty after insert', function() {
      new Player(55, undefined, 'leader', {x: 0, y: 0});
      expect(Player.leaderboard.dirty).to.be.true;
    });

    it('should be dirty after remove', function() {
      Player.leaderboard.clearDirty();
      expect(Player.leaderboard.dirty).to.be.false;
      Player.leaderboard.remove({id: 55});
      expect(Player.leaderboard.dirty).to.be.true;
    });
  });
});
