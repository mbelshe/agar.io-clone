"use strict";

console.log('[STARTING SERVER]');
import express from 'express';
import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from '../webpack.config.js';
import Food from './food';
import Player from './player';
import Virus from './virus';
import GameBoard from './gameBoard';
import GameEvents from './gameEvents.js';
import GameObjectType from './gameObjectType.js';

const isDeveloping = process.env.NODE_ENV !== 'production';
const app = express();

if (isDeveloping) {
  const compiler = webpack(config);
  const middleware = webpackMiddleware(compiler, {
    publicPath: config.output.publicPath,
    contentBase: 'src',
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  });

  app.use(middleware);
  app.use(webpackHotMiddleware(compiler));
}

import Http from 'http';
import IO from 'socket.io';
import SAT from 'sat';
import Config from '../config.json';
import Util from './lib/util';

const http = (Http).Server(app);
const io = (IO)(http);

// We store the gameboard in the configuration.
Config.gameBoard = new GameBoard();

const V = SAT.Vector;
const C = SAT.Circle;

/*
function addBot(add) {
  let toAdd = add;
  while (toAdd--) {
    const radius = Util.massToRadius(Config.defaultPlayerMass);
    const position = Util.randomPosition(radius);
    const bot = new Player(((new Date()).getTime() + '' + bots.length) >>> 0, `Bot ${toAdd}`, position, 'bot', 6.25);
    // TODO:  need to add bot to gameboard
    bot.radius = radius;
    bot.target.directionX = 'left' || 'right';
    bot.target.directionY = 'up' || 'down';
    bots.push(bot);
  }
}
*/

function balanceMass() {
  const totalMass = Food.mass + Player.mass;

  const massDiff = Config.gameMass - totalMass;
  const maxFoodDiff = Config.maxFood - Food.count;
  const foodDiff = parseInt(massDiff / Config.foodMass, 10) - maxFoodDiff;
  const foodToAdd = Math.min(foodDiff, maxFoodDiff);
  const foodToRemove = -Math.max(foodDiff, maxFoodDiff);
  const virusToAdd = Config.virus.maxVirus - Virus.count;

  if (foodToAdd > 0) {
    console.log('[DEBUG] Adding ' + foodToAdd + ' food to level!');
    Food.addFood(foodToAdd);
    console.log('[DEBUG] Mass rebalanced!');
  } else if (foodToRemove > 0) {
    console.log('[DEBUG] Removing ' + foodToRemove + ' food from level!');
    Food.removeFood(foodToRemove);
    console.log('[DEBUG] Mass rebalanced!');
  }

  if(virusToAdd > 0) {
    console.log('[DEBUG] Adding ' + virusToAdd + ' virus to level!');
    Virus.addVirus(virusToAdd);
  }

/*
  if (Config.bots.active) {
    const botToAdd = Config.bots.maxBot - bots.length;
    if (botToAdd > 0) {
      addBot(botToAdd);
    }
  }
*/
}

