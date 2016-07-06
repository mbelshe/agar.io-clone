// IMPORT ASSETS
import '../css/App.scss';
import '../img/feed.png';
import '../img/split.png';
import virusImage from '../img/virus.png';
import '../audio/spawn.mp3';
import '../audio/split.mp3';
import GameEvents from '../../server/gameEvents.js';

import io from 'socket.io-client';

let playerName;
let playerType;  // either 'player' | 'spectate'
const playerNameInput = document.getElementById('playerNameInput');
let socket;
let reason;
let LIGHT_THEME = 'light';
const KEY_ESC = 27;
const KEY_ENTER = 13;
const KEY_CHAT = 13;
const KEY_FIREFOOD = 119;
const KEY_SPLIT = 32;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
let borderDraw = false;
let animLoopHandle;
let spin = -Math.PI;
let mobile = false;
let foodSides = 10;
const virusSides = 20;

// Canvas.
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
let gameWidth = 0;
let gameHeight = 0;
let xoffset = -gameWidth;
let yoffset = -gameHeight;

let gameStartPending = false;
let gameStart = false;
let disconnected = false;
let died = false;
let kicked = false;

// TODO: Break out into GameControls.
let continuity = false;
let startPingTime = 0;
let toggleMassState = 0;
let lineColor = '#000000';

const foodConfig = {
  border: 0,
};

const playerConfig = {
  border: 6,
  textColor: '#FFFFFF',
  textBorder: '#000000',
  textBorderSize: 3,
  defaultSize: 30
};

let player = {
  id: -1,
  x: screenWidth / 2,
  y: screenHeight / 2,
  w: screenWidth,
  h: screenHeight,
  target: {x: screenWidth / 2, y: screenHeight / 2}
};

let gameObjects = [];
let leaderboard = [];
let target = {x: player.x, y: player.y};
let reenviar = true;
let directionLock = false;
const directions = [];
// let enemySpin = -Math.PI;

const debug = (args) => {
  if (console && console.log) {
    console.log(args);
  }
};

if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
  mobile = true;
}

const c = document.getElementById('cvs');
const graph = c.getContext('2d');

function isCurrentPlayer(id) {
  return id === player.id;
}

function ChatClient() {
  this.commands = {};
  let input = document.getElementById('chatInput');
  input.addEventListener('keypress', this.sendChat.bind(this));
  input.addEventListener('keyup', (key) => {
    input = document.getElementById('chatInput');
    const curKey = key.which || key.keyCode;
    if (curKey === KEY_ESC) {
      input.value = '';
      c.focus();
    }
  });
}

// Chat box implementation for the users.
ChatClient.prototype.addChatLine = function(name, message, me) {
  if (mobile) {
    return;
  }
  const newline = document.createElement('li');

  // Colours the chat input correctly.
  newline.className = (me) ? 'me' : 'friend';
  newline.innerHTML = `<b>${((name.length < 1) ? 'An unnamed cell' : name)}</b>: ${message}`;

  this.appendMessage(newline);
};


// Chat box implementation for the system.
ChatClient.prototype.addSystemLine = function(message) {
  if (mobile) {
    return;
  }
  const newline = document.createElement('li');

  // Colours the chat input correctly.
  newline.className = 'system';
  newline.innerHTML = message;

  // Append messages to the logs.
  this.appendMessage(newline);
};

// Places the message DOM node into the chat box.
ChatClient.prototype.appendMessage = function(node) {
  if (mobile) {
    return;
  }
  const chatList = document.getElementById('chatList');
  if (chatList.childNodes.length > 10) {
    chatList.removeChild(chatList.childNodes[0]);
  }
  chatList.appendChild(node);
};

