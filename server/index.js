console.log('[STARTING SERVER]');
import express from 'express';
import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from '../webpack.config.js';
import Player from './player';
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

const gameBoard = new GameBoard();

/*
const users = [];
const massFood = [];
const food = [];
const virus = [];
const bots = [];
*/
const sockets = {};

let leaderboard = [];
let leaderboardChanged = false;

const V = SAT.Vector;
const C = SAT.Circle;

/*
function addFood(add) {
  const radius = Util.massToRadius(Config.foodMass);
  let toAdd = add;
  while (toAdd--) {
    const position = Config.foodUniformDisposition ? Util.uniformPosition(food, radius) : Util.randomPosition(radius);
    food.push({
      // Make IDs unique.
      id: ((new Date()).getTime() + '' + food.length) >>> 0,
      x: position.x,
      y: position.y,
      radius: radius,
      mass: Math.random() + 2,
      hue: Math.round(Math.random() * 360)
    });
  }
}

function addVirus(add) {
  let toAdd = add;
  while (toAdd--) {
    const mass = Util.randomInRange(Config.virus.defaultMass.from, Config.virus.defaultMass.to, true);
    const radius = Util.massToRadius(mass);
    const position = Config.virusUniformDisposition ? Util.uniformPosition(virus, radius) : Util.randomPosition(radius);
    virus.push({
      id: ((new Date()).getTime() + '' + virus.length) >>> 0,
      x: position.x,
      y: position.y,
      radius: radius,
      mass: mass,
      fill: Config.virus.fill,
      stroke: Config.virus.stroke,
      strokeWidth: Config.virus.strokeWidth
    });
  }
}

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

function removeFood(rem) {
  let toRem = rem;
  while (toRem--) {
    food.pop();
  }
}

function moveMass(mass) {
  const deg = Math.atan2(mass.target.y, mass.target.x);
  const deltaY = mass.speed * Math.sin(deg);
  const deltaX = mass.speed * Math.cos(deg);

  mass.speed -= 0.5;
  if (mass.speed < 0) {
    mass.speed = 0;
  }
  if (!isNaN(deltaY)) {
    mass.y += deltaY;
  }
  if (!isNaN(deltaX)) {
    mass.x += deltaX;
  }

  const borderCalc = mass.radius + 5;

  if (mass.x > Config.gameWidth - borderCalc) {
    mass.x = Config.gameWidth - borderCalc;
  }
  if (mass.y > Config.gameHeight - borderCalc) {
    mass.y = Config.gameHeight - borderCalc;
  }
  if (mass.x < borderCalc) {
    mass.x = borderCalc;
  }
  if (mass.y < borderCalc) {
    mass.y = borderCalc;
  }
}

function balanceMass() {
  const totalMass = food.length * Config.foodMass + users
  .map((u) => { return u.massTotal; })
  .reduce((pu, cu) => { return pu + cu; }, 0);

  const massDiff = Config.gameMass - totalMass;
  const maxFoodDiff = Config.maxFood - food.length;
  const foodDiff = parseInt(massDiff / Config.foodMass, 10) - maxFoodDiff;
  const foodToAdd = Math.min(foodDiff, maxFoodDiff);
  const foodToRemove = -Math.max(foodDiff, maxFoodDiff);

  if (foodToAdd > 0) {
    // console.log('[DEBUG] Adding ' + foodToAdd + ' food to level!');
    addFood(foodToAdd);
    // console.log('[DEBUG] Mass rebalanced!');
  } else if (foodToRemove > 0) {
    // console.log('[DEBUG] Removing ' + foodToRemove + ' food from level!');
    removeFood(foodToRemove);
    // console.log('[DEBUG] Mass rebalanced!');
  }

  const virusToAdd = Config.virus.maxVirus - virus.length;

  if (virusToAdd > 0) {
    addVirus(virusToAdd);
  }

  if (Config.bots.active) {
    const botToAdd = Config.bots.maxBot - bots.length;
    if (botToAdd > 0) {
      addBot(botToAdd);
    }
  }
}
*/