io.on("connection", (socket) => {
 // console.log('A user connected!', socket.handshake.query.type);

  let currentPlayer;

  socket.on(GameEvents.gotit, (player) => {
    console.log(`[INFO] Player ${player.name} connecting!`);

    if (Config.gameBoard.findObjectById(player.id)) {
      console.log('[INFO] Player ' + player.id + ' is already connected, kicking.');
      socket.disconnect();
    } else if (!Util.validNick(player.name)) {
      socket.emit(GameEvents.kick, 'Invalid username.');
      socket.disconnect();
    } else {
      console.log(`[INFO] Player ${player.name} connected!`);
      currentPlayer.name = player.name;
      currentPlayer.spawn();

      io.emit(GameEvents.playerJoin, { name: currentPlayer.name });

      socket.emit(GameEvents.gameSetup, {
        gameWidth: Config.gameWidth,
        gameHeight: Config.gameHeight
      });
    }
  });

  socket.on(GameEvents.gamePing, () => {
    socket.emit(GameEvents.gamePong);
  });

  socket.on(GameEvents.windowResized, (data) => {
    if (!currentPlayer) {
      return;
    }

    currentPlayer.resize(data);
  });

  socket.on(GameEvents.respawn, () => {
    let name = '(no name)';
    if (currentPlayer && Config.gameBoard.findObjectById(currentPlayer.id)) {
      name = currentPlayer.name;
      Config.gameBoard.remove(currentPlayer.id);
    }

    let radius = Util.massToRadius(Config.defaultPlayerMass);
    let position = Util.uniformPosition(Config.gameBoard.objects, radius);
    currentPlayer = new Player(socket.id, socket, name, position);
    socket.emit(GameEvents.welcome, currentPlayer);
    console.log(`[INFO] User ${currentPlayer.name} respawned!`);
  });

  socket.on("disconnect", () => {
    if (!currentPlayer) {
      return;
    }

    currentPlayer.die();
    console.log(`[INFO] User ${currentPlayer.name} disconnected!`);
    socket.broadcast.emit(GameEvents.playerDisconnect, { name: currentPlayer.name });
  });

  socket.on(GameEvents.playerChat, (data) => {
    if (!currentPlayer) {
      return;
    }

    const _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
    const _message = data.message.replace(/(<([^>]+)>)/ig, '');
    if (Config.logChat === 1) {
      console.log(`[CHAT] [${(new Date()).getHours()}:${(new Date()).getMinutes()}] ${_sender}: ${_message}`);
    }
    socket.broadcast.emit(GameEvents.serverSendPlayerChat, {sender: _sender, message: _message.substring(0, 35)});
  });

  socket.on(GameEvents.pass, (data) => {
    if (!currentPlayer) {
      return;
    }

    if (data[0] === Config.adminPass) {
      console.log(`[ADMIN] ${currentPlayer.name} just logged in as an admin!`);
      socket.emit(GameEvents.serverMSG, `Welcome back ${currentPlayer.name}`);
      socket.broadcast.emit(GameEvents.serverMSG, `${currentPlayer.name} just logged in as admin!`);
      currentPlayer.admin = true;
    } else {
      console.log(`[ADMIN] ${currentPlayer.name} attempted to log in with incorrect password.`);
      socket.emit(GameEvents.serverMSG, 'Password incorrect, attempt logged.');
      // TODO: Actually log incorrect passwords.
    }
  });

  socket.on(GameEvents.kick, (data) => {
    if (!currentPlayer) {
      return;
    }

/*
    if (currentPlayer.admin) {
      const [name, ...reasons] = data;
      let reason = '';
      let worked = false;
      for (let e = 0; e < users.length; e++) {
        if (users[e].name === name && !users[e].admin && !worked) {
          reason = reasons.reduce((rs, r) => rs + ' ' + r, '');
          if (reason !== '') {
            console.log(`[ADMIN] User ${users[e].name} kicked successfully by ${currentPlayer.name} for reason ${reason}`);
          } else {
            console.log(`[ADMIN] User ${users[e].name} kicked successfully by ${currentPlayer.name}`);
          }
          socket.emit('serverMSG', `User ${users[e].name} was kicked by ${currentPlayer.name}`);
          users[e].socket.emit('kick', reason);
          users[e].socket.disconnect();
          users.splice(e, 1);
          worked = true;
        }
      }
      if (!worked) {
        socket.emit('serverMSG', 'Could not locate user or user is an admin.');
      }
    } else {
      console.log(`[ADMIN] ${currentPlayer.name} is trying to use -kick but isn't an admin.`);
      socket.emit('serverMSG', 'You are not permitted to use this command.');
    }
*/
  });

  // Heartbeat function, update everytime.
  socket.on(GameEvents.heartbeat, (target) => {
    currentPlayer.heartbeat(target);
    
  });

  socket.on(GameEvents.fireFood, () => {
    if (!currentPlayer) {
      return;
    }

    currentPlayer.fireFood(massFood);
  });

  socket.on(GameEvents.virusSplit, (virusCellIndex) => {
    if (!currentPlayer) {
      return;
    }
   // console.log("currentPlayer is true");
    if (currentPlayer.canSplit()) {
      // Split single cell from virus
     // console.log("Player can split");
      if (virusCellIndex >= 0) {
      //  console.log("Splitting a cell");
        currentPlayer.splitCell(currentPlayer.cells[virusCellIndex]);
      } else {
        // Split all cells
      //  console.log("Splitting all cells");
        currentPlayer.splitAllCells();
      }
      currentPlayer.lastSplit = new Date().getTime();
    }
  });
});

function moveBot() {
  bots.forEach(bot => {
    if (bot.x < 100 && bot.target.directionX === 'left') {
      bot.target.x = Config.bots.speed;
      bot.target.directionX = 'right';
    } else if (bot.x > (Config.gameWidth - 100) && bot.target.directionX === 'right') {
      bot.target.x = -Config.bots.speed;
      bot.target.directionX = 'left';
    } else {
      if (bot.target.directionX === 'left') {
        bot.target.x = -Config.bots.speed;
      } else {
        bot.target.x = Config.bots.speed;
      }
    }

    if (bot.y < 100 && bot.target.directionY === 'up') {
      bot.target.y = Config.bots.speed;
      bot.target.directionY = 'down';
    } else if (bot.y > (Config.gameHeight - 100) && bot.target.directionY === 'down') {
      bot.target.y = -Config.bots.speed;
      bot.target.directionY = 'up';
    } else {
      if (bot.target.directionY === 'up') {
        bot.target.y = -Config.bots.speed;
      } else {
        bot.target.y = Config.bots.speed;
      }
    }
    bot.move();
  });
}