// Sends a message or executes a command on the click of enter.
ChatClient.prototype.sendChat = function(key) {
  const commands = this.commands;
  const input = document.getElementById('chatInput');

  const curKey = key.which || key.keyCode;

  if (curKey === KEY_ENTER) {
    const text = input.value.replace(/(<([^>]+)>)/ig, '');
    if (text !== '') {
      // Chat command.
      if (text.indexOf('-') === 0) {
        const args = text.substring(1).split(' ');
        if (commands[args[0]]) {
          commands[args[0]].callback(args.slice(1));
        } else {
          this.addSystemLine(`Unrecognized Command: ${text}, type -help for more info.`);
        }

      // Allows for regular messages to be sent to the server.
      } else {
        socket.emit(GameEvents.playerChat, { sender: player.name, message: text });
        this.addChatLine(player.name, text, true);
      }

      // Resets input.
      input.value = '';
      c.focus();
    }
  }
};

// Allows for addition of commands.
ChatClient.prototype.registerCommand = function(name, description, callback) {
  this.commands[name] = {
    description: description,
    callback: callback
  };
};

// Allows help to print the list of all the commands and their descriptions.
ChatClient.prototype.printHelp = function() {
  const commands = this.commands;
  for (const cmd in commands) {
    if (commands.hasOwnProperty(cmd)) {
      this.addSystemLine(`- ${cmd}: ${commands[cmd].description}`);
    }
  }
};

const chat = new ChatClient();

// socket stuff.
function setupSocket() {
  // Handle ping.
  socket.on(GameEvents.gamePong, () => {
    const latency = Date.now() - startPingTime;
    debug(`Latency: ${latency}ms`);
    chat.addSystemLine(`Ping: ${latency}ms`);
  });

  // Handle error.
  socket.on("connect_failed", () => {
    socket.close();
    disconnected = true;
  });

  socket.on("disconnect", () => {
    socket.close();
    disconnected = true;
    gameStartPending = false;
  });

  // Handle connection.
  socket.on(GameEvents.welcome, (playerSettings) => {
    player = playerSettings;
    player.id = playerSettings.id;
    player.name = playerName;
    player.w = screenWidth;
    player.h = screenHeight;
    player.target = target;
    player.score = 0;
    socket.emit(GameEvents.gotit, player);
    gameStart = true;
    document.body.id = 'gameStarted';
    debug(`Game started at: ${gameStart}`);
    chat.addSystemLine('Connected to the game!');
    chat.addSystemLine('Type <b>-help</b> for a list of commands.');
    if (mobile) {
      document.getElementById('gameAreaWrapper').removeChild(document.getElementById('chatbox'));
    }
    c.focus();
  });

  function resize() {
    player.w = c.width = screenWidth = playerType === 'player' ? window.innerWidth : gameWidth;
    player.h = c.height = screenHeight = playerType === 'player' ? window.innerHeight : gameHeight;
    socket.emit(GameEvents.windowResized, { w: screenWidth, h: screenHeight });
  }

  window.addEventListener('resize', resize);

  socket.on(GameEvents.gameSetup, (data) => {
    gameWidth = data.gameWidth;
    gameHeight = data.gameHeight;
    resize();
  });

  socket.on(GameEvents.playerDied, (data) => {
    chat.addSystemLine(`{GAME} - <b>${(data.name.length < 1 ? 'An unnamed cell' : data.name)}</b> was eaten.`);
  });

  socket.on(GameEvents.playerDisconnect, (data) => {
    chat.addSystemLine(`{GAME} - <b>${(data.name.length < 1 ? 'An unnamed cell' : data.name)}</b> disconnected.`);
  });

  socket.on(GameEvents.playerJoin, (data) => {
    chat.addSystemLine(`{GAME} - <b>${(data.name.length < 1 ? 'An unnamed cell' : data.name)}</b> joined.`);
  });

 // socket.on('leaderboard', (data) => {
  socket.on(GameEvents.leaderboard , (data) => {
    leaderboard = data.leaderboard;
    let status = '<span class="title">Leaderboard</span>';
    for (let i = 0; i < leaderboard.length; i++) {
      status += '<br />';
      if (isCurrentPlayer(leaderboard[i].id)) {
        status += leaderboard[i].name.length !== 0 ? `<span class="me">${(i + 1)}. ${leaderboard[i].name}</span>` : `<span class="me">${(i + 1)}. An unnamed cell</span>`;
      } else {
        status += leaderboard[i].name.length !== 0 ? `${(i + 1)}. ${leaderboard[i].name}` : `${(i + 1)}. An unnamed cell`;
      }
    }
    status += '<br />Players: ' + data.players;
    document.getElementById('status').innerHTML = status;
  });

  socket.on(GameEvents.serverMSG, (data) => {
    chat.addSystemLine(data);
  });

  // Chat.
  socket.on(GameEvents.serverSendPlayerChat, (data) => {
    chat.addChatLine(data.sender, data.message, false);
  });

  // Handle movement.
  socket.on(GameEvents.serverTellPlayerMove, (viewableObjects) => {
    let playerData = {};
    for (let i = 0; i < viewableObjects.length; i++) {
      if (isCurrentPlayer(viewableObjects[i].id)) {
        playerData = viewableObjects[i];
        break;
      }
    }
    if (playerType === 'player') {
      xoffset = player.x - playerData.x;
      yoffset = player.y - playerData.y;

      player.x = playerData.x;
      player.y = playerData.y;
      player.hue = playerData.hue;
      player.massTotal = playerData.massTotal;
      player.cells = playerData.cells;
      player.xoffset = isNaN(xoffset) ? 0 : xoffset;
      player.yoffset = isNaN(yoffset) ? 0 : yoffset;
    }
    gameObjects = viewableObjects;
  });

  // Death.
  socket.on(GameEvents.RIP, () => {
    gameStart = false;
    died = true;
    window.setTimeout(() => {
      document.getElementById('gameAreaWrapper').style.opacity = 0;
      document.getElementById('startMenuWrapper').style.maxHeight = '1000px';
      died = false;
      if (animLoopHandle) {
        window.cancelAnimationFrame(animLoopHandle);
        animLoopHandle = undefined;
      }
    }, 2500);
  });

  socket.on(GameEvents.kick, (data) => {
    gameStart = false;
    reason = data;
    kicked = true;
    socket.close();
  });

  socket.on(GameEvents.virusSplit, (virusCell) => {
    socket.emit(GameEvents.virusSplit, virusCell);
    reenviar = false;
  });

  socket.on(GameEvents.playerScore, (data) => {
    document.getElementById('score').innerHTML = `Score: ${data}`;
  });
}

