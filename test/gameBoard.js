/*jshint expr:true */

import GameObject from '../server/gameObject';
import GameBoard from '../server/gameBoard';

var expect = require('chai').expect;

/**
 * Tests for server/gameBoard.js
 */

describe('gameBoard.js', function () {

  describe('GameBoard', function () {
    let gb;
    it('should create gameboard', function () {
      gb = new GameBoard();
      // Create a gameboard
      expect(gb).to.not.be.undefined;
    });

    it('should insert object', function () {
      let obj = new GameObject(gb, 1);
      obj.x = obj.y = 10;
      expect(gb.insert(obj)).to.be.true;
      let objects = gb.objects;
      expect(objects.length).to.be.eq(1);
    });

    it('should insert another object', function () {
      let obj = new GameObject(gb, 2);
      obj.x = obj.y = 20;
      expect(gb.insert(obj)).to.be.true;
      let objects = gb.objects;
      expect(objects.length).to.be.eq(2);
    });

    it('should not insert duplicate object', function () {
      let obj = new GameObject(gb, 1);
      expect(gb.insert(obj)).to.be.false;
    });

    it('should remove object', function () {
      expect(gb.remove(1)).to.be.true;
    });

    it('should not double remove object', function () {
      expect(gb.remove(1)).to.be.false;
    });

    it('should findObjectById object', function () {
      let obj = gb.findObjectById(2);
      expect(obj).to.not.be.undefined;
      expect(obj.id).to.eq(2);

      let objects = gb.objects;
      expect(objects.length).to.be.eq(1);
      expect(objects[0].id).to.be.eq(2);
    });

    it('should find object', function () {
      let objs = gb.find({x:0, y:0, h:100, w:100});
      expect(objs).to.not.be.undefined;
      expect(objs.length).to.eq(1);
      expect(objs[0].x).to.eq(20);
      expect(objs[0].y).to.eq(20);
    });

    it('should not find object out of range', function () {
      let objs = gb.find({x:0, y:0, h:5, w:5});
      expect(objs).to.not.be.undefined;
      expect(objs.length).to.eq(0);
    });
  });
});