function tickPlayer(player) {  
  if (player.lastHeartbeat < new Date().getTime() - Config.maxHeartbeatInterval) {
     player.socket.emit(GameEvents.kick, `Last heartbeat received over ${Config.maxHeartbeatInterval} ago.`);
     player.die();
     player.socket.disconnect();
  }
  player.move();
  
  let cellIndex = 0;
  player.cells.forEach(function(cell) {

    // Create a square around the cell's circle.
    let cellBox = {
      x: cell.x - (cell.radius),
      y: cell.y - (cell.radius),
      w: cell.radius * 2,
      h: cell.radius * 2
    };
    let cellCircle = new C( new V(cell.x, cell.y), cell.radius);

    let collisions = Config.gameBoard.find(cellBox);
    collisions.forEach(function(object) {
      // Verify we have a real collission
      let isCollision = SAT.pointInCircle(new V(object.x, object.y), cellCircle);
      if (!isCollision) {
        return;
      }

      if (cell.mass > object.mass * 1.1  &&
          cell.radius > Math.sqrt(Math.pow(cell.x - object.x, 2) + Math.pow(cell.y - object.y, 2)) * 1.1) {
        console.log("EATING/Split " + object.type + ': ' + object.id);

        // Shouldn't the eat() method automatically take care of the mass changes?
        //TODO: Add virus(splitCell) implementation here
        if (object.type == 'food') {
          object.eat();
          cell.mass += object.mass;
        } else if (object.type == 'cell') {
          cell.mass += object.mass;
          object.die();
        } else if (object.type == 'virus') {
          player.socket.emit(GameEvents.virusSplit, cellIndex);
        } 
      
        player.socket.emit(GameEvents.playerScore, player.mass);
        
//console.log("ATE: " + object.mass + ", player is now: " + player.mass);
      }
    });
    cellIndex++;
  });


/*
  moveBot();

  function deleteFood(f) {
    food[f] = {};
    food.splice(f, 1);
  }

  function collisionCheck(collision) {
    if (collision.aUser.mass > collision.bUser.mass * 1.1  && collision.aUser.radius > Math.sqrt(Math.pow(collision.aUser.x - collision.bUser.x, 2) + Math.pow(collision.aUser.y - collision.bUser.y, 2)) * 1.75) {
      console.log(`[DEBUG] Killing user: ${collision.bUser.id}`);
      console.log('[DEBUG] Collision info:');

      const botCheck = Util.findIndex(bots, collision.bUser.id);
      const userCheck = Util.findIndex(users, collision.bUser.id);
      const numUser = userCheck > -1 ? userCheck : botCheck;
      if (numUser > -1) {
        if (collision.bUser.type === 'bot') {
          bots.splice(numUser, 1);
        } else {
          if (users[numUser].cells.length > 1) {
            users[numUser].massTotal -= collision.bUser.mass;
            users[numUser].cells.splice(collision.bUser.num, 1);
          } else {
            users.splice(numUser, 1);
            io.emit('playerDied', { name: collision.bUser.name });
            collision.bUser.socket.emit('RIP');
          }
        }

        currentPlayer.massTotal += collision.bUser.mass;
        collision.aUser.mass += collision.bUser.mass;
      }
    }
  }

  let playerCircle = {};
  let currentCell = {};
  const playerCollisions = [];

  function check(user) {
    user.cells.forEach((c, i) => {
      //if ( user.cells[i].mass > 10 && user.id !== currentPlayer.id) {
      if (user.id !== currentPlayer.id) {
        const response = new SAT.Response();
        const collided = SAT.testCircleCircle(playerCircle,
          new C(new V(c.x, c.y), c.radius),
          response);
        if (collided) {
          response.aUser = currentCell;
          response.bUser = {
            id: user.id,
            name: user.name,
            x: c.x,
            y: c.y,
            num: i,
            type: user.type,
            mass: c.mass
          };
          playerCollisions.push(response);
        }
      }
    });
    return true;
  }

  function eatMass(m) {
    if (SAT.pointInCircle(new V(m.x, m.y), playerCircle)) {
      if (m.id === currentPlayer.id && m.speed > 0 && z === m.num) {
        return false;
      }
      if (currentCell.mass > m.masa * 1.1) {
        return true;
      }
    }
    return false;
  }

  function funcFood(f) {
    return SAT.pointInCircle(new V(f.x, f.y), playerCircle);
  }

  // TODO: FIX THIS Z VARIABLE AND EATMASS()
  for (z = 0; z < currentPlayer.cells.length; z++) {
    currentCell = currentPlayer.cells[z];
    playerCircle = new C(
      new V(currentCell.x, currentCell.y),
      currentCell.radius
    );

    const foodEaten = food.map(funcFood)
      .reduce((a, b, c) => { return b ? a.concat(c) : a; }, []);

    foodEaten.forEach(deleteFood);
    const massEaten = massFood.map(eatMass)
      .reduce((a, b, c) => {return b ? a.concat(c) : a; }, []);

    const virusCollision = virus.map(funcFood)
      .reduce((a, b, c) => { return b ? a.concat(c) : a; }, []);

    if (virusCollision > 0 && currentCell.mass > virus[virusCollision].mass) {
      currentPlayer.socket.emit('virusSplit', z);
    }

    let masaGanada = 0;
    for (let m = 0; m < massEaten.length; m++) {
      masaGanada += massFood[massEaten[m]].masa;
      massFood[massEaten[m]] = {};
      massFood.splice(massEaten[m], 1);
      for (let n = 0; n < massEaten.length; n++) {
        if (massEaten[m] < massEaten[n]) {
          massEaten[n]--;
        }
      }
    }

    if (typeof(currentCell.speed) === 'undefined') {
      currentCell.speed = 6.25;
    }

    masaGanada += (foodEaten.length * Config.foodMass);
    if (masaGanada > 0) {
      currentPlayer.score += masaGanada;
      currentCell.mass += masaGanada;
      currentPlayer.massTotal += masaGanada;
    }
    currentPlayer.socket.emit('playerScore', currentPlayer.score);
    currentCell.radius = Util.massToRadius(currentCell.mass);
    playerCircle.r = currentCell.radius;

    users.forEach(sqt.put);
    bots.forEach(sqt.put);
    // TODO: TEST TO MAKE SURE PLAYER COLLISSIONS WORK
    sqt.get(currentPlayer, check);
    playerCollisions.forEach(collisionCheck);
  }
*/
}