function drawName(name, cell) {
  const start = {
    x: player.x - (screenWidth / 2),
    y: player.y - (screenHeight / 2)
  };
  const circle = {
    x: cell.x - start.x,
    y: cell.y - start.y
  };
  let fontSize = Math.max(cell.radius / 3, 12);
  graph.lineWidth = playerConfig.textBorderSize;
  graph.fillStyle = playerConfig.textColor;
  graph.strokeStyle = playerConfig.textBorder;
  graph.miterLimit = 1;
  graph.lineJoin = 'round';
  graph.textAlign = 'center';
  graph.textBaseline = 'middle';
  graph.font = `bold ${fontSize}px sans-serif`;

  if (toggleMassState === 0) {
    graph.strokeText(name, circle.x, circle.y);
    graph.fillText(name, circle.x, circle.y);
  } else {
    graph.strokeText(name, circle.x, circle.y);
    graph.fillText(name, circle.x, circle.y);
    graph.font = `bold ${Math.max(fontSize / 3 * 2, 10)}px sans-serif`;
    if (name.length === 0) fontSize = 0;
    graph.strokeText(Math.round(cell.mass), circle.x, circle.y + fontSize);
    graph.fillText(Math.round(cell.mass), circle.x, circle.y + fontSize);
  }
}

function drawCircle(centerX, centerY, radius, sides) {
  let theta = 0;
  let x = 0;
  let y = 0;

  graph.beginPath();

  for (let i = 0; i < sides; i++) {
    theta = (i / sides) * 2 * Math.PI;
    x = centerX + radius * Math.sin(theta);
    y = centerY + radius * Math.cos(theta);
    graph.lineTo(x, y);
  }
  graph.closePath();
  graph.fill();
  graph.stroke();
}

