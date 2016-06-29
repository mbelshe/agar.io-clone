
//Enumeration for client/server communication
//TODO: Optimize the string lengths which correspond to numbers(heartbeat, servertellplayermove, etc)
var GameEvents = {
	serverTellPlayerMove : 0, //serverTellPlayerMove'
	leaderboard : 1, //'leaderboard',
	kick : 2, //'kick', 
	playerChat : 3, // 'playerChat',
	gotit : 4, //'gotit', 
	windowResized : 5, //'windowResized', 
	split : 6, //'split', 
	heartbeat : 7, //'heartbeat', 
	respawn : 8, //'respawn', 
	fireFood : 9, //'fireFood', 
	gamePing : 10, //'gamePing', 
	pass : 11, //'pass', 
	kick : 12, //'kick', 
	playerJoin : 13, //'playerJoin', 
	gameSetup : 14, //'gameSetup', 
	gamePong : 15, //'gamePong', 
	welcome : 16, //'welcome', 
	playerDisconnect : 17, //'playerDisconnect', 
	serverSendPlayerChat : 18, //'serverSendPlayerChat', 
	serverMSG : 19, //'serverMSG', 
	playerDied : 20, //'playerDied', 
	RIP : 21, //'RIP', 
	virusSplit : 22, //'virusSplit', 
	playerScore :  23, //'playerScore', 
	connect_failed : 24 //'connect_failed' 	
};
export default GameEvents;