function moveLoop() {
  let allPlayers = Player.players;
  Object.keys(allPlayers).forEach(function(key) {
    let player = allPlayers[key];
    if (player !== undefined) {   // Check undefined because the player could be eaten as part of this iteration.
      tickPlayer(allPlayers[key]);
    }
  });
}

function gameLoop() {
/*
  if (users.length > 0) {
    users.forEach(u => {
      u.cells.forEach(c => {
        if (c.mass * (1 - (Config.massLossRate / 1000)) > Config.defaultPlayerMass && u.massTotal > Config.minMassLoss) {
          const massLoss = c.mass * (1 - (Config.massLossRate / 1000));
          u.massTotal -= c.mass - massLoss;
          c.mass = massLoss;
        }
      });
    });
  }

*/

  balanceMass();
}

function sendUpdates() {
  let leaderboard = Player.leaderboard;
  let allPlayers = Player.players;
  Object.keys(allPlayers).forEach(function(key) {
    let player = allPlayers[key];
    let visibleObjects = Config.gameBoard.find({x: player.x - player.w/2, y: player.y - player.h/2, w: player.w, h: player.h});
//console.dir(visibleObjects);
    player.socket.emit(GameEvents.serverTellPlayerMove, player, visibleObjects);

    if (leaderboard.dirty) {
      player.socket.emit(GameEvents.leaderboard, { players: Player.count, leaderboard: leaderboard.leaders });
    }
  });
  leaderboard.clearDirty();
}

setInterval(moveLoop, 1000 / 60);
setInterval(gameLoop, 1000);
setInterval(sendUpdates, 1000 / Config.networkUpdateFactor);

// Don't touch, IP configurations.
const ipaddress = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '127.0.0.1';
const serverport = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || Config.port;
if (process.env.OPENSHIFT_NODEJS_IP !== undefined) {
  http.listen( serverport, ipaddress, () => {
    console.log(`[DEBUG] Listening on *:${serverport}`);
  });
} else {
  http.listen( serverport, () => {
    console.log(`[DEBUG] Listening on *:${Config.port}`);
  });
}