function drawFood(food) {
  graph.strokeStyle = `hsl(${food.hue}, 100%, 45%)`;
  graph.fillStyle = `hsl(${food.hue}, 100%, 50%)`;
  graph.lineWidth = foodConfig.border;
  drawCircle(food.x - player.x + screenWidth / 2, food.y - player.y + screenHeight / 2, food.radius, foodSides);
}

function drawVirus(virus) {
  const img = new Image();
  img.src = virusImage;
  graph.drawImage(img, virus.x - player.x - virus.radius + screenWidth / 2, virus.y - player.y - virus.radius + screenHeight / 2, virus.radius * 2, virus.radius * 2);
}

function drawBots(bot) {
  graph.strokeStyle = `hsl(${bot.hue}, 100%, 45%)`;
  graph.fillStyle = `hsl(${bot.hue}, 100%, 50%)`;
  graph.lineWidth = playerConfig.border;
  drawCircle(bot.x - player.x + screenWidth / 2, bot.y - player.y + screenHeight / 2, bot.radius, virusSides);
  drawName('BOT', bot);
}

function drawFireFood(mass) {
  graph.strokeStyle = `hsl(${mass.hue}, 100%, 45%)`;
  graph.fillStyle = `hsl(${mass.hue}, 100%, 50%)`;
  graph.lineWidth = playerConfig.border;
  drawCircle(mass.x - player.x + screenWidth / 2, mass.y - player.y + screenHeight / 2, mass.radius - 5, 18 + (~~(mass.masa / 5)));
}

function valueInRange(min, max, value) {
  return Math.min(max, Math.max(min, value));
}

function drawPlayer(playerToDraw) {
  const start = {
    x: player.x - (screenWidth / 2),
    y: player.y - (screenHeight / 2)
  };

  playerToDraw.cells.forEach(function(cell) {
    let x = 0;
    let y = 0;

    const points = 30 + ~~(cell.mass / 5);
    const increase = Math.PI * 2 / points;

    graph.strokeStyle = `hsl(${playerToDraw.hue}, 100%, 45%)`;
    graph.fillStyle = `hsl(${playerToDraw.hue}, 100%, 50%)`;
    graph.lineWidth = playerConfig.border;

    const xstore = [];
    const ystore = [];

    spin += 0.0;

    const circle = {
      x: cell.x - start.x,
      y: cell.y - start.y
    };

    for (let i = 0; i < points; i++) {
      x = cell.radius * Math.cos(spin) + circle.x;
      y = cell.radius * Math.sin(spin) + circle.y;
      if (!isCurrentPlayer(playerToDraw.id)) {
        x = valueInRange(-playerToDraw.x + screenWidth / 2, gameWidth - playerToDraw.x + screenWidth / 2, x);
        y = valueInRange(-playerToDraw.y + screenHeight / 2, gameHeight - playerToDraw.y + screenHeight / 2, y);
      } else {
        x = valueInRange(-cell.x - player.x + screenWidth / 2 + (cell.radius / 3), gameWidth - cell.x + gameWidth - player.x + screenWidth / 2 - (cell.radius / 3), x);
        y = valueInRange(-cell.y - player.y + screenHeight / 2 + (cell.radius / 3), gameHeight - cell.y + gameHeight - player.y + screenHeight / 2 - (cell.radius / 3), y);
      }
      spin += increase;
      xstore[i] = x;
      ystore[i] = y;
    }
    /* if (wiggle >= player.radius/ 3) inc = -1;
    *if (wiggle <= player.radius / -3) inc = +1;
    *wiggle += inc;
    */
    for (let i = 0; i < points; ++i) {
      if (i === 0) {
        graph.beginPath();
        graph.moveTo(xstore[i], ystore[i]);
      } else if (i > 0 && i < points - 1) {
        graph.lineTo(xstore[i], ystore[i]);
      } else {
        graph.lineTo(xstore[i], ystore[i]);
        graph.lineTo(xstore[0], ystore[0]);
      }
    }
    graph.lineJoin = 'round';
    graph.lineCap = 'round';
    graph.fill();
    graph.stroke();
    let nameCell = '';
    if (isCurrentPlayer(playerToDraw.id)) {
      nameCell = player.name;
    } else {
      nameCell = playerToDraw.name;
    }

    let fontSize = Math.max(cell.radius / 3, 12);
    graph.lineWidth = playerConfig.textBorderSize;
    graph.fillStyle = playerConfig.textColor;
    graph.strokeStyle = playerConfig.textBorder;
    graph.miterLimit = 1;
    graph.lineJoin = 'round';
    graph.textAlign = 'center';
    graph.textBaseline = 'middle';
    graph.font = `bold ${fontSize}px sans-serif`;

    if (toggleMassState === 0) {
      graph.strokeText(nameCell, circle.x, circle.y);
      graph.fillText(nameCell, circle.x, circle.y);
    } else {
      graph.strokeText(nameCell, circle.x, circle.y);
      graph.fillText(nameCell, circle.x, circle.y);
      graph.font = `bold ${Math.max(fontSize / 3 * 2, 10)}px sans-serif`;
      if (nameCell.length === 0) fontSize = 0;
      graph.strokeText(Math.round(cell.mass), circle.x, circle.y + fontSize);
      graph.fillText(Math.round(cell.mass), circle.x, circle.y + fontSize);
    }
  });
}

