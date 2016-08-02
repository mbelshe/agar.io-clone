import GameObject from '../server/gameObject';
import GameBoard from '../server/gameBoard';
import HomeBase from '../server/homeBase';
import Config from '../config.json';

var expect = require('chai').expect;

/**
 * Tests for server/homeBase.js
 */

describe('homeBase.js', function() {
	Config.gameBoard = new GameBoard();

	describe("HomeBase", function() {
		let homeBase;

		it('should create a new home base', function() {
			homeBase = new HomeBase(1234, 987, 50);
			expect(homeBase).to.not.be.undefined;
			expect(homeBase.radius).to.be.eq(50);
			expect(homeBase.x).to.be.eq(1234);
			expect(homeBase.y).to.be.eq(987);
		});
	});
});
