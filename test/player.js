import GameObject from '../server/gameObject';
import GameBoard from '../server/gameBoard';

var expect = require('chai').expect;

/**
 * Tests for server/player.js
 */

describe('player.js', function() {
	
	describe('Player', function() {
		let player;
		it('should create a new player', function () {
			player = new Player();
			//create a new Player
			expect(player).to.not.be.undefined;
		});
		
	it('should return the totalPlayerMass', function() {
		expect(getTotalPlayerMass()).to.be.eq(totalPlayerMass);
		
		});
	
	it('should set mass of the player and update total player mass', function() {
		player.setMass(5);
		expect(player.massTotal).to.be.eq(5);
		expect(totalPlayerMass).to.be.eq(player.massTotal);
		
	});
	
	it('should kill the player and update mass', function() {
		massMinusPlayer = totalPlayerMass - player.massTotal;
		player.die();
		expect(player.massTotal).to.be.eq(0);
		expect(totalPlayerMass).to.be.eq(massMinusPlayer);
		
		
	});
	
	it('should return the number of players', function() {
		expect(getPlayerCount()).to.be.eq(playerCount);
		
	});
	
	it('should resize the player',function() {
		//TODO: create dimension object
		player.resize()
		expect(player.w).to.be.eq(dim.w);
		expect(player.h).to.be.eq(dim.h);
		
	});
		
		
		
		
	});
	
});