// drawGameObject
// Draw's a single game object based on type.  In the future we can make this more object oriented.
function drawGameObject(obj) {
  //console.log('drawGameObject');
  //console.dir(obj);

  if (obj.type == 'player') {
    drawPlayer(obj);
  } else if (obj.type == 'food') {
    drawFood(obj);
  }
}

function drawborder() {
  graph.lineWidth = 1;
  graph.strokeStyle = playerConfig.borderColor;

  // Left-vertical.
  if (player.x <= screenWidth / 2) {
    graph.beginPath();
    graph.moveTo(screenWidth / 2 - player.x, 0 ? player.y > screenHeight / 2 : screenHeight / 2 - player.y);
    graph.lineTo(screenWidth / 2 - player.x, gameHeight + screenHeight / 2 - player.y);
    graph.strokeStyle = lineColor;
    graph.stroke();
  }

  // Top-horizontal.
  if (player.y <= screenHeight / 2) {
    graph.beginPath();
    graph.moveTo(0 ? player.x > screenWidth / 2 : screenWidth / 2 - player.x, screenHeight / 2 - player.y);
    graph.lineTo(gameWidth + screenWidth / 2 - player.x, screenHeight / 2 - player.y);
    graph.strokeStyle = lineColor;
    graph.stroke();
  }

  // Right-vertical.
  if (gameWidth - player.x <= screenWidth / 2) {
    graph.beginPath();
    graph.moveTo(gameWidth + screenWidth / 2 - player.x, screenHeight / 2 - player.y);
    graph.lineTo(gameWidth + screenWidth / 2 - player.x, gameHeight + screenHeight / 2 - player.y);
    graph.strokeStyle = lineColor;
    graph.stroke();
  }

  // Bottom-horizontal.
  if (gameHeight - player.y <= screenHeight / 2) {
    graph.beginPath();
    graph.moveTo(gameWidth + screenWidth / 2 - player.x, gameHeight + screenHeight / 2 - player.y);
    graph.lineTo(screenWidth / 2 - player.x, gameHeight + screenHeight / 2 - player.y);
    graph.strokeStyle = lineColor;
    graph.stroke();
  }
}

