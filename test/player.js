import GameObject from '../server/gameObject';
import GameBoard from '../server/gameBoard';
import Player from '../server/player';
import Config from '../config.json';

var expect = require('chai').expect;

/**
 * Tests for server/player.js
 */

describe('player.js', function() {
  
  describe('Player', function() {
    let player;

    it('should have zero totals to start', function() {
      expect(Player.mass).to.be.eq(0);
      expect(Player.count).to.be.eq(0);
    });

    it('should create a new player', function () {
      player = new Player(1, 'aniketh', {x: 0, y: 0}, 'player', 0);
      expect(player).to.not.be.undefined;
      expect(Player.mass).to.be.eq(Config.defaultPlayerMass);
      expect(Player.count).to.be.eq(1);
    });
    
    it('should return the totalPlayerMass for two players', function() {
      let player2 = new Player(2, 'mike', {x: 0, y: 0}, 'player', 0);
      expect(Player.mass).to.be.eq(2 * Config.defaultPlayerMass);
      player2.die();
      expect(Player.mass).to.be.eq(1 * Config.defaultPlayerMass);
      expect(Player.count).to.be.eq(1);
    });
  
    it('should set mass of the player and update total player mass', function() {
      player.massTotal = 5;
      expect(player.massTotal).to.be.eq(5);
      expect(Player.mass).to.be.eq(player.massTotal);
    });
  
    it('should kill the player and update mass', function() {
      player.die();
      expect(player.massTotal).to.be.eq(0);
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
    
  });
  
});
