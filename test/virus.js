import GameObject from '../server/gameObject';
import GameBoard from '../server/gameBoard';
import Virus from '../server/virus';
import Config from '../config.json';

var expect = require('chai').expect;

/**
 * Tests for server/food.js
 */

 describe('virus.js', function() {
 	Config.gameBoard = new GameBoard();

 	describe('Virus', function() {
 		let virus;

 		it('should create a new virus', function () {
 			virus = new Virus(1234, 987, 56);
 			expect(virus).to.not.be.undefined;
 			expect(virus.mass).to.be.eq(56);
 			expect(virus.x).to.be.eq(1234);
 			expect(virus.y).to.be.eq(987);
 		});
 	});
 });