function gameLoop() {
  if (died) {
    graph.fillStyle = '#333333';
    graph.fillRect(0, 0, screenWidth, screenHeight);
    graph.textAlign = 'center';
    graph.fillStyle = '#FFFFFF';
    graph.font = 'bold 30px sans-serif';
    graph.fillText('You died!', screenWidth / 2, screenHeight / 2);
  } else if (!disconnected) {
    if (gameStart) {
      graph.clearRect(0, 0, screenWidth, screenHeight);
      document.body.style.backgroundPosition = `${xoffset - player.x}px ${yoffset - player.y}px`;
      //foods.forEach(drawFood);
      //fireFood.forEach(drawFireFood);
      //viruses.forEach(drawVirus);
      //bots.forEach(drawBots);

      if (borderDraw) {
        drawborder();
      }

      gameObjects.forEach(drawGameObject);

/*
      // Sort the users in order to display larger users "on top" of smaller users as they get eaten
      const orderMass = [];
      for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < users[i].cells.length; j++) {
          orderMass.push({
            nCell: i,
            nDiv: j,
            mass: users[i].cells[j].mass
          });
        }
      }
      orderMass.sort((obj1, obj2) => {
        return obj1.mass - obj2.mass;
      });
      drawPlayers(orderMass);
*/
      socket.emit(GameEvents.heartbeat, target); // playerSendTarget "Heartbeat".
    } else {
    	graph.fillStyle = '#333333';
		graph.fillRect(0, 0, screenWidth, screenHeight);
		graph.textAlign = 'center';
		graph.fillStyle = '#FFFFFF';
		graph.font = 'bold 30px sans-serif';
    	if(!gameStartPending) {
    		graph.fillText('Game Over!', screenWidth / 2, screenHeight / 2);
    	} else if(gameStartPending) {
    		graph.fillText('Loading...', screenWidth / 2, screenHeight / 2);
    	}
    }
  } else {
    graph.fillStyle = '#333333';
    graph.fillRect(0, 0, screenWidth, screenHeight);
    graph.textAlign = 'center';
    graph.fillStyle = '#FFFFFF';
    graph.font = 'bold 30px sans-serif';
    if (kicked) {
      if (reason !== '') {
        graph.fillText('You were kicked for:', screenWidth / 2, screenHeight / 2 - 20);
        graph.fillText(reason, screenWidth / 2, screenHeight / 2 + 20);
      } else {
        graph.fillText('You were kicked!', screenWidth / 2, screenHeight / 2);
      }
    } else {
      graph.fillText('Disconnected!', screenWidth / 2, screenHeight / 2);
    }
  }
}

function animloop() {
  animLoopHandle = window.requestAnimFrame(animloop);
  gameLoop();
}

function startGame(type) {
  playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '').substring(0, 25);
  playerType = type;

  // screenWidth = window.innerWidth;
  // screenHeight = window.innerHeight;

  document.getElementById('startMenuWrapper').style.maxHeight = '0px';
  document.getElementById('gameAreaWrapper').style.opacity = 1;
  if (!socket) {
    socket = io({query: 'type=' + type});
    setupSocket(socket);
    gameStartPending = true;
  }
  if (!animLoopHandle) {
    animloop();
    socket.emit(GameEvents.respawn);
  }
}

// Checks if the nick chosen contains valid alphanumeric characters (and underscores).
function validNick() {
  const regex = /^\w*$/;
  debug('Regex Test', regex.exec(playerNameInput.value));
  return regex.exec(playerNameInput.value) !== null;
}

window.onload = () => {
  const btn = document.getElementById('startButton');
  const btnS = document.getElementById('spectateButton');
  const nickErrorText = document.querySelector('#startMenu .input-error');

  btnS.onclick = () => {
    startGame('spectate');
  };
  btn.onclick = () => {
    // Checks if the nick is valid.
    if (validNick()) {
      nickErrorText.style.opacity = 0;
      startGame('player');
    } else {
      nickErrorText.style.opacity = 1;
    }
  };

  const settingsMenu = document.getElementById('settingsButton');
  const settings = document.getElementById('settings');
  // const instructions = document.getElementById('instructions');

  settingsMenu.onclick = () => {
    if (settings.style.maxHeight === '300px') {
      settings.style.maxHeight = '0px';
    } else {
      settings.style.maxHeight = '300px';
    }
  };

  playerNameInput.addEventListener('keypress', (e) => {
    const key = e.which || e.keyCode;

    if (key === KEY_ENTER) {
      if (validNick()) {
        nickErrorText.style.opacity = 0;
        startGame('player');
      } else {
        nickErrorText.style.opacity = 1;
      }
    }
  });
};

