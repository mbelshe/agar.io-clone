import Config from '../config.json';
import BitGoAccount from '../server/BitGoAccount.js';

var BitGoJS = require('BitGo/src/index.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var assert = require('assert');
var should = require('should');
var Q = require('q');

var BitGoJS = require('../node_modules/bitgo/');
var common = require('../node_modules/bitgo/src/common');
var TestBitGo = require('../node_modules/bitgo/test/lib/test_bitgo');

var bitcoin = BitGoJS.bitcoin;

var TEST_WALLET_LABEL = 'wallet management test';
/**
 * Tests for server/BitGoAccount.js
 */

describe('BitGoAccount', function() {
  var BitGo;
  var username = '';
  var password = '';

// describe('#login()', function() {
  it('should login without error', function(done) {
  //  this.timeout(0);
    BitGo = new BitGoAccount(username, password);
    BitGo.login(function (error, response) {
      if(response === undefined) {
        done("login failed"); // HTTP Authentication Error
      } else {
        done();
      }
    });
  });
 
  it('should not login', function(done) {
    var BitGo1 = new BitGoAccount('ldasjflkej', 'fasd');
    BitGo1.login(function (error, response) {
      if(response === undefined) {
       done(); // HTTP Authentication Error
      } else {
       done("It logged in, which is an error");
      }
    });
  });

 // it('should logout', function() {
 //    var BitGo2 = new BitGoAccount(username, password);
 //    BitGo2.login();
 //    BitGo2.logout();
 // });

  describe('Wallets', function() {
  var bitgo;
  var wallets;
  var testWallet;      // Test will create this wallet
  var keychains = [];  // Test will create these keychains

  before(function(done) {
    bitgo = new BitGoAccount(username, password);
    wallets = bitgo.getWalletList(function (error, walletResponse) {
      if(walletResponse === undefined) {
        done("No wallets found(Error)");
      } else {
        done();
      }
    });
    bitgo.login();
  });

  describe('List', function() {
    it('arguments', function() {
      assert.throws(function() { wallets.list({}, 'invalid'); });
      assert.throws(function() { wallets.list('invalid'); });
    });

    it('all', function(done) {
      wallets.list({}, function(err, result) {
        assert.equal(err, null);
        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(0);
        result.limit.should.not.equal(0);
        result.total.should.not.equal(0);
        result.wallets.length.should.not.equal(0);
        done();
      });
    });

    it('prevId', function() {
      return wallets.list({})
      .then(function(result) {
        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');
        result.should.have.property('nextBatchPrevId');

        return wallets.list({prevId: result.nextBatchPrevId});
      })
      .then(function(result) {
        result.should.have.property('wallets');
        result.should.not.have.property('start'); // if you passed in the prevId start will be undefined
        result.should.have.property('limit');
        result.should.have.property('total');
      });
    });

    it('limit', function(done) {
      wallets.list({ limit: 2 }, function(err, result) {
        assert.equal(err, null);

        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(0);
        result.limit.should.equal(2);
        result.total.should.not.equal(0);
        result.wallets.length.should.equal(2);
        done();
      });
    });

    it('skip', function(done) {
      wallets.list({ limit: 1, skip: 2 }, function(err, result) {
        assert.equal(err, null);

        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(2);
        result.limit.should.equal(1);
        result.total.should.not.equal(0);
        result.wallets.length.should.equal(1);
        done();
      });
    });

    it('limit and skip', function(done) {
      wallets.list({ limit: 1, skip: 5 }, function(err, result) {
        assert.equal(err, null);

        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(5);
        result.limit.should.equal(1);
        result.total.should.not.equal(0);
        result.wallets.length.should.equal(1);
        done();
      });
    });
  });
});
});
// it('should transfer BTC', function() {
 //   var BitGo = new BitGoAccount(username, password);
 //   BitGo.transfer(Config.amountForKill, BitGo);
 //   expect(BitGo).to.not.be.undefined;
 //   expect(BitGo.getWalletList()).toNotThrow("BitGo getting wallet list failed");
 //   expect(BitGo.transfer()).toNotThrow("BitGo transfer didn't work");
    // NOTES:  These tests should only use the BitGoAccount class.
//  });

  //testPromise();
//});