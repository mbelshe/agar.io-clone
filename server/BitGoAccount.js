"use strict";

import Config from '../config.json';

var BitGoJS = require('../node_modules/bitgo/src/index.js');

class BitGoAccount {
   constructor(email, password) {
  // 	this.user = undefined;
 //  	 this.params = {
//	   env: Config.BitGoConfig.authEnv
 //    };
  //   this.bitgo = new BitGoJS.BitGo(this.params);
     this.otp = '0000000'; //TODO: Need to put real otp
     this.username = email;
     this.password = password;
 //    this.loginResponse;
 //    this.walletPassphrase;
 //    this.currentWalletName;
 //    this.currentWalletPassword;
   }

  login(cb) {
  	var params = {
	   env: Config.BitGoConfig.authEnv
    };
    var bitgo = new BitGoJS.BitGo(params);
    bitgo.authenticate({ username: this.username , password: this.password, otp: this.otp }, function (err, response) {
      if (err) {
        console.log("Authenticate error" + err);
        //throw("Authentication error");
        //TODO: Throw error to main
        cb("Authentication error");
        return;
      }
      console.log(JSON.stringify(response, null, 4));
 //   this.token = response.access_token;
 	  cb(null, response);
    });
   // this.getWalletList();
  //  console.log(this.username + loginResponse);
  }

  logout(cb) {

    this.bitgo.logout({}, function callback(err) {
      if (err) {
       	console.log("Logout error" + err);
       	cb("Logout error");
       	return;
        // handle error
       }

       // the user is now logged out.
     });
  }

  useWallet(walletName, walletPassword) {
      this.currentWalletName = walletName;
      this.currentWalletPassword = walletPassword;
  }

  getWalletList(cb) {
  	var params = {
	   env: Config.BitGoConfig.authEnv
    };
    var bitgo = new BitGoJS.BitGo(this.params);
  	var wallets = bitgo.wallets();
  	var data = {
  	  "type": "bitcoin",
  	 // "id": this.user.id
    };
    var listParameter = {
	  skip: 0,
	  limit: 10
    };

    wallets.list(listParameter, function (err, walletResponse) {
  	  if (err) {
        console.log("Error: " + err);
        cb("Getting wallet list error");
        return;
      }
      cb(null, walletResponse);
 	  return walletResponse.wallets;
  	});
  }

  transfer(amount, destinationBitGoAccount) {
  	var sourceWalletList = this.getWalletList();
  	var sourceWalletId;
  	for(var i = 0; i < sourceWalletList.length; i++) {
  	  if(sourceWalletList[i].label === currentWalletName) {
  	  	sourceWalletId = sourceWalletList[i].id;
  	  	break;
  	  }
  	}
  	var destinationWallets = destinationBitGoAccount.getWalletList();
  	var destinationAddress;
  	for(i = 0; i < destinationWalletList.length; i++) {
  	  if(destinationWalletList[i].label === destinationBitGoAccount.currentWalletName) {
  	  	destinationAddress = destinationWalletList[i].id;
  	  	break;
  	  }
  	}
   	var walletPassphrase = this.currentWalletPassword;
   	  
	bitgo.wallets().get({id: sourceWalletId}, function(err, wallet) {
      if (err) { 
      	console.log("Error getting wallet!"); console.dir(err); return process.exit(-1); 
  	  }
      console.log("Balance is: " + (wallet.balance() / 1e8).toFixed(4));

      wallet.sendCoins({ address: destinationAddress, amount: amount, sourceWalletPassphrase: walletPassphrase }, function(err, result) {
        if (err) { 
        	console.log("Error sending coins!"); console.dir(err); return process.exit(-1); 
    	}
      });
    });
  }


  transferToPlayer(amount, player) {
  	transfer(amount, player.bitcoinAddress);
  }
};

export default BitGoAccount;