// Register when the mouse goes off the canvas.
function outOfBounds() {
  if (!continuity) {
    target = { x: 0, y: 0 };
  }
}

// Chat command callback functions.
function keyInput(event) {
  const key = event.which || event.keyCode;
  if (key === KEY_FIREFOOD && reenviar) {
    socket.emit(GameEvents.fireFood);
    reenviar = false;
  }else if (key === KEY_SPLIT && reenviar) {
    document.getElementById('split_cell').play();
    socket.emit(GameEvents.virusSplit);
    reenviar = false;
  }else if (key === KEY_CHAT) {
    document.getElementById('chatInput').focus();
  }
}

document.getElementById('feed').onclick = () => {
  socket.emit(GameEvents.fireFood);
  reenviar = false;
};

document.getElementById('split').onclick = () => {
  socket.emit(GameEvents.virusSplit);
  reenviar = false;
};

function horizontal(key) {
  return key === KEY_LEFT || key === KEY_RIGHT;
}

function vertical(key) {
  return key === KEY_DOWN || key === KEY_UP;
}

function directional(key) {
  return horizontal(key) || vertical(key);
}

// Updates the direction array including information about the new direction.
function newDirection(direction, list, isAddition) {
  let result = false;
  let found = false;
  for (let i = 0, len = list.length; i < len; i++) {
    if (list[i] === direction) {
      found = true;
      if (!isAddition) {
        result = true;
        // Removes the direction.
        list.splice(i, 1);
      }
      break;
    }
  }
  // Adds the direction.
  if (isAddition && found === false) {
    result = true;
    list.push(direction);
  }

  return result;
}

// Updates the target according to the directions in the directions array.
function updateTarget(list) {
  target = { x: 0, y: 0 };
  let directionHorizontal = 0;
  let directionVertical = 0;
  for (let i = 0, len = list.length; i < len; i++) {
    if (directionHorizontal === 0) {
      if (list[i] === KEY_LEFT) directionHorizontal -= Number.MAX_VALUE;
      else if (list[i] === KEY_RIGHT) directionHorizontal += Number.MAX_VALUE;
    }
    if (directionVertical === 0) {
      if (list[i] === KEY_UP) directionVertical -= Number.MAX_VALUE;
      else if (list[i] === KEY_DOWN) directionVertical += Number.MAX_VALUE;
    }
  }
  target.x += directionHorizontal;
  target.y += directionVertical;
  console.log("updateTarget: x: " + target.x + " , y: " + target.y);
}

// Function called when a key is pressed, will change direction if arrow key.
function directionDown(event) {
  const key = event.which || event.keyCode;

  if (directional(key)) {
    directionLock = true;
    if (newDirection(key, directions, true)) {
      updateTarget(directions);
      console.log("Heartbeat sent.");
      socket.emit(GameEvents.heartbeat, target);
    }
  }
}

// Function called when a key is lifted, will change direction if arrow key.
function directionUp(event) {
  const key = event.which || event.keyCode;
  if (directional(key)) {
    if (newDirection(key, directions, false)) {
      updateTarget(directions);
      if (directions.length === 0) directionLock = false;
      socket.emit(GameEvents.heartbeat, target);
    }
  }
}

function checkLatency() {
  // Ping.
  startPingTime = Date.now();
  socket.emit(GameEvents.gamePing);
}