io.on("connection", (socket) => {
  console.log('A user connected!', socket.handshake.query.type);

  const type = socket.handshake.query.type;
  let radius = Util.massToRadius(Config.defaultPlayerMass);
  let position = Config.newPlayerInitialPosition === 'farthest' ? Util.uniformPosition(gameBoard.objects, radius) : Util.randomPosition(radius);
  console.log("ADDING PLAYER -- " + socket.id);
  let currentPlayer = new Player(socket.id, '', position, type);

  socket.on(GameEvents.gotit, (player) => {
    console.log(`[INFO] Player ${player.name} connecting!`);

    if (gameBoard.findObjectById(player.id)) {
      console.log('[INFO] Player ID is already connected, kicking.');
      socket.disconnect();
    } else if (!Util.validNick(player.name)) {
      socket.emit(GameEvents.kick, 'Invalid username.');
      socket.disconnect();
    } else {
      console.log(`[INFO] Player ${player.name} connected!`);
      sockets[player.id] = socket;

      radius = Util.massToRadius(Config.defaultPlayerMass);
      position = Config.newPlayerInitialPosition === 'farthest' ? Util.uniformPosition(gameBoard.objects, radius) : Util.randomPosition(radius);
      currentPlayer = new Player(player.id, player.name, position, type);
      gameBoard.insert(currentPlayer);

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
    currentPlayer.resize(data);
  });

  socket.on(GameEvents.respawn, () => {
    if (gameBoard.findObjectById(currentPlayer.id)) {
      gameBoard.remove(currentPlayer.id);
    }
    socket.emit(GameEvents.welcome, currentPlayer);
    console.log(`[INFO] User ${currentPlayer.name} respawned!`);
  });

  socket.on("disconnect", () => {
    if (gameBoard.findObjectById(currentPlayer.id)) {
      gameBoard.remove(currentPlayer.id);
    }
    console.log(`[INFO] User ${currentPlayer.name} disconnected!`);
    socket.broadcast.emit(GameEvents.playerDisconnect, { name: currentPlayer.name });
  });

  socket.on(GameEvents.playerChat, (data) => {
    const _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
    const _message = data.message.replace(/(<([^>]+)>)/ig, '');
    if (Config.logChat === 1) {
      console.log(`[CHAT] [${(new Date()).getHours()}:${(new Date()).getMinutes()}] ${_sender}: ${_message}`);
    }
    socket.broadcast.emit(GameEvents.serverSendPlayerChat, {sender: _sender, message: _message.substring(0, 35)});
  });

  socket.on(GameEvents.pass, (data) => {
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
          sockets[users[e].id].emit('kick', reason);
          sockets[users[e].id].disconnect();
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
    currentPlayer.fireFood(massFood);
  });

  socket.on(GameEvents.virusSplit, (virusCell) => {
    if (currentPlayer.canSplit()) {
      // Split single cell from virus
      if (virusCell) {
        currentPlayer.splitCell(currentPlayer.cells[virusCell]);
      } else {
        // Split all cells
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

function tickPlayer(currentPlayer) {
  // TODO: THIS SHOULD NOT HAVE TO BE DECLARED HERE FIX SCOPE
  let z = 0;

  if (currentPlayer.lastHeartbeat < new Date().getTime() - Config.maxHeartbeatInterval) {
    sockets[currentPlayer.id].emit(GameEvents.kick, `Last heartbeat received over ${Config.maxHeartbeatInterval} ago.`);
    sockets[currentPlayer.id].disconnect();
  }
  currentPlayer.move();
  

  currentPlayer.move();
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
            sockets[collision.bUser.id].emit('RIP');
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
      sockets[currentPlayer.id].emit('virusSplit', z);
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
    sockets[currentPlayer.id].emit('playerScore', currentPlayer.score);
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
  gameBoard.objects.forEach((u) => {
    if (u.type == 'player') {
      tickPlayer(u);
    }
  });

  /*
  massFood.filter(m => m.speed > 0)
    .forEach(m => moveMass(m));
  */
}

function gameLoop() {
/*
  if (users.length > 0) {
    users.sort((a, b) => { return b.massTotal - a.massTotal; });

    const topUsers = [];

    for (let i = 0; i < Math.min(10, users.length); i++) {
      if (users[i].type === 'player') {
        topUsers.push({
          id: users[i].id,
          name: users[i].name
        });
      }
    }
    if (isNaN(leaderboard) || leaderboard.length !== topUsers.length) {
      leaderboard = topUsers;
      leaderboardChanged = true;
    } else {
      for (let i = 0; i < leaderboard.length; i++) {
        if (leaderboard[i].id !== topUsers[i].id) {
          leaderboard = topUsers;
          leaderboardChanged = true;
          break;
        }
      }
    }

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

  balanceMass();
*/
}

function sendUpdates() {
  gameBoard.objects.forEach(function(object) {
//console.log("--sendUpdates loop for: " + object.id + "," + object.type);
    if (object.type === 'player') {
/*
      // center the view if x/y is undefined, this will happen for spectators
      u.x = u.x || Config.gameWidth / 2;
      u.y = u.y || Config.gameHeight / 2;

      const visibleFood  = food
          .filter(f => f.x > u.x - u.w / 2 - 20 &&
          f.x < u.x + u.w / 2 + 20 &&
          f.y > u.y - u.h / 2 - 20 &&
          f.y < u.y + u.h / 2 + 20 );

      const visibleVirus  = virus
          .filter(f => f.x > u.x - u.w / 2 - f.radius &&
          f.x < u.x + u.w / 2 + f.radius &&
          f.y > u.y - u.h / 2 - f.radius &&
          f.y < u.y + u.h / 2 + f.radius );

      const visibleBots  = bots
          .filter(f => f.x > u.x - u.w / 2 - f.radius &&
          f.x < u.x + u.w / 2 + f.radius &&
          f.y > u.y - u.h / 2 - f.radius &&
          f.y < u.y + u.h / 2 + f.radius );

      const visibleMass = massFood
          .filter(f => f.x + f.radius > u.x - u.w / 2 - 20 &&
          f.x - f.radius < u.x + u.w / 2 + 20 &&
          f.y + f.radius > u.y - u.h / 2 - 20 &&
          f.y - f.radius < u.y + u.h / 2 + 20 );

      const visibleCells = users
        .map(f => {
          return {
            id: f.id !== u.id ? f.id : undefined,
            x: Math.round(f.x),
            y: Math.round(f.y),
            cells: f.cells.filter(c => {
              return c.x + c.radius > u.x - u.w / 2 - 20 &&
                c.x - c.radius < u.x + u.w / 2 + 20 &&
                c.y + c.radius > u.y - u.h / 2 - 20 &&
                c.y - c.radius < u.y + u.h / 2 + 20;
            }).map(c => {
              return Object.assign(c, {
                x: Math.round(c.x),
                y: Math.round(c.y),
                mass: Math.round(c.mass),
                radius: Math.round(c.radius)
              });
            }),
            massTotal: Math.round(f.massTotal),
            hue: f.hue,
            name: f.name
          };
        });
*/
      let visibleObjects = gameBoard.find({x: object.x - object.w/2, y: object.y - object.h/2, w: object.w, h: object.h});
console.dir(visibleObjects);
      sockets[object.id].emit(GameEvents.serverTellPlayerMove, visibleObjects);
      if (leaderboardChanged) {
       // sockets[object.id].emit('leaderboard', {
    	  sockets[object.id].emit(GameEvents.leaderboard, {
          players: users.length,
          leaderboard: leaderboard
        });
      }
    }
  });
  leaderboardChanged = false;
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