function toggleDarkMode() {
  const LINELIGHT = '#000000';
  const LINEDARK = '#ff0099';

  if (LIGHT_THEME === 'light') {
    document.body.className = 'dark';
    lineColor = LINEDARK;
    LIGHT_THEME = 'dark';
    chat.addSystemLine('Dark mode enabled.');
  } else {
    document.body.className = '';
    lineColor = LINELIGHT;
    LIGHT_THEME = 'light';
    chat.addSystemLine('Dark mode disabled.');
  }
}

function toggleBorder() {
  if (!borderDraw) {
    borderDraw = true;
    chat.addSystemLine('Showing border.');
  } else {
    borderDraw = false;
    chat.addSystemLine('Hiding border.');
  }
}

function toggleMass() {
  if (toggleMassState === 0) {
    toggleMassState = 1;
    chat.addSystemLine('Viewing mass enabled.');
  } else {
    toggleMassState = 0;
    chat.addSystemLine('Viewing mass disabled.');
  }
}

function toggleContinuity() {
  if (!continuity) {
    continuity = true;
    chat.addSystemLine('Continuity enabled.');
  } else {
    continuity = false;
    chat.addSystemLine('Continuity disabled.');
  }
}

function toggleRoundFood(args) {
  if (args || foodSides < 10) {
    foodSides = (args && !isNaN(args[0]) && +args[0] >= 3) ? +args[0] : 10;
    chat.addSystemLine('Food is now rounded!');
  } else {
    foodSides = 5;
    chat.addSystemLine('Food is no longer rounded!');
  }
}

// TODO: Break out many of these GameControls into separate classes.

chat.registerCommand('ping', 'Check your latency.', () => {
  checkLatency();
});

chat.registerCommand('dark', 'Toggle dark mode.', () => {
  toggleDarkMode();
});

chat.registerCommand('border', 'Toggle visibility of border.', () => {
  toggleBorder();
});

chat.registerCommand('mass', 'Toggle visibility of mass.', () => {
  toggleMass();
});

chat.registerCommand('continuity', 'Toggle continuity.', () => {
  toggleContinuity();
});

chat.registerCommand('roundfood', 'Toggle food drawing.', (args) => {
  toggleRoundFood(args);
});

chat.registerCommand('help', 'Information about the chat commands.', () => {
  chat.printHelp();
});

chat.registerCommand('login', 'Login as an admin.', (args) => {
  socket.emit(GameEvents.pass, args);
});

chat.registerCommand('kick', 'Kick a player, for admins only.', (args) => {
  socket.emit(GameEvents.kick, args);
});

function gameInput(mouse) {
  if (!directionLock) {
    target.x = mouse.clientX - screenWidth / 2;
    target.y = mouse.clientY - screenHeight / 2;
  }
}

function touchInput(touch) {
  touch.preventDefault();
  touch.stopPropagation();
  if (!directionLock) {
    target.x = touch.touches[0].clientX - screenWidth / 2;
    target.y = touch.touches[0].clientY - screenHeight / 2;
  }
}

const visibleBorderSetting = document.getElementById('visBord');
visibleBorderSetting.onchange = toggleBorder;

const showMassSetting = document.getElementById('showMass');
showMassSetting.onchange = toggleMass;

let continuitySetting = document.getElementById('continuity');
continuitySetting.onchange = toggleContinuity;

continuitySetting = document.getElementById('roundFood');
continuitySetting.onchange = toggleRoundFood;

c.width = screenWidth; c.height = screenHeight;
c.addEventListener('mousemove', gameInput, false);
c.addEventListener('mouseout', outOfBounds, false);
c.addEventListener('keypress', keyInput, false);
c.addEventListener('keyup', (event) => {reenviar = true; directionUp(event); }, false);
c.addEventListener('keydown', directionDown, false);
c.addEventListener('touchstart', touchInput, false);
c.addEventListener('touchmove', touchInput, false);

window.requestAnimFrame = (() => {
  return  window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame ||
  function( callback ) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

window.cancelAnimFrame = (() => {
  return  window.cancelAnimationFrame || window.mozCancelAnimationFrame;
})();

debug('[STARTING CLIENT]');
