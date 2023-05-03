
var express = require('express');
const dotenv = require("dotenv");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
var _ = require("lodash");
var bcrypt = require('bcryptjs');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var bodyParser = require('body-parser');
const moment = require('moment');
const date = require('date-and-time');
let referralCodeGenerator = require('referral-code-generator');
var unirest = require("unirest");
const payu = require("pay-u").newOrder


const mysql = require('mysql');
const { Console } = require('console');
const pool = mysql.createPool({
	host: '127.0.0.1',
	user: 'root',
	password: '',
	database: 'ludocoders_db',
});

var currVersion = 12;
var apkUrl = "https://drive.google.com/file/d/1ob_RRmavRtuoSyDfLpUQT5Dz7Rnoz5rv/view?usp=sharing";

let razorpay_key_id = "rzp_live_o2NKHaU3IQGV";
let razorpay_key_secret = "IEHR3s5MkfCVzEnTQOnTL2";


const instance = new Razorpay({
	key_id: razorpay_key_id,
	key_secret: razorpay_key_secret,
});


dotenv.config();
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.set('port', process.env.PORT || 2980);



var socketInfo = {};
var tournamentMode = {};

var playerRoutePos1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
	27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
var playerRoutePos3 = [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 64, 65, 66, 67, 68, 69];
var playerRoutePos2 = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
	50, 51, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 58, 59, 60, 61, 62, 63];
var playerRoutePos4 = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
	27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 70, 71, 72, 73, 74, 75];
var safeDice = [9, 22, 35, 48, 1, 14, 27, 40];
var botName = ["Aarav", "Aarush", "Aayush", "Abdul", "Abeer", "Abhimanyu", "Abhiram", "Aditya", "Advik", "Amol", "Anirudh", "Arjun", "Azaan", "Bachittar", "Balendra", "Balvan",
	"Balveer", "Banjeet", "Chanakya", "Chandran", "Charan", "Chatresh", "Daksh", "Darsh", "Dev", "Dhruv", "Darpan", "Farhan", "Fiyaz", "Gautam", "Girik", "Girindra", "Mani", "Girish", "Gopal",
	"Gunbir", "Harsh", "Hardik", "Hritik", "Ishaan", "Imaran", "Jason", "Jatin", "Jai", "Moorthy", "Alagu", "Amla", "Karthik", "Sai", "Rakshan", "Harsan", "Deepak",
	"Sandeep", "Varma", "Mandela", "Ananth", "Manikandan", "Baskar", "Raja", "Manivannan", "Ranga", "Manivel", "Balaji", "Sakthi", "Sridhar", "Srikanth", "Vivek", "Muruga", "Senthil",
];



app.get("/online", function (req, res) {
	res.json(clients);
});


setInterval(function () {
	getModes();
}, 500);

setInterval(function () {
	for (var j in tournamentMode) {
		var tms = tournamentMode[j];
		var now = moment();
		var start = tms.startTime;
		var config = "DD/MM/YYYY HH:mm:ss";
		var ms = moment(start, config).diff(moment(now, config));
		var cMinutes = moment.utc(ms).format("mm");
		var cMinutes2 = moment.utc(ms).format("ss");
		//console.log("ddd " + parseInt(cMinutes2));
		if (parseInt(cMinutes) <= 0 && parseInt(cMinutes2) <= 0) {
			if (tms.status == "running") {
				tms.status = "reconnect";
				tms.startTime = moment().add(2, 'seconds');
			} else if (tms.status == "reconnect") {
				if (tms.totalPlayers == 0) {
					tms.status = "delete";
				} else {
					if (tms.totalPlayers >= tms.players) {
						tms.status = "starting";
						tms.startTime = moment().add(12, 'seconds');
					} else {
						if (tms.bot == "No") {
							for (var k in tms.joinedPlayers) {
								tms.joinedPlayers[k].socket.emit("NoOtherPlayer", {
								});
							}
						}
						tms.status = "delete";
					}
				}
			} else if (tms.status == "starting") {
				var roomID = parseInt(tms.tournamentID) + 1;
				var localCount = 0;
				for (var k in tms.joinedPlayers) {
					var lSocket = tms.joinedPlayers[k];
					createRoom(lSocket, roomID, tms);
					localCount += 1;
					if (localCount >= tms.players) {
						localCount = 0;
						roomID += 1;
					}
				}
				delete tournamentMode[tms.id];
			}
		}

		var rIndex = Math.floor(Math.random() * 5);
		if (rIndex == 0)
			tms.botTotalPlayers += 1;
		tms.botTotalPlayers = tms.totalPlayers + tms.botTotalPlayers;
	}
	for (var j in tournamentMode) {
		var tms = tournamentMode[j];
		if (tms.status == "delete") {
			delete tournamentMode[tms.id];
		}
	}
}, 300);
function getTournaments(lSocket) {
	var empty = 0;
	var tCount = 0;
	var chJoined2 = "no";
	for (var j in tournamentMode) {
		var tms = tournamentMode[j];
		for (var k in tms.joinedPlayers) {
			if (tms.joinedPlayers[k].socket == lSocket) {
				chJoined2 = "yes";
			}
		}
	}
	for (var j in tournamentMode) {
		var tms = tournamentMode[j];
		var now = moment();
		var start = tms.startTime;
		var config = "DD/MM/YYYY HH:mm:ss";
		var ms = moment(start, config).diff(moment(now, config));
		var cMinutes = moment.utc(ms).format("mm:ss");
		var cMinutes2 = moment.utc(ms).format("ss");
		console.log(cMinutes + " " + tms.status + " " + tms.totalPlayers);
		var chJoined = "no";
		for (var k in tms.joinedPlayers) {
			var lSocket2 = tms.joinedPlayers[k];
			if (lSocket2.socket == lSocket)
				chJoined = "yes";
		}
		if (tms.status != "starting") {
			lSocket.emit("GetDocuments", {
				id: tms.id, bot: tms.bot, entry: tms.entry, pricePool: tms.pricePool, name: tms.name, firstprize: tms.firstprize,
				secondprize: tms.secondprize, thirdprize: tms.thirdprize, tournamentID: tms.tournamentID, cMinutes: cMinutes, cMinutes2: cMinutes2,
				totalPlayers: tms.botTotalPlayers, realTotalPlayers: tms.totalPlayers, status: "yes", running: tms.status, players: tms.players, chJoined: chJoined, chJoined2: chJoined2, tCount: tCount
			});
		} else {
			for (var k in tms.joinedPlayers) {
				var lSocket2 = tms.joinedPlayers[k];
				if (lSocket2.socket == lSocket) {
					lSocket.emit("GetDocuments", {
						id: tms.id, bot: tms.bot, entry: tms.entry, pricePool: tms.pricePool, name: tms.name, firstprize: tms.firstprize,
						secondprize: tms.secondprize, thirdprize: tms.thirdprize, tournamentID: tms.tournamentID, cMinutes: cMinutes, cMinutes2: cMinutes2,
						totalPlayers: tms.botTotalPlayers, realTotalPlayers: tms.totalPlayers, status: "yes", running: tms.status, players: tms.players, chJoined: chJoined, chJoined2: chJoined2, tCount: tCount
					});
				}

			}
		}

		empty = 1;
		tCount += 1;
	}
	if (empty == 0) {
		lSocket.emit("GetDocuments", {
			status: "no"
		});
	}
	lSocket.emit("GetDocuments", {
		status: "complete", tCount: tCount
	});

}

function getModes() {
	pool.query("SELECT * FROM players", function (err, result, fields) {
		if (!err) {
			for (var i = 0; i < result.length; i++) {
				var done = false;
				for (var j in tournamentMode) {
					var tms = tournamentMode[j];
					if (tms.id.toString() == result[i].id.toString()) {
						done = true;
					}
				}
				if (!done) {
					var socId = result[i].id;
					tournamentMode[socId] = [];
					tournamentMode[socId].id = result[i].id;
					tournamentMode[socId].socId = 0;
					const now2 = new Date();
					const value = date.format(now2, 'HHmmss');
					tournamentMode[socId].tournamentID = value + "" + result[i].id;
					tournamentMode[socId].entry = result[i].entry_fee;
					tournamentMode[socId].pricePool = (parseFloat(result[i].firstprize) + parseFloat(result[i].secondprize) + parseFloat(result[i].thirdprize));
					tournamentMode[socId].name = result[i].lobbytype;
					tournamentMode[socId].firstprize = result[i].firstprize;
					tournamentMode[socId].secondprize = result[i].secondprize;
					tournamentMode[socId].thirdprize = result[i].thirdprize;
					tournamentMode[socId].bot = result[i].bot;
					if (result[i].lobbytype == "1v1 Battle")
						tournamentMode[socId].players = 2;
					else tournamentMode[socId].players = 4;
					tournamentMode[socId].startTime = moment().add(result[i].start_time, 'seconds');
					tournamentMode[socId].endTime = 3;
					tournamentMode[socId].status = "running";
					var tPlayersInfo = {};
					tournamentMode[socId].joinedPlayers = tPlayersInfo;
					tournamentMode[socId].totalPlayers = 0;
					tournamentMode[socId].botTotalPlayers = 0;
				}
			}
		}
	});
}
function AddUserTournaments(data, socket) {
	var alChe = false;
	for (var j in tournamentMode) {
		var tms = tournamentMode[j];
		for (var k in tms.joinedPlayers) {
			if (tms.joinedPlayers[k].email == data.email) {
				alChe = true;
			}
		}
	}
	if (alChe) {
		socket.emit("AlreadyJoined", {
			alreadyJoined: "yes"
		});
	} else {
		for (var j in tournamentMode) {
			var tms = tournamentMode[j];
			//console.log("loosu " + tms.tournamentID.toString() + " " + data.tournamentID.toString());
			if (tms.tournamentID.toString() == data.tournamentID.toString()) {
				var len = 1;
				if (tms.bot == "Yes")
					len = tms.players;
				else len = 1;
				//console.log("weee " + tms.tournamentID);
				for (var i = 0; i < len; i++) {
					//console.log("id " + i);
					if (i == 0)
						tms.socId = socket.id;
					else
						tms.socId = socket.id + i;
					tms.joinedPlayers[tms.socId] = [];
					tms.joinedPlayers[tms.socId].socId = tms.socId;
					tms.joinedPlayers[tms.socId].socket = socket;
					tms.joinedPlayers[tms.socId].avatarStr = data.avatarStr;
					tms.joinedPlayers[tms.socId].tbot = tms.bot;
					tms.joinedPlayers[tms.socId].bot = (i == 0 ? 0 : 1);
					if (i != 0) {
						var rIndex = Math.floor(Math.random() * botName.length);
						tms.joinedPlayers[tms.socId].name = botName[rIndex];
						var rIndex2 = Math.floor(Math.random() * 50);
						tms.joinedPlayers[tms.socId].points = parseInt(20000 + (rIndex2 * 100));
						tms.joinedPlayers[tms.socId].email = tms.socId + "@gmail.com";
					} else {
						tms.joinedPlayers[tms.socId].email = data.email;
						tms.joinedPlayers[tms.socId].name = data.name;
						tms.joinedPlayers[tms.socId].points = data.points;
						tms.joinedPlayers[tms.socId].played = parseInt(data.played);
					}
				}
			}

			var tPlayers = 0;
			for (var k in tms.joinedPlayers) {
				tPlayers += 1;
			}
			tms.totalPlayers = tPlayers;
		}
	}

}
function createRoom(lSocket, roomID, tms) {
	var roomSocket = io.sockets.adapter.rooms[roomID + ""];
	if (roomSocket == undefined) {
		lSocket.socket.join(roomID + "");
		console.log("room id  " + roomID);
		//lSocket.socket.emit("RoomConnected", { room: roomID });
		lSocket.socket.adapter.rooms[roomID + ""].currPlay = 0;
		lSocket.socket.adapter.rooms[roomID + ""].play = 0;
		lSocket.socket.adapter.rooms[roomID + ""].searchOne = 0;
		lSocket.socket.adapter.rooms[roomID + ""].waitingCount = 0;
		console.log("pp " + tms.players);
		lSocket.socket.adapter.rooms[roomID + ""].player_count = parseInt(tms.players);
		lSocket.socket.adapter.rooms[roomID + ""].GameTimer = 0;
		lSocket.socket.adapter.rooms[roomID + ""].winCount = 0;
		lSocket.socket.adapter.rooms[roomID + ""].currRValue = 0;
		lSocket.socket.adapter.rooms[roomID + ""].con_six = 0;
		lSocket.socket.adapter.rooms[roomID + ""].gameover = 0;
		lSocket.socket.adapter.rooms[roomID + ""].tTimer = 0;
		lSocket.socket.adapter.rooms[roomID + ""].start_timer;
		lSocket.socket.adapter.rooms[roomID + ""].gameOverInfo = [];
		lSocket.socket.adapter.rooms[roomID + ""].prize1 = parseFloat(tms.firstprize);
		lSocket.socket.adapter.rooms[roomID + ""].prize2 = parseFloat(tms.secondprize);
		lSocket.socket.adapter.rooms[roomID + ""].prize3 = parseFloat(tms.thirdprize);
		lSocket.socket.adapter.rooms[roomID + ""].entryFee = parseFloat(tms.entry);
		lSocket.socket.adapter.rooms[roomID + ""].cutDice = 0;
		lSocket.socket.adapter.rooms[roomID + ""].DiceHome = 0;
		JoinPlayers(lSocket, roomID);
	} else {
		lSocket.socket.join(roomID + "");
		//lSocket.socket.emit("RoomConnected", { room: roomID });
		JoinPlayers(lSocket, roomID);
	}
}
function JoinPlayers(lSocket, roomID) {
	var soRoom = lSocket.socket.adapter.rooms[roomID];
	for (var j = 0; j < 1; j++) {
		var socId = lSocket.socId;
		socketInfo[socId] = [];
		socketInfo[socId].socket = lSocket.socket;
		socketInfo[socId].socId = lSocket.socId;
		socketInfo[socId].name = lSocket.name;
		socketInfo[socId].email = lSocket.email;
		socketInfo[socId].points = parseInt(lSocket.points);
		socketInfo[socId].room = roomID;
		socketInfo[socId].avatarStr = lSocket.avatarStr;
		socketInfo[socId].localSocketId = socId;
		socketInfo[socId].win = 0;
		//socketInfo[socId].entryPoint = parseInt(data.entryPoint);
		//socketInfo[socId].winPoint = parseInt(data.winPoint);
		socketInfo[socId].diceSeatValue1 = 0;
		socketInfo[socId].diceSeatValue2 = 0;
		socketInfo[socId].diceSeatValue3 = 0;
		socketInfo[socId].diceSeatValue4 = 0;
		socketInfo[socId].diceSelectValue = 0;
		socketInfo[socId].score = 0;
		socketInfo[socId].status = "";
		socketInfo[socId].skip = 0;
		socketInfo[socId].active = true;
		socketInfo[socId].cheInternet = "";
		socketInfo[socId].pause = true;
		socketInfo[socId].seconds = 0;
		socketInfo[socId].bot = lSocket.bot;
		socketInfo[socId].botAvatarValue = -1;
		socketInfo[socId].botChooseTimer = 0;
		socketInfo[socId].tbot = lSocket.tbot;
		socketInfo[socId].botCutValue = 0;
		socketInfo[socId].botSelectValue = 0;
		socketInfo[socId].played = parseInt(lSocket.played);
		var ch2 = true;
		let floop;
		if (soRoom.player_count == 2)
			floop = [1, 2];
		else if (soRoom.player_count == 3)
			floop = [1, 2, 3];
		else if (soRoom.player_count == 4)
			floop = [1, 2, 3, 4];
		for (let i of floop) {
			if (ch2) {
				var seatAvailable = false;
				for (var k in socketInfo) {
					var lSocket2 = socketInfo[k];
					if (i == lSocket2.seat && lSocket2.active == true && roomID == lSocket2.room)
						seatAvailable = true;
				}
				if (!seatAvailable) {
					ch2 = false;
					socketInfo[socId].seat = i;
				}
			}
		}
		if (socketInfo[socId].seat == 2) {
			//socketInfo[socId].diceSeatValue1 = 29;
			//socketInfo[socId].diceSeatValue2 = 29;
		}

		if (socketInfo[socId].bot == 1) {
			botPlayerAvatarValue(socketInfo[socId]);
		}
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			if (roomID == lSocket2.room) {
				lSocket2.socket.emit("PlayerJoin", {
					seat: (lSocket2.seat - 1),
					name: lSocket2.name,
					avatarStr: lSocket2.avatarStr,
					points: lSocket2.points,
					bot: lSocket2.bot,
					botAvatarValue: lSocket2.botAvatarValue
				});
				lSocket2.socket.broadcast.in(lSocket2.room).emit("PlayerJoin", {
					seat: (lSocket2.seat - 1),
					name: lSocket2.name,
					avatarStr: lSocket2.avatarStr,
					points: lSocket2.points,
					bot: lSocket2.bot,
					botAvatarValue: lSocket2.botAvatarValue
				});
			}
		}

		//console.log("name " + (socketInfo[socId].seat - 1));
		if (socketInfo[socId].bot == 0) {
			//console.log("bot " + (socketInfo[socId].seat - 1));
			lSocket.socket.emit("YOU", {
				seat: (socketInfo[socId].seat - 1),
				email: socketInfo[socId].email,
				player_count: soRoom.player_count
			});
		}
	}
	//lSocket.socket.emit("YOU", { seat: (socketInfo[lSocket.socket.id].seat - 1) });
	console.log(soRoom.length + " " + soRoom.player_count);
	if (socketInfo[socId].tbot == "No") {
		if (lSocket.socket.adapter.rooms[roomID].play == 0 && soRoom.length >= soRoom.player_count) {
			lSocket.socket.adapter.rooms[roomID].play = 1;
			//console.log("wlee ");
		}
	} else {
		if (lSocket.socket.adapter.rooms[roomID].play == 0 && botPlayerCount(lSocket) >= soRoom.player_count) {
			lSocket.socket.adapter.rooms[roomID].play = 1;
			//console.log("wlee ");
		}
	}
}
function botPlayerCount(lSocket) {
	var pCount = 0;
	for (var k in socketInfo) {
		var lSocket2 = socketInfo[k];
		if (lSocket2.socket == lSocket.socket) {
			pCount += 1;
		}
	}
	return pCount;
}
function botPlayerAvatarValue(lSocket) {
	var ch7 = true;
	for (var i = 0; i < 4 && ch7; i++) {
		var pCount = Math.floor(Math.random() * 50);
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			if (lSocket2.socId == lSocket.socId && lSocket.botAvatarValue != 0 && lSocket2.botAvatarValue != pCount && ch7) {
				lSocket.botAvatarValue = pCount;
				ch7 = false;
			}
		}
	}
}
setInterval(function () {
	for (var k in socketInfo) {
		var lSocket2 = socketInfo[k];
		if (lSocket2.cheInternet == "noInternet") {
			var endDate = new Date();
			var difference = endDate.getTime() - lSocket2.liveDate.getTime();
			var resultInMinutes = Math.round(difference / 60000);
			if (resultInMinutes >= 10)
				delete socketInfo[lSocket2.socket.id];
		}
	}

	for (var i in socketInfo) {
		var lSocket = socketInfo[i];
		if (lSocket.socket.adapter.rooms[lSocket.room] != undefined) {
			lSocket.socket.adapter.rooms[lSocket.room].searchOne = 0;
		}
	}
	for (var i in socketInfo) {
		var lSocket = socketInfo[i];
		var socRoom = lSocket.socket.adapter.rooms[lSocket.room];
		if (socRoom != undefined) {
			if (socRoom.play == 1 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				socRoom.waitingCount += 1;
				if (socRoom.waitingCount == 1) {
					for (var k in socketInfo) {
						var lSocket4 = socketInfo[k];
						if (lSocket4.room == lSocket.room) {
							VerifyChips(lSocket4.email, socRoom.entryFee, lSocket4.socket);
							splitDiceFunc(lSocket4, 0);
							lSocket4.socket.emit("DiceInit", { seat: (lSocket4.seat - 1) });
							lSocket4.socket.broadcast.in(lSocket4.room).emit("DiceInit", { seat: (lSocket4.seat - 1) });
						}
					}
				}
				if (socRoom.waitingCount >= 30) {
					socRoom.waitingCount = 0;
					socRoom.play = 2;
					lSocket.socket.emit("StartPlay", {
						currPlay: socRoom.currPlay
					});
					lSocket.socket.broadcast.in(lSocket.room).emit("StartPlay", {
						currPlay: socRoom.currPlay
					});
					socRoom.start_timer = moment();
					socRoom.start_timer2 = moment().add(600, 'seconds');
				}
			} else if (socRoom.play == 22 && socRoom.searchOne == 0) {
				for (var i in socketInfo) {
					var lSocket4 = socketInfo[i];
					if (lSocket4.room == lSocket.room && socRoom.currPlay == (lSocket4.seat - 1)) {
						if (lSocket4.skip >= 3) {
							if (lSocket4.tbot == "Yes")
								removeFunction2(lSocket4.socket, lSocket4.socId);
							else
								removeFunction(lSocket4.socket);
						}
						if (lSocket4.bot == 1)
							lSocket4.botChooseTimer = Math.floor(Math.random() * 90);
					}
				}
				socRoom.searchOne = 1;
				socRoom.play = 2;


				lSocket.socket.emit("StartPlay2", {
					currPlay: socRoom.currPlay
				});
				lSocket.socket.broadcast.in(lSocket.room).emit("StartPlay2", {
					currPlay: socRoom.currPlay
				});
				getGameTimer(socRoom, lSocket);

			} else if (socRoom.play == 2 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				socRoom.GameTimer += 1;
				getGameTimer(socRoom, lSocket);

				for (var i in socketInfo) {
					var lSocket4 = socketInfo[i];
					if (lSocket4.room == lSocket.room && socRoom.currPlay == (lSocket4.seat - 1)) {
						if (lSocket4.bot == 1 && lSocket4.botChooseTimer == socRoom.GameTimer)
							ClickFunc(lSocket4, socRoom);

						if (socRoom.GameTimer >= 100) {
							ClickFunc(lSocket4, socRoom);
						}
					}
				}

			} else if (socRoom.play == 3 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				getGameTimer(socRoom, lSocket);
				socRoom.GameTimer += 1;
				for (var i in socketInfo) {
					var lSocket4 = socketInfo[i];
					if (lSocket4.room == lSocket.room && socRoom.currPlay == (lSocket4.seat - 1)) {
						if (lSocket4.bot == 1 && lSocket4.botChooseTimer == socRoom.GameTimer)
							socRoom.GameTimer += 50;
						if (socRoom.GameTimer >= 50) {
							socRoom.GameTimer = 0;
							var whileChe = true;
							var whileRValue = [0, 1, 2, 3];
							var whileRCount = 0;
							if (Math.floor(Math.random() * 4) == 2) {
								for (var k = 0; k < 4; k++) {
									var temp = whileRValue[k];
									var randomIndex = Math.floor(Math.random() * (4 - k));
									whileRValue[k] = whileRValue[randomIndex];
									whileRValue[randomIndex] = temp;
								}
							}
							while (whileChe) {
								if (whileRValue[whileRCount] == 0)
									if (lSocket4.diceSeatValue1 != 56 && (lSocket4.diceSeatValue1 + socRoom.currRValue) <= 56)
										lSocket4.diceSelectValue = 1;
								if (whileRValue[whileRCount] == 1)
									if (lSocket4.diceSeatValue2 != 56 && (lSocket4.diceSeatValue2 + socRoom.currRValue) <= 56)
										lSocket4.diceSelectValue = 2;
								if (whileRValue[whileRCount] == 2)
									if (lSocket4.diceSeatValue3 != 56 && (lSocket4.diceSeatValue3 + socRoom.currRValue) <= 56)
										lSocket4.diceSelectValue = 3;
								if (whileRValue[whileRCount] == 3)
									if (lSocket4.diceSeatValue4 != 56 && (lSocket4.diceSeatValue4 + socRoom.currRValue) <= 56)
										lSocket4.diceSelectValue = 4;
								whileRCount += 1;
								if (whileRCount >= 4) {
									whileChe = false;
								}
							}
							if (lSocket4.botCutValue == 1) {
								lSocket4.diceSelectValue = lSocket4.botSelectValue;
								//console.log("choo5 " + lSocket4.diceSelectValue);
							}

							SelectDiceFunc(lSocket4, socRoom);
						}
					}
				}

			} else if (socRoom.play == 4 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				getGameTimer(socRoom, lSocket);
				socRoom.GameTimer += 1;
				if (socRoom.GameTimer == 1) {
					for (var i in socketInfo) {
						var lSocket4 = socketInfo[i];
						if (lSocket4.room == lSocket.room && socRoom.currPlay == (lSocket4.seat - 1)) {
							var lsValue = 0;
							var preValue = 0;
							/*var lPlayerRoot;
							if ((lSocket4.seat - 1) == 0)
								lPlayerRoot = playerRoutePos1;
							else if ((lSocket4.seat - 1) == 1)
								lPlayerRoot = playerRoutePos2;
							else if ((lSocket4.seat - 1) == 2)
								lPlayerRoot = playerRoutePos3;
							else if ((lSocket4.seat - 1) == 3)
								lPlayerRoot = playerRoutePos4;*/
							if (lSocket4.diceSelectValue == 1) {
								preValue = lSocket4.diceSeatValue1;
								lSocket4.diceSeatValue1 += socRoom.currRValue;
								lsValue = lSocket4.diceSeatValue1;
								if (lSocket4.diceSeatValue1 == 56)
									socRoom.DiceHome = 1;
							} else if (lSocket4.diceSelectValue == 2) {
								preValue = lSocket4.diceSeatValue2;
								lSocket4.diceSeatValue2 += socRoom.currRValue;
								lsValue = lSocket4.diceSeatValue2;
								if (lSocket4.diceSeatValue2 == 56)
									socRoom.DiceHome = 1;
							} else if (lSocket4.diceSelectValue == 3) {
								preValue = lSocket4.diceSeatValue3;
								lSocket4.diceSeatValue3 += socRoom.currRValue;
								lsValue = lSocket4.diceSeatValue3;
								if (lSocket4.diceSeatValue3 == 56)
									socRoom.DiceHome = 1;
							} else if (lSocket4.diceSelectValue == 4) {
								preValue = lSocket4.diceSeatValue4;
								lSocket4.diceSeatValue4 += socRoom.currRValue;
								lsValue = lSocket4.diceSeatValue4;
								if (lSocket4.diceSeatValue4 == 56)
									socRoom.DiceHome = 1;
							}
							var fSix = 0;
							if (lSocket4.diceSeatValue1 == 56)
								fSix += 1;
							if (lSocket4.diceSeatValue2 == 56)
								fSix += 1;
							if (lSocket4.diceSeatValue3 == 56)
								fSix += 1;
							if (lSocket4.diceSeatValue4 == 56)
								fSix += 1;
							if (fSix == 4)
								lSocket4.status = "full";


							var lScore = lSocket4.score;
							lSocket4.score += socRoom.currRValue;
							if (socRoom.DiceHome == 1)
								lSocket4.score += lSocket4.score;

							lSocket4.socket.emit("MoveDice", {
								currPlay: socRoom.currPlay, diceSeat: lsValue, diceSelectValue: (lSocket4.diceSelectValue - 1), preValue: preValue,
								score: lSocket4.score, lScore: lScore
							});
							lSocket4.socket.broadcast.in(lSocket4.room).emit("MoveDice", {
								currPlay: socRoom.currPlay, diceSeat: lsValue, diceSelectValue: (lSocket4.diceSelectValue - 1), preValue: preValue,
								score: lSocket4.score, lScore: lScore
							});

						}
					}
				}
				if (socRoom.GameTimer == 3) {
					for (var i in socketInfo) {
						var lSocket4 = socketInfo[i];
						if (lSocket4.room == lSocket.room && socRoom.currPlay == (lSocket4.seat - 1)) {
							var lsValue = 0;
							var preValue = 0;
							var lPlayerRoot;
							if ((lSocket4.seat - 1) == 0)
								lPlayerRoot = playerRoutePos1;
							else if ((lSocket4.seat - 1) == 1)
								lPlayerRoot = playerRoutePos2;
							else if ((lSocket4.seat - 1) == 2)
								lPlayerRoot = playerRoutePos3;
							else if ((lSocket4.seat - 1) == 3)
								lPlayerRoot = playerRoutePos4;
							if (lSocket4.diceSelectValue == 1) {
								preValue = lSocket4.diceSeatValue1;
								lsValue = lSocket4.diceSeatValue1;
							} else if (lSocket4.diceSelectValue == 2) {
								preValue = lSocket4.diceSeatValue2;
								lsValue = lSocket4.diceSeatValue2;
							} else if (lSocket4.diceSelectValue == 3) {
								preValue = lSocket4.diceSeatValue3;
								lsValue = lSocket4.diceSeatValue3;
							} else if (lSocket4.diceSelectValue == 4) {
								preValue = lSocket4.diceSeatValue4;
								lsValue = lSocket4.diceSeatValue4;
							}

							///cut cut cut cut 
							var myData = [];
							myData.push(lSocket4);
							var myData2 = [];
							myData2.push((lSocket4.diceSelectValue - 1));
							var myData3 = [];
							myData3.push(lsValue);
							for (var k in socketInfo) {
								var lSocket3 = socketInfo[k];
								if (lSocket3.room == lSocket4.room) {
									var lPlayerRoot2;
									if ((lSocket3.seat - 1) == 0)
										lPlayerRoot2 = playerRoutePos1;
									else if ((lSocket3.seat - 1) == 1)
										lPlayerRoot2 = playerRoutePos2;
									else if ((lSocket3.seat - 1) == 2)
										lPlayerRoot2 = playerRoutePos3;
									else if ((lSocket3.seat - 1) == 3)
										lPlayerRoot2 = playerRoutePos4;
									if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue1]) {
										var ch6 = true;
										for (var j = 0; j < 8; j++)
											if (lPlayerRoot[lsValue] == safeDice[j])
												ch6 = false;
										//console.log("sssss " + lsValue + " " + lSocket3.diceSeatValue1);
										if (ch6 && lSocket3.seat != lSocket4.seat) {
											socRoom.cutDice = 1;
											var lScore = lSocket3.score;
											lSocket3.score -= lSocket3.diceSeatValue1;
											lSocket3.socket.emit("CutDice", {
												seat: (lSocket3.seat - 1), diceSeat: lSocket3.diceSeatValue1, diceSelectValue: 0,
												score: lSocket3.score, lScore: lScore
											});
											lSocket3.socket.broadcast.in(lSocket3.room).emit("CutDice", {
												seat: (lSocket3.seat - 1), diceSeat: lSocket3.diceSeatValue1, diceSelectValue: 0,
												score: lSocket3.score, lScore: lScore
											});
											lSocket3.diceSeatValue1 = 0;
										} else {
											var bChe = true;
											if (lSocket3.seat == lSocket4.seat && lSocket3.diceSelectValue == 1)
												bChe = false;
											if (bChe) {
												myData.push(lSocket3);
												myData2.push(0);
												myData3.push(lSocket3.diceSeatValue1);
											}
										}
									}
									if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue2]) {
										var ch6 = true;
										for (var j = 0; j < 8; j++)
											if (lPlayerRoot[lsValue] == safeDice[j])
												ch6 = false;
										//console.log("sssss2 " + lsValue + " " + lSocket3.diceSeatValue2);
										if (ch6 && lSocket3.seat != lSocket4.seat) {
											socRoom.cutDice = 1;
											var lScore = lSocket3.score;
											lSocket3.score -= lSocket3.diceSeatValue2;
											lSocket3.socket.emit("CutDice", {
												seat: (lSocket3.seat - 1), diceSeat: lSocket3.diceSeatValue2, diceSelectValue: 1,
												score: lSocket3.score, lScore: lScore
											});
											lSocket3.socket.broadcast.in(lSocket3.room).emit("CutDice", {
												seat: (lSocket3.seat - 1), diceSeat: lSocket3.diceSeatValue2, diceSelectValue: 1,
												score: lSocket3.score, lScore: lScore
											});
											lSocket3.diceSeatValue2 = 0;
										} else {
											var bChe = true;
											if (lSocket3.seat == lSocket4.seat && lSocket3.diceSelectValue == 2)
												bChe = false;
											if (bChe) {
												myData.push(lSocket3);
												myData2.push(1);
												myData3.push(lSocket3.diceSeatValue2);
											}

										}
									}
									if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue3]) {
										var ch6 = true;
										for (var j = 0; j < 8; j++)
											if (lPlayerRoot[lsValue] == safeDice[j])
												ch6 = false;
										//console.log("sssss2 " + lsValue + " " + lSocket3.diceSeatValue2);
										if (ch6 && lSocket3.seat != lSocket4.seat) {
											socRoom.cutDice = 1;
											var lScore = lSocket3.score;
											lSocket3.score -= lSocket3.diceSeatValue3;
											lSocket3.socket.emit("CutDice", {
												seat: (lSocket3.seat - 1), diceSeat: lSocket3.diceSeatValue3, diceSelectValue: 2,
												score: lSocket3.score, lScore: lScore
											});
											lSocket3.socket.broadcast.in(lSocket3.room).emit("CutDice", {
												seat: (lSocket3.seat - 1), diceSeat: lSocket3.diceSeatValue3, diceSelectValue: 2,
												score: lSocket3.score, lScore: lScore
											});
											lSocket3.diceSeatValue3 = 0;
										} else {
											var bChe = true;
											if (lSocket3.seat == lSocket4.seat && lSocket3.diceSelectValue == 3)
												bChe = false;
											if (bChe) {
												myData.push(lSocket3);
												myData2.push(2);
												myData3.push(lSocket3.diceSeatValue3);
											}
										}
									}
									if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue4]) {
										var ch6 = true;
										for (var j = 0; j < 8; j++)
											if (lPlayerRoot[lsValue] == safeDice[j])
												ch6 = false;
										//console.log("sssss2 " + lsValue + " " + lSocket3.diceSeatValue2);
										if (ch6 && lSocket3.seat != lSocket4.seat) {
											socRoom.cutDice = 1;
											var lScore = lSocket3.score;
											lSocket3.score -= lSocket3.diceSeatValue4;
											lSocket3.socket.emit("CutDice", {
												seat: (lSocket3.seat - 1), diceSeat: lSocket3.diceSeatValue4, diceSelectValue: 3,
												score: lSocket3.score, lScore: lScore
											});
											lSocket3.socket.broadcast.in(lSocket3.room).emit("CutDice", {
												seat: (lSocket3.seat - 1), diceSeat: lSocket3.diceSeatValue4, diceSelectValue: 3,
												score: lSocket3.score, lScore: lScore
											});
											lSocket3.diceSeatValue4 = 0;
										} else {
											var bChe = true;
											if (lSocket3.seat == lSocket4.seat && lSocket3.diceSelectValue == 4)
												bChe = false;
											if (bChe) {
												myData.push(lSocket3);
												myData2.push(3);
												myData3.push(lSocket3.diceSeatValue4);
											}
										}

									}
								}
							}

							for (var m = 0; m < myData.length; m++) {
								myData[m].socket.emit("SplitDice", {
									seat: (myData[m].seat - 1), diceSelectValue: myData2[m], order: (m + 1), lsValue: myData3[m], len: myData.length
								});
								myData[m].socket.broadcast.in(myData[m].room).emit("SplitDice", {
									seat: (myData[m].seat - 1), diceSelectValue: myData2[m], order: (m + 1), lsValue: myData3[m], len: myData.length
								});
							}


						}
					}
				}

				if (socRoom.GameTimer >= 4) {
					var ch7 = true;
					for (var i in socketInfo) {
						var lSocket4 = socketInfo[i];
						if (lSocket4.room == lSocket.room && socRoom.currPlay == (lSocket4.seat - 1) && lSocket4.status == "full") {
							socRoom.gameOverInfo.push(lSocket4);
							callGameOver(socRoom, lSocket);
							ch7 = false;
						}
					}

					var ch8 = true;
					if ((socRoom.currRValue == 6 && socRoom.con_six <= 1)) {
						socRoom.con_six += 1;
						socRoom.GameTimer = 0;
						socRoom.play = 22;
						ch8 = false;
					} else if (socRoom.cutDice == 1) {
						socRoom.GameTimer = 0;
						socRoom.play = 22;
						socRoom.cutDice = 0;
						socRoom.con_six = 0;
						ch8 = false;
					} else if (socRoom.DiceHome == 1 && ch7) {
						socRoom.DiceHome = 0;
						socRoom.GameTimer = 0;
						socRoom.play = 22;
						socRoom.con_six = 0;
						ch8 = false;
					}

					if (ch8) {
						lSocket.socket.emit("PlayerEnd", {
							currPlay: socRoom.currPlay
						});
						lSocket.socket.broadcast.in(lSocket.room).emit("PlayerEnd", {
							currPlay: socRoom.currPlay
						});
						Find_NextPlayer(socRoom, lSocket);
						socRoom.GameTimer = 0;
						socRoom.play = 5;
					}
					socRoom.DiceHome = 0;
					socRoom.cutDice = 0;
				}

			} else if (socRoom.play == 5 && socRoom.searchOne == 0) {
				socRoom.searchOne = 1;
				getGameTimer(socRoom, lSocket);
				socRoom.GameTimer += 1;
				if (socRoom.GameTimer >= 1) {
					socRoom.GameTimer = 0;
					socRoom.play = 22;
				}
			} else if (socRoom.play == 6 && socRoom.searchOne == 0) {

				socRoom.searchOne = 1;
				for (var i in socketInfo) {
					var lSocket4 = socketInfo[i];
					if (lSocket4.room == lSocket.room) {
						//console.log("removed user");
						//delete socketInfo[lSocket4.localSocketId];
					}
				}
			}
		}
	}
}, 100);



function callGameOver(socRoom, lSocket2) {
	var lValue = 0;
	if (socRoom.player_count == 2)
		lValue = 1;
	else if (socRoom.player_count == 3)
		lValue = 2;
	else if (socRoom.player_count == 4)
		lValue = 3;

	if (socRoom.gameOverInfo.length == lValue) {
		for (var k in socketInfo) {
			var lSocket = socketInfo[k];
			if (lSocket2.room == lSocket.room && lSocket.status != "out" && lSocket.status != "full")
				socRoom.gameOverInfo.push(lSocket);
		}
	} else if (socRoom.gameOverInfo.length == 0) {
		for (var k in socketInfo) {
			var lSocket = socketInfo[k];
			if (lSocket2.room == lSocket.room && lSocket.status == "over")
				socRoom.gameOverInfo.push(lSocket);
		}
	}
	//console.log("3game " + lValue + " " + socRoom.gameOverInfo.length);
	if (socRoom.gameOverInfo.length == socRoom.player_count) {
		var points = [];
		for (var i = 0; i < socRoom.gameOverInfo.length; i++) {
			points.push(socRoom.gameOverInfo[i].score);
		}
		points.sort(function (a, b) { return b - a });
		for (var i = 0; i < points.length; i++) {
			for (var j = 0; j < socRoom.gameOverInfo.length; j++) {
				if (socRoom.gameOverInfo[j].score == points[i]) {
					var sStr;
					if (i == 0)
						sStr = socRoom.prize1;
					else if (i == 1)
						sStr = socRoom.prize2;
					else if (i == 2)
						sStr = socRoom.prize3;
					else if (i == 3)
						sStr = 0;
					if (socRoom.gameOverInfo[j].status == "out")
						sStr = "out";
					if (sStr != "out" && sStr != 0 && socRoom.gameOverInfo[j].bot == 0) {

						winningDeposit(socRoom.gameOverInfo[j].email, parseFloat(sStr));
					}
					//console.log("name : " + socRoom.gameOverInfo[j].seat);
					socRoom.gameOverInfo[j].socket.emit("GameOverDetail", {
						seat: (socRoom.gameOverInfo[j].seat - 1), name: socRoom.gameOverInfo[j].name, score: sStr,
						avatarStr: socRoom.gameOverInfo[j].avatarStr,
						botAvatarValue: socRoom.gameOverInfo[j].botAvatarValue,
						bot: socRoom.gameOverInfo[j].bot
					});
					socRoom.gameOverInfo[j].socket.broadcast.in(socRoom.gameOverInfo[j].room).emit("GameOverDetail", {
						seat: (socRoom.gameOverInfo[j].seat - 1), name: socRoom.gameOverInfo[j].name, score: sStr,
						avatarStr: socRoom.gameOverInfo[j].avatarStr,
						botAvatarValue: socRoom.gameOverInfo[j].botAvatarValue,
						bot: socRoom.gameOverInfo[j].bot
					});
				}
			}
			for (var j = 0; j < socRoom.gameOverInfo.length; j++) {
				if (socRoom.gameOverInfo[j].score == points[i]) {
					//console.log("over : " + socRoom.gameOverInfo[j].seat);
					socRoom.gameOverInfo[j].socket.emit("GameOver", {
					});
					socRoom.gameOverInfo[j].socket.broadcast.in(socRoom.gameOverInfo[j].room).emit("GameOver", {
					});
				}
			}
		}

		for (var j = 0; j < socRoom.gameOverInfo.length; j++) {
			socRoom.gameOverInfo[j].active = false;
			socRoom.gameOverInfo[j].socket.leave(socRoom.gameOverInfo[j].room);
			if (socRoom.gameOverInfo[j].cheInternet == "noInternet") {

			}
		}
		for (var k in socketInfo) {
			var lSocket = socketInfo[k];
			if (lSocket2.room == lSocket.room && lSocket.cheInternet == "noInternet") {
				delete socketInfo[lSocket.socket.id];
			}
		}
		socRoom.gameover = 1;
		socRoom.play = 6;
	}
}

function splitDiceFunc(lSocket, iValue) {
	for (var i in socketInfo) {
		var lSocket4 = socketInfo[i];
		if (lSocket4.room == lSocket.room && (lSocket.seat - 1) == (lSocket4.seat - 1)) {
			var lsValue = 0;
			var preValue = 0;
			var lPlayerRoot;
			if ((lSocket4.seat - 1) == 0)
				lPlayerRoot = playerRoutePos1;
			else if ((lSocket4.seat - 1) == 1)
				lPlayerRoot = playerRoutePos2;
			else if ((lSocket4.seat - 1) == 2)
				lPlayerRoot = playerRoutePos3;
			else if ((lSocket4.seat - 1) == 3)
				lPlayerRoot = playerRoutePos4;
			if (lSocket4.diceSelectValue == 1) {
				preValue = lSocket4.diceSeatValue1;
				lsValue = lSocket4.diceSeatValue1;
			} else if (lSocket4.diceSelectValue == 2) {
				preValue = lSocket4.diceSeatValue2;
				lsValue = lSocket4.diceSeatValue2;
			} else if (lSocket4.diceSelectValue == 3) {
				preValue = lSocket4.diceSeatValue3;
				lsValue = lSocket4.diceSeatValue3;
			} else if (lSocket4.diceSelectValue == 4) {
				preValue = lSocket4.diceSeatValue4;
				lsValue = lSocket4.diceSeatValue4;
			}
			///cut cut cut cut 
			var myData = [];
			//myData.push(lSocket4);
			var myData2 = [];
			//myData2.push(lSocket4.diceSelectValue - 1);
			var myData3 = [];
			//myData3.push(lsValue);
			for (var k in socketInfo) {
				var lSocket3 = socketInfo[k];
				if (lSocket3.room == lSocket4.room) {
					var lPlayerRoot2;
					if ((lSocket3.seat - 1) == 0)
						lPlayerRoot2 = playerRoutePos1;
					else if ((lSocket3.seat - 1) == 1)
						lPlayerRoot2 = playerRoutePos2;
					else if ((lSocket3.seat - 1) == 2)
						lPlayerRoot2 = playerRoutePos3;
					else if ((lSocket3.seat - 1) == 3)
						lPlayerRoot2 = playerRoutePos4;
					if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue1]) {
						var ch6 = true;
						for (var j = 0; j < 8; j++)
							if (lPlayerRoot[lsValue] == safeDice[j])
								ch6 = false;
						//console.log("sssss " + lsValue + " " + lSocket3.diceSeatValue1);
						if (ch6 && lSocket3.seat != lSocket4.seat) {
						} else {
							var bChe = true;
							if (lSocket3.seat == lSocket4.seat && lSocket3.diceSelectValue == 1)
								bChe = false;
							if (bChe) {
								myData.push(lSocket3);
								myData2.push(0);
								myData3.push(lSocket3.diceSeatValue1);
							}
						}
					}
					if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue2]) {
						var ch6 = true;
						for (var j = 0; j < 8; j++)
							if (lPlayerRoot[lsValue] == safeDice[j])
								ch6 = false;
						//console.log("sssss2 " + lsValue + " " + lSocket3.diceSeatValue2);
						if (ch6 && lSocket3.seat != lSocket4.seat) {
						} else {
							var bChe = true;
							if (lSocket3.seat == lSocket4.seat && lSocket3.diceSelectValue == 2)
								bChe = false;
							if (bChe) {

								myData.push(lSocket3);
								myData2.push(1);
								myData3.push(lSocket3.diceSeatValue2);
							}

						}
					}
					if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue3]) {
						var ch6 = true;
						for (var j = 0; j < 8; j++)
							if (lPlayerRoot[lsValue] == safeDice[j])
								ch6 = false;
						//console.log("sssss2 " + lsValue + " " + lSocket3.diceSeatValue2);
						if (ch6 && lSocket3.seat != lSocket4.seat) {
						} else {
							var bChe = true;
							if (lSocket3.seat == lSocket4.seat && lSocket3.diceSelectValue == 3)
								bChe = false;
							if (bChe) {
								myData.push(lSocket3);
								myData2.push(2);
								myData3.push(lSocket3.diceSeatValue3);
							}
						}
					}
					if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue4]) {
						var ch6 = true;
						for (var j = 0; j < 8; j++)
							if (lPlayerRoot[lsValue] == safeDice[j])
								ch6 = false;
						//console.log("sssss2 " + lsValue + " " + lSocket3.diceSeatValue2);
						if (ch6 && lSocket3.seat != lSocket4.seat) {
						} else {
							var bChe = true;
							if (lSocket3.seat == lSocket4.seat && lSocket3.diceSelectValue == 4)
								bChe = false;
							if (bChe) {
								myData.push(lSocket3);
								myData2.push(3);
								myData3.push(lSocket3.diceSeatValue4);
							}
						}
					}
				}
			}

			if (iValue == 0) {
				for (var m = 0; m < myData.length; m++) {
					myData[m].socket.emit("SplitDice", {
						seat: (myData[m].seat - 1), diceSelectValue: myData2[m], order: (m), lsValue: myData3[m], len: myData.length
					});
					myData[m].socket.broadcast.in(myData[m].room).emit("SplitDice", {
						seat: (myData[m].seat - 1), diceSelectValue: myData2[m], order: (m), lsValue: myData3[m], len: myData.length
					});
				}
			}

		}
	}

}
function findBotNextMove(lSocket4, socRoom) {
	var rValue = 0;
	var lsValue = 0;
	var lPlayerRoot;
	if ((lSocket4.seat - 1) == 0) {
		lPlayerRoot = playerRoutePos1;
	} else if ((lSocket4.seat - 1) == 1) {
		lPlayerRoot = playerRoutePos2;
	} else if ((lSocket4.seat - 1) == 2) {
		lPlayerRoot = playerRoutePos3;
	} else if ((lSocket4.seat - 1) == 3) {
		lPlayerRoot = playerRoutePos4;
	}
	console.log("ff " + socRoom.entryFee);
	var ch6 = true;
	for (var k in socketInfo) {
		var lSocket3 = socketInfo[k];
		if (lSocket3.room == lSocket4.room && lSocket3.bot == 0 && lSocket3 != lSocket4 && lSocket4.score < lSocket3.score && ch6 && (lSocket3.played >= 1 &&
			socRoom.entryFee != 0)) {
			var lPlayerRoot2;
			if ((lSocket3.seat - 1) == 0)
				lPlayerRoot2 = playerRoutePos1;
			else if ((lSocket3.seat - 1) == 1)
				lPlayerRoot2 = playerRoutePos2;
			else if ((lSocket3.seat - 1) == 2)
				lPlayerRoot2 = playerRoutePos3;
			else if ((lSocket3.seat - 1) == 3)
				lPlayerRoot2 = playerRoutePos4;
			for (var i = 0; i < 4 && ch6; i++) {
				for (var j = 1; j <= 6 && ch6; j++) {
					var lsValue2 = 0;
					if (i == 0) {
						lsValue = parseInt(lSocket4.diceSeatValue1 + j);
						lsValue2 = 1;
					} else if (i == 1) {
						lsValue = parseInt(lSocket4.diceSeatValue2 + j);
						lsValue2 = 2;
					} else if (i == 2) {
						lsValue = parseInt(lSocket4.diceSeatValue3 + j);
						lsValue2 = 3;
					} else if (i == 3) {
						lsValue = parseInt(lSocket4.diceSeatValue4 + j);
						lsValue2 = 4;
					}

					//console.log("ss " + (lPlayerRoot[lsValue]) + " " + lPlayerRoot2[lSocket3.diceSeatValue1]);
					if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue1] && ch6) {
						ch6 = false;
						rValue = j;
						lSocket4.botSelectValue = lsValue2;
						console.log("first1 " + lSocket4.botSelectValue);
					}
					if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue2] && ch6) {
						ch6 = false;
						rValue = j;
						lSocket4.botSelectValue = lsValue2;
						//lSocket4.diceSelectValue = 2;
						console.log("first2 " + lSocket4.botSelectValue);
					}
					if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue3] && ch6) {
						ch6 = false;
						rValue = j;
						lSocket4.botSelectValue = lsValue2;
						console.log("first3 " + lSocket4.botSelectValue);
					}
					if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue4] && ch6) {
						//console.log("ss " + (lPlayerRoot[lsValue]) + " " + lPlayerRoot2[lSocket3.diceSeatValue4]);
						ch6 = false;
						rValue = j;
						lSocket4.botSelectValue = lsValue2;
						console.log("first4 " + lSocket4.botSelectValue + " " + lSocket4.seat);
					}
				}
			}

		}
	}
	return rValue;
}
function diceHideFunc(lSocket4) {

	for (var k in socketInfo) {
		var lSocket3 = socketInfo[k];
		if (lSocket3.room == lSocket4.room && lSocket3.seat != lSocket4.seat) {
			var lPlayerRoot2;
			if ((lSocket3.seat - 1) == 0)
				lPlayerRoot2 = playerRoutePos1;
			else if ((lSocket3.seat - 1) == 1)
				lPlayerRoot2 = playerRoutePos2;
			else if ((lSocket3.seat - 1) == 2)
				lPlayerRoot2 = playerRoutePos3;
			else if ((lSocket3.seat - 1) == 3)
				lPlayerRoot2 = playerRoutePos4;

			let floop = [0, 1, 2, 3];
			for (let i of floop) {
				var lPlayerRoot;
				if ((lSocket4.seat - 1) == 0) {
					lPlayerRoot = playerRoutePos1;
				} else if ((lSocket4.seat - 1) == 1) {
					lPlayerRoot = playerRoutePos2;
				} else if ((lSocket4.seat - 1) == 2) {
					lPlayerRoot = playerRoutePos3;
				} else if ((lSocket4.seat - 1) == 3) {
					lPlayerRoot = playerRoutePos4;
				}
				var lsValue = 0;
				if (i == 0) {
					lsValue = parseInt(lSocket4.diceSeatValue1);
				} else if (i == 1) {
					lsValue = parseInt(lSocket4.diceSeatValue2);
				} else if (i == 2) {
					lsValue = parseInt(lSocket4.diceSeatValue3);
				} else if (i == 3) {
					lsValue = parseInt(lSocket4.diceSeatValue4);
				}
				if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue1]) {
					lSocket4.socket.emit("DiceHide", { seat: (lSocket3.seat - 1), diceSelectValue: 0 });
					console.log("kk " + (lPlayerRoot[lsValue]) + " " + lPlayerRoot2[lSocket3.diceSeatValue1] + " " + (lSocket3.seat - 1) + " " + (lSocket4.seat - 1));

				} if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue2]) {
					lSocket4.socket.emit("DiceHide", { seat: (lSocket3.seat - 1), diceSelectValue: 1 });
					console.log("kk " + (lPlayerRoot[lsValue]) + " " + lPlayerRoot2[lSocket3.diceSeatValue2] + " " + (lSocket3.seat - 1) + " " + (lSocket4.seat - 1));

				} if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue3]) {
					lSocket4.socket.emit("DiceHide", { seat: (lSocket3.seat - 1), diceSelectValue: 2 });
					console.log("kk " + (lPlayerRoot[lsValue]) + " " + lPlayerRoot2[lSocket3.diceSeatValue3] + " " + (lSocket3.seat - 1) + " " + (lSocket4.seat - 1));

				} if (lPlayerRoot[lsValue] == lPlayerRoot2[lSocket3.diceSeatValue4]) {
					lSocket4.socket.emit("DiceHide", { seat: (lSocket3.seat - 1), diceSelectValue: 3 });
					console.log("kk " + (lPlayerRoot[lsValue]) + " " + lPlayerRoot2[lSocket3.diceSeatValue4] + " " + (lSocket3.seat - 1) + " " + (lSocket4.seat - 1));

				}
			}
		}
	}
}
function ClickFunc(lSocket, socRoom) {
	var cChe = false;
	var cEnableChe = "";
	if (socRoom.GameTimer >= 100) {
		lSocket.skip += 1;
		cEnableChe = "yes";
		cChe = true;
	}
	socRoom.GameTimer = 100;
	var rIndex = Math.floor(Math.random() * 6);
	rIndex += 1;
	//rIndex = 6;

	if (lSocket.bot == 1) {
		var indexVal = findBotNextMove(lSocket, socRoom);
		if (indexVal != 0) {
			lSocket.botCutValue = 1;
			rIndex = indexVal;
		} else {
			/*if (Math.floor(Math.random() * 5) != 3)
				rIndex = Math.floor(Math.random() * 4) + 3;
			else
				rIndex = Math.floor(Math.random() * 3) + 1;*/
		}
	}

	diceHideFunc(lSocket);
	socRoom.currRValue = rIndex;
	socRoom.play = 3;
	if (lSocket.bot == 1)
		lSocket.botChooseTimer = Math.floor(Math.random() * 40);
	if (cChe)
		socRoom.GameTimer = 100;
	else socRoom.GameTimer = 0;
	var ch7 = true;
	if ((lSocket.diceSeatValue1 + socRoom.currRValue) <= 56)
		ch7 = false;
	if ((lSocket.diceSeatValue2 + socRoom.currRValue) <= 56)
		ch7 = false;
	if ((lSocket.diceSeatValue3 + socRoom.currRValue) <= 56)
		ch7 = false;
	if ((lSocket.diceSeatValue4 + socRoom.currRValue) <= 56)
		ch7 = false;

	lSocket.socket.emit("CLICKOUT", {
		currPlay: socRoom.currPlay, diceRValue: rIndex,
		value1: lSocket.diceSeatValue1,
		value2: lSocket.diceSeatValue2,
		value3: lSocket.diceSeatValue3,
		value4: lSocket.diceSeatValue4,
		skip: lSocket.skip,
		cEnableChe: cEnableChe
	});
	lSocket.socket.broadcast.in(lSocket.room).emit("CLICKOUT", {
		currPlay: socRoom.currPlay, diceRValue: rIndex,
		value1: lSocket.diceSeatValue1,
		value2: lSocket.diceSeatValue2,
		value3: lSocket.diceSeatValue3,
		value4: lSocket.diceSeatValue4,
		skip: lSocket.skip,
		cEnableChe: cEnableChe
	});
	if (ch7) {
		Find_NextPlayer(socRoom, lSocket);
		socRoom.GameTimer = 0;
		socRoom.play = 5;
	}
}
function SelectDiceFunc(lSocket, socRoom) {
	socRoom.play = 4;
	socRoom.GameTimer = 0;
	lSocket.botCutValue = 0;
	lSocket.botSelectValue = 0;
	lSocket.socket.emit("SelectDiceEnd", { currPlay: socRoom.currPlay });
	lSocket.socket.broadcast.in(lSocket.room).emit("SelectDiceEnd", { currPlay: socRoom.currPlay });
}

function Find_NextPlayer(socRoom, lSocket2) {
	var localCPlay = socRoom.currPlay;
	var eChe = true;
	var releaseCount = 0;
	while (eChe) {
		socRoom.currPlay += 1;
		if (socRoom.currPlay >= 4)
			socRoom.currPlay = 0;
		for (var k in socketInfo) {
			var lSocket4 = socketInfo[k];
			if (socRoom.currPlay == (lSocket4.seat - 1) && lSocket2.room == lSocket4.room &&
				localCPlay != socRoom.currPlay && lSocket4.status != "full" && lSocket4.status != "out") {
				eChe = false;
				socRoom.con_six = 0;
			}
		}
		releaseCount += 1;
		if (releaseCount >= 5)
			eChe = false;

	}
}
function getGameTimer(socRoom, lSocket) {
	var now = moment();
	var start = socRoom.start_timer;
	var config = "DD/MM/YYYY HH:mm:ss";
	var ms = moment(now, config).diff(moment(start, config));
	var cMinutes = moment.utc(ms).format("mm:ss");

	var start2 = socRoom.start_timer2;
	var ms2 = moment(start2, config).diff(moment(now, config));
	var cMinutes2 = moment.utc(ms2).format("mm:ss");

	lSocket.socket.emit("tTimer", {
		tTimer: cMinutes2
	});
	lSocket.socket.broadcast.in(lSocket.room).emit("tTimer", {
		tTimer: cMinutes2
	});
	//console.log("ll " + moment.utc(ms).format("mm"));
	if (moment.utc(ms).format("mm") >= 10) {
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			if (lSocket2.room == lSocket.room && lSocket2.status == "") {
				lSocket2.status = "over";
			}
		}
		callGameOver(socRoom, lSocket);
	}
}

function removeFunction(socket2) {
	var lSocket2 = socketInfo[socket2.id];
	if (lSocket2 != undefined) {
		var pCount = 0;
		for (var k in socketInfo) {
			var lSocket = socketInfo[k];
			if (lSocket2.room == lSocket.room && lSocket.socId != lSocket2.socId)
				pCount += 1;
		}
		console.log("ccc " + pCount);
		if (pCount >= 1) {
			var socRoom = socket2.adapter.rooms[socketInfo[socket2.id].room];
			if (socRoom != undefined) {
				if (socRoom.gameover == 0) {
					console.log("rremove user" + socketInfo[socket2.id].seat);
					socketInfo[socket2.id].status = "out";
					socketInfo[socket2.id].score = -1;
					socRoom.gameOverInfo.push(socketInfo[socket2.id]);

					socketInfo[socket2.id].socket.emit("PlayerEnd", { currPlay: socRoom.currPlay });
					socketInfo[socket2.id].socket.broadcast.in(socketInfo[socket2.id].room).emit("PlayerEnd", { currPlay: socRoom.currPlay });
					if (socRoom.currPlay == (socketInfo[socket2.id].seat - 1)) {
						Find_NextPlayer(socRoom, socketInfo[socket2.id]);
						socRoom.GameTimer = 0;
						socRoom.play = 5;
					}
					callGameOver(socRoom, socketInfo[socket2.id]);
				}
			}
		}

		for (var k in socketInfo) {
			var lSocket = socketInfo[k];
			if (lSocket.socket.id == socket2.id) {
				lSocket.active = false;
				lSocket.socket.leave(lSocket.room);
			}
		}
	}
}
function removeFunction2(socket2, socId2) {
	var lSocket2 = socketInfo[socket2.id];
	if (lSocket2 != undefined) {
		var pCount = 0;
		for (var k in socketInfo) {
			var lSocket = socketInfo[k];
			console.log("dv " + lSocket.socId);
			if (lSocket2.room == lSocket.room && lSocket.socId != socId2)
				pCount += 1;
		}
		console.log("ccc " + pCount);
		if (pCount >= 1) {
			var socRoom = socket2.adapter.rooms[socketInfo[socket2.id].room];
			if (socRoom != undefined) {
				if (socRoom.gameover == 0) {
					console.log("rremove user" + socketInfo[socket2.id].seat);
					socketInfo[socket2.id].status = "out";
					socketInfo[socket2.id].score = -1;
					socRoom.gameOverInfo.push(socketInfo[socket2.id]);

					socketInfo[socket2.id].socket.emit("PlayerEnd", { currPlay: socRoom.currPlay });
					socketInfo[socket2.id].socket.broadcast.in(socketInfo[socket2.id].room).emit("PlayerEnd", { currPlay: socRoom.currPlay });
					if (socRoom.currPlay == (socketInfo[socket2.id].seat - 1)) {
						Find_NextPlayer(socRoom, socketInfo[socket2.id]);
						socRoom.GameTimer = 0;
						socRoom.play = 5;
					}
					callGameOver(socRoom, socketInfo[socket2.id]);
				}
			}
		}

		for (var k in socketInfo) {
			var lSocket = socketInfo[k];
			if (lSocket.socket.id == socket2.id) {
				lSocket.active = false;
				lSocket.socket.leave(lSocket.room);
			}
		}
	}
}

io.on('connection', function (socket) {
	console.log("server connected");
	//socket.on("StartGame", function () {
	socket.emit("ApkVersion", { currVersion: currVersion, apkUrl: apkUrl });
	//});


	socket.on("Room", function (data) {
		var alreadyPlay = false;
		if (alreadyPlay) {
			//socket.emit("AlreadyPlay", {});
		} else {
			var ch2 = true;
			var chEnter = true;
			var roomStart;
			var roomEnd;
			if (data.play_friends == "yes") {
				roomStart = parseInt(data.room);
				roomEnd = parseInt(data.room);
				var soRoom = socket.adapter.rooms[data.room];
				var entryValue = parseInt(data.entry);
				if (parseInt(data.player_count) == 2) {
					entryValue = entryValue * 2;
					var perc = entryValue / 100;
					data.prize1 = parseInt(perc * 80);
					console.log("perc " + entryValue + " " + data.prize1);
				}

				if (data.join == "yes") {
					if (soRoom == undefined) {
						chEnter = false;
						socket.emit("RoomNotAvailable", { status: "no" });
					} else {
						socket.emit("RoomNotAvailable", { status: "yes" });
					}
				}

			} else {
				var textPlayer = 0;
				for (var k in socketInfo) {
					var lSocket = socketInfo[k];
					textPlayer += 1;
				}
				if (parseInt(data.player_count) == 2) {
					roomStart = 20000001;
					roomEnd = 30000000;
				} else if (parseInt(data.player_count) == 3) {
					roomStart = 30000001;
					roomEnd = 40000000;
				} else if (parseInt(data.player_count) == 4) {
					roomStart = 40000001;
					roomEnd = 50000000;
				}
			}

			if (chEnter) {
				for (var i = roomStart; i <= roomEnd && ch2; i++) {
					var roomSocket = io.sockets.adapter.rooms[i + ""];
					if (roomSocket == undefined) {
						socket.join(i + "");
						console.log("room id  " + i);
						socket.emit("RoomConnected", { room: parseInt(i + "") });
						socket.adapter.rooms[i + ""].currPlay = 0;
						socket.adapter.rooms[i + ""].play = 0;
						socket.adapter.rooms[i + ""].searchOne = 0;
						socket.adapter.rooms[i + ""].waitingCount = 0;
						socket.adapter.rooms[i + ""].player_count = parseInt(data.player_count);
						socket.adapter.rooms[i + ""].GameTimer = 0;
						socket.adapter.rooms[i + ""].winCount = 0;
						socket.adapter.rooms[i + ""].currRValue = 0;
						socket.adapter.rooms[i + ""].con_six = 0;
						socket.adapter.rooms[i + ""].gameover = 0;
						socket.adapter.rooms[i + ""].tTimer = 0;
						socket.adapter.rooms[i + ""].start_timer;
						socket.adapter.rooms[i + ""].gameOverInfo = [];
						socket.adapter.rooms[i + ""].prize1 = parseInt(data.prize1);
						socket.adapter.rooms[i + ""].prize2 = parseInt(data.prize2);
						socket.adapter.rooms[i + ""].prize3 = parseInt(data.prize3);
						socket.adapter.rooms[i + ""].entryFee = parseInt(data.entry);
						socket.adapter.rooms[i + ""].cutDice = 0;
						socket.adapter.rooms[i + ""].DiceHome = 0;
						socket.adapter.rooms[i + ""].table_id = data.table_id;
						ch2 = false;
					} else {
						//console.log("bar " + roomSocket.player_count);
						if (roomSocket.length < parseInt(roomSocket.player_count) && roomSocket.table_id == data.table_id) {
							socket.join(i + "");
							socket.emit("RoomConnected", { room: parseInt(i) });
							ch2 = false;
						}
					}
				}
			}
		}
	});

	socket.on("PlayerJoin", function (data) {
		console.log("new socket " + socket.id);
		var soRoom = socket.adapter.rooms[data.room];
		for (var j = 0; j < 1; j++) {
			var socId;
			if (j == 0)
				socId = socket.id;
			else if (j == 1 || j == 2)
				socId = socket.id + j;
			socketInfo[socId] = [];
			socketInfo[socId].socket = socket;
			socketInfo[socId].name = data.name;
			socketInfo[socId].email = data.email;
			socketInfo[socId].points = parseInt(data.points);
			socketInfo[socId].room = data.room;
			socketInfo[socId].localSocketId = socId;
			socketInfo[socId].win = 0;
			socketInfo[socId].commission = parseInt(data.commission);
			socketInfo[socId].entryPoint = parseInt(data.entryPoint);
			socketInfo[socId].winPoint = parseInt(data.winPoint);
			socketInfo[socId].diceSeatValue1 = 0;
			socketInfo[socId].diceSeatValue2 = 0;
			socketInfo[socId].diceSeatValue3 = 0;
			socketInfo[socId].diceSeatValue4 = 0;
			socketInfo[socId].diceSelectValue = 0;
			socketInfo[socId].score = 0;
			socketInfo[socId].status = "";
			socketInfo[socId].skip = 0;
			socketInfo[socId].active = true;
			socketInfo[socId].cheInternet = "";
			socketInfo[socId].pause = true;
			socketInfo[socId].seconds = 0;
			socketInfo[socId].avatarStr = data.avatarStr;

			var ch2 = true;
			let floop;
			if (soRoom.player_count == 2)
				floop = [1, 2];
			else if (soRoom.player_count == 3)
				floop = [1, 2, 3];
			else if (soRoom.player_count == 4)
				floop = [1, 2, 3, 4];
			for (let i of floop) {
				if (ch2) {
					var seatAvailable = false;
					for (var k in socketInfo) {
						var lSocket = socketInfo[k];
						if (i == lSocket.seat && lSocket.active == true && data.room == lSocket.room)
							seatAvailable = true;
					}
					if (!seatAvailable) {
						ch2 = false;
						socketInfo[socId].seat = i;
					}
				}
			}
			if (socketInfo[socId].seat == 2) {
				//socketInfo[socId].diceSeatValue1 = 29;
				//socketInfo[socId].diceSeatValue2 = 29;
			}

			//console.log("seat " + (socketInfo[socId].seat - 1) + " " + socketInfo[socId].room + " " + soRoom.player_count);
			for (var k in socketInfo) {
				var lSocket = socketInfo[k];
				if (lSocket.active == true) {
					lSocket.socket.emit("PlayerJoin", {
						seat: (lSocket.seat - 1),
						name: lSocket.name,
						points: lSocket.points,
						avatarStr: lSocket.avatarStr,

					});
					lSocket.socket.broadcast.in(lSocket.room).emit("PlayerJoin", {
						seat: (lSocket.seat - 1),
						name: lSocket.name,
						points: lSocket.points,
						avatarStr: lSocket.avatarStr,
					});
				}
			}
		}
		socket.emit("YOU", { seat: (socketInfo[socket.id].seat - 1), email: socketInfo[socket.id].email });

		if (socket.adapter.rooms[data.room].play == 0 && soRoom.length >= soRoom.player_count)
			socket.adapter.rooms[data.room].play = 1;

	});
	socket.on("CLICK", function (data) {
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			//console.log("click id2 " + lSocket2.socket.id + " " + socket.id);
			if (lSocket2.socket.id == socket.id && lSocket2.bot == 0) {
				var socRoom = socket.adapter.rooms[lSocket2.room];
				//console.log("click id " + lSocket2.room);
				ClickFunc(lSocket2, socRoom);
			}
		}
		/*var lSocket = socketInfo[socket.id];
		var socRoom = socket.adapter.rooms[lSocket.room];
		console.log("click " + socket.id);
		ClickFunc(lSocket, socRoom);*/
	});
	socket.on("SelectDice", function (data) {
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			if (lSocket2.socket.id == socket.id) {
				var socRoom = socket.adapter.rooms[lSocket2.room];
				lSocket2.diceSelectValue = parseInt(data.select_dice);
				SelectDiceFunc(lSocket2, socRoom);
			}
		}
		/*var socRoom = socket.adapter.rooms[socketInfo[socket.id].room];
		var lSocket = socketInfo[socket.id];
		lSocket.diceSelectValue = parseInt(data.select_dice);
		SelectDiceFunc(lSocket, socRoom);*/
	});
	socket.on("ContinueSockets", function (data) {
		socket.emit("ContinueSockets", {});
		var lSocket = socketInfo[socket.id];
		if (lSocket != undefined) {
			lSocket.seconds = parseInt(data.seconds);

		}
	});
	socket.on("UserRegister", function (data) {
	
		RegisterMySql(data, socket);
	});


	socket.on("RegisterAvailable", function (data) {
		RegisterAvailable(data, socket);
	});
	socket.on("VerifyUser", function (data) {
		VerifyUserMongoDB(data, socket, "");
	});
	socket.on("Withdraw", function (data) {
		WithdrawMongoDB(socket, data);
	});
	socket.on("UpdateChips", function (data) {
		//Updated_Chips(socketInfo[socket.id].email, parseInt(data.points));
	});

	socket.on("ProfileEdit", function (data) {
		ProfileUpdate(socket, data.email, data.profile_edit, data.profile_edit_str);
	});
	socket.on("UpdateCash", function (data) {
	});
	socket.on("GetDocuments", function (data) {
		getTournaments(socket);
		//GetAllDocumentMongoDB(data, socket);
	});
	socket.on("AddUserTournaments", function (data) {
		AddUserTournaments(data, socket);
	});

	socket.on("GetDeposit", function (data) {
		GetDepositFunc(data.email, socket);
		GetReferFunc(data.email, socket);
	});
	socket.on("InsertDeposit", function (data) {
		InsertDeposit(data, socket);
	});
	socket.on("RemoveUser", function (data) {
		removeFunction(socket);
	});
	socket.on("SendSMS", function (data) {
		sendSMSFunc(data);
	});
	socket.on("Played", function (data) {
		PlayedFunc(data.email, socket);
	});
	socket.on("GetNotifications", function (data) {
		GetNotifications(socket, data);
	});

	socket.on("NotificationsRead", function (data) {
		NotificationsRead(socket, data);
	});

	socket.on("GetHistory", function (data) {
		GetHistory(socket, data);
	});
	socket.on("VerifyChips", function (data) {
		VerifyChips(data.email, data.entryFee, socket);
	});

	socket.on("CheckInternet", function (data) {
		var lSocket = socketInfo[socket.id];
		if (lSocket != undefined)
			lSocket.cheInternet = "quit";
	});
	socket.on("CheckInternet2", function (data) {
		var lSocket = socketInfo[socket.id];
		if (lSocket != undefined)
			lSocket.pause = true;
	});
	socket.on("JoinSocket", function (data) {
		console.log("nadakku ");
		var lSocket = socketInfo[socket.id];
		var cCount = 0;
		var rRoom;
		var sID;
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			console.log("gan " + lSocket2.socket.id + "    " + socket.id);
			if (lSocket2.email == data.email) {
				rRoom = lSocket2.room;
				sID = lSocket2.socket.id;

			}
		}
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			if (lSocket2.room == rRoom)
				cCount += 1;
		}

		if (cCount == 1) {
			socket.emit("SocketActive2", { active: "False" });
			delete socketInfo[sID];
		} else {
			var cChe = false;
			for (var k in socketInfo) {
				var lSocket2 = socketInfo[k];
				if (lSocket2.email == data.email && !cChe) {
					cChe = true;
					var socId = socket.id;
					socketInfo[socId] = [];
					socketInfo[socId].socket = socket;
					socketInfo[socId].name = lSocket2.name;
					socketInfo[socId].email = lSocket2.email;
					socketInfo[socId].points = parseInt(lSocket2.points);
					socketInfo[socId].room = lSocket2.room;
					socketInfo[socId].localSocketId = socId;
					socketInfo[socId].win = lSocket2.win;
					socketInfo[socId].commission = parseInt(lSocket2.commission);
					socketInfo[socId].entryPoint = parseInt(lSocket2.entryPoint);
					socketInfo[socId].diceSeatValue1 = lSocket2.diceSeatValue1;
					socketInfo[socId].diceSeatValue2 = lSocket2.diceSeatValue2;
					socketInfo[socId].diceSeatValue3 = lSocket2.diceSeatValue3;
					socketInfo[socId].diceSeatValue4 = lSocket2.diceSeatValue4;
					socketInfo[socId].diceSelectValue = 0;
					socketInfo[socId].score = lSocket2.score;
					socketInfo[socId].status = lSocket2.status;
					socketInfo[socId].skip = lSocket2.skip;
					socketInfo[socId].active = lSocket2.active;
					console.log("aa " + lSocket2.active);
					var aStr = "yes";
					if (lSocket2.active)
						aStr = "yes";
					else aStr = "no";
					socket.emit("SocketActive", { active: aStr });
					socketInfo[socId].cheInternet = "";
					socketInfo[socId].seat = lSocket2.seat;
					socketInfo[socId].active = true;
					socket.join(lSocket2.room);
				}
			}
			for (var k in socketInfo) {
				var lSocket2 = socketInfo[k];
				if (lSocket2.email == data.email && lSocket2.socket.id != socket.id) {
					delete socketInfo[lSocket2.socket.id];
					console.log("delete ");
				}
			}

			for (var k in socketInfo) {
				var lSocket2 = socketInfo[k];
				if (lSocket2.email == data.email) {
					var socRoom = socket.adapter.rooms[lSocket2.room];
					console.log("reseeee " + lSocket2.seat + " " + socRoom.currPlay + " " + socRoom.play);
					if (socRoom.currPlay == (lSocket2.seat - 1)) {
						if (socRoom.play == 2) {
							socket.emit("ReButtonEnable", { currPlay: socRoom.currPlay });
						}
					}
				}
			}

			if (!cChe) {
				socket.emit("SocketActive", { active: "no" });
			}
		}
		var tSockets = 0;
		for (var k in socketInfo) {
			var lSocket2 = socketInfo[k];
			tSockets += 1;
		}
		console.log("tcount " + tSockets);
	});

	socket.on("disconnect", function () {
		for (var k in socketInfo) {
			var lSocket = socketInfo[k];
			if (lSocket.socket.id == socket.id) {
				if (lSocket.cheInternet == "quit") {
					console.log("dis_remove user" + socket.id);
					delete socketInfo[socket.id];
				} else {
					if (lSocket.seconds < 2) {
						removeFunction(lSocket.socket);
						delete socketInfo[socket.id];
					} else {
						lSocket.cheInternet = "noInternet";
						lSocket.active = false;
						var today = new Date();
						lSocket.liveDate = today;
						console.log("penn " + lSocket.seconds);
					}
				}
			}
		}
	});
});

function RegisterMySql(data, lSocket) {
	var email = data.email;
	var sql = 'SELECT * FROM categories WHERE email = ?';
	
	pool.query(sql, [email], function (error, result, fields) {
		var isAvailableChe = false;
		var alreadyRegisterChe = false;
		
		if (!error) {
			
			if (result.length != 0) {
				if (result[0].email == email) {
					isAvailableChe = true;
					console.log(result[0].device_id + " " + data.deviceID);
					if (result[0].device_id != data.deviceID) {
						alreadyRegisterChe = true;
					}
				}
			}
			console.log("=================");
			console.log(isAvailableChe);
			console.log("=================")
			console.log(alreadyRegisterChe);
			console.log("=================")
			if (!isAvailableChe && !alreadyRegisterChe) {
				lSocket.emit("RegisterAvailable", { status: "available" });
			} else if (isAvailableChe && alreadyRegisterChe) {
				lSocket.emit("OneDeviceOnly", {});
			} else {

				VerifyUserMongoDB(data, lSocket, "old");
			}


		}


	});
}
function RegisterAvailable(data, lSocket) {
	RegisterReferralCode(data, lSocket);
}
function RegisterReferralCode(data, lSocket) {
	var referral_code = data.name.substring(0, 5) + referralCodeGenerator.alphaNumeric('uppercase', 3, 1);
	var sql = 'SELECT * FROM categories WHERE referral_code = ?';
	pool.query(sql, [referral_code], function (error, result, fields) {
		var isAvailableChe;
		for (var i in result) {
			if (result[i].referral_code == referral_code) {
				isAvailableChe = true;
			}
		}
		if (!isAvailableChe) {
			checkDeviceID(data, lSocket, referral_code);
		} else {
			RegisterReferralCode(data, lSocket);
		}
	});
}
function checkDeviceID(data, lSocket, referral_code) {
	var sql = 'SELECT * FROM categories WHERE device_id = ?';
	pool.query(sql, [data.deviceID], function (error, result, fields) {
		var isAvailableChe = true;
		for (var i in result) {
			if (result[i].device_id == data.deviceID) {
				isAvailableChe = false;
			}
		}
		if (isAvailableChe) {
			RegisterMySql2(data, lSocket, referral_code);
		} else {
			lSocket.emit("OneDeviceOnly", {});
		}
	});
}
function RegisterMySql2(data, lSocket, referral_code) {
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	var tDate = date + "-" + month + "-" + year;

	var today = new Date();
	data.created_at = today;
	data.updated_at = today;
	data.chips = 0;
	data.cash = 0;
	data.status = "deactive";
	data.referral_code = referral_code;
	data.guest = "1";

	let hash = bcrypt.hashSync(data.password, 10);
	var post = {
		name: data.name, password: "", username: "", email: data.email, chips: data.chips, cash: data.cash, referral_code: data.referral_code,
		referby_friends: data.refer, mobile: data.mobile, status: data.status, withdraw_limit: null, created_at: data.created_at, updated_at: data.updated_at,
		verify_mobile: "not_verify", bonus: 0, account_holder_name: "", account_number: "", ifsc_code: "",
		upi_id: "", paytm: "", device_id: data.deviceID, today_date: tDate
	};
	pool.query('INSERT INTO categories SET ?', post, function (error, result, fields) {
		if (error) {
			console.log("user already registered  " + result + " " + error);
		} else {
			console.log("user registered sucessfully " + data.email);
			SignUpBonus(data.refer);
			VerifyUserMongoDB(data, lSocket, "new");
		}
	});
}

async function VerifyUserMongoDB(data, lSocket, new_user) {
	var email = data.email;
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		var empty = 0;
		for (var i in result) {
			if (result[i].email == email) {
				empty = 1;
				lSocket.emit("VerifyUser", {
					id: result[0].id, name: result[i].name, email: result[i].email, chips: result[i].chips, cash: result[i].cash,
					status: "yes", guest: data.guest, referby_friends: result[i].referby_friends, withdraw_limit: result[i].withdraw_limit,
					mobile: result[i].mobile, verify_mobile: result[i].verify_mobile, bonus: result[i].bonus, referral_code: result[i].referral_code,
					account_holder_name: result[i].account_holder_name, account_number: result[i].account_number, ifsc_code: result[i].ifsc_code,
					upi_id: result[i].upi_id, paytm: result[i].paytm, new_user: new_user, played: result[i].played
				});
			}
		}
		if (empty == 0)
			lSocket.emit("VerifyUser", { email: email, status: "no" });
		return empty;
	});
}

function WithdrawMongoDB(lSocket, data) {
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [data.email], function (error, result, fields) {
		for (var i in result) {
			if (result[i].email == data.email) {
				var rCash = result[i].cash;
				if (rCash >= parseFloat(data.withdrawAmt)) {
					rCash -= parseFloat(data.withdrawAmt);
					WithdrawMongoDB2(lSocket, data, rCash);
				} else
					lSocket.emit("Withdraw", { status: "failed" });
			}
		}
	});
}
function WithdrawMongoDB2(lSocket, data, cash) {
	var sql = "UPDATE categories set cash = ? WHERE email = ?";
	pool.query(sql, [cash, data.email], function (err, result) {
		if (!err)
			WithdrawMongoDB3(lSocket, data, cash);
		else
			lSocket.emit("Withdraw", { status: "failed" });
	});
}
function WithdrawMongoDB3(lSocket, data, cash) {
	var today = new Date();
	var post = {
		email: data.email,
		method: data.wTypeStr,
		amount: data.withdrawAmt,
		acc_number: "",
		ifsc: "",
		acc_name: "",
		upi: data.upi,
		paytm: data.paytm,
		status: "Pending",
		created_At: today, updated_at: today
	};
	pool.query('INSERT INTO withdrawals SET ?', post, function (error, result, fields) {
		if (error) {
			console.log("con " + error);
			lSocket.emit("Withdraw", { status: "failed" });
		} else {
			lSocket.emit("Withdraw", { status: "success", cash: cash });
			withdrawInfoDeposit(data.email, data.withdrawAmt);
		}
	});
}
function withdrawInfoDeposit(email, amount) {
	var today = new Date();
	var data = [];
	data.created_at = today;
	data.updated_at = today;
	data.commission = 0;
	data.orderId = "";
	data.amount = amount;
	data.status = "completed";
	data.method = "Withdraw";
	data.game_name = "Ludo Real";
	data.email = email;

	var post = {
		orderId: data.orderId,
		email: data.email,
		amount: data.amount,
		status: data.status,
		method: data.method,
		commission: data.commission,
		game_name: data.game_name,
		created_at: data.created_at,
		updated_at: data.updated_at
	};
	pool.query('INSERT INTO payment_methods SET ?', post, function (error, result, fields) {
		console.log("not done " + error);
		if (!error) {
			console.log("Data inserted sucessfully ");
		} else {
			console.log("not done " + error);
		}
	});
}

function VerifyChips(email, user_chips, lSocket) {
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		if (result.length != 0) {
			var chValue = parseFloat(result[0].chips, 10);
			chValue -= parseFloat(user_chips, 10);
			if (chValue < 0)
				chValue = 0;
			Updated_Chips(result[0].email, chValue, lSocket);
		}
	});
}
function Updated_Chips(email, chips, lSocket) {
	var sql = "UPDATE categories set chips = ? WHERE email = ?";
	pool.query(sql, [chips, email], function (err, result) {
		if (err) {
			console.log("error update document");
		} else {
			lSocket.emit("Updated_Chips", { chips: chips });
		}

	});
}
function VerifyCash(email, lSocket) {
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		if (result.length != 0) {
			var chValue = parseFloat(result[0].cash, 10);
			//console.log("cash " + result[0].email + " " + chValue);
			Updated_Cash(email, chValue, lSocket);
		}
	});
}
function Updated_Cash(email, cash, lSocket) {
	var sql = "UPDATE categories set cash = ? WHERE email = ?";
	pool.query(sql, [cash, email], function (err, result) {
		if (err) {
			console.log("error update document");
		} else {
			lSocket.emit("Updated_Cash", { cash: cash });
		}
	});
}

function GetDepositFunc(email, lSocket) {
	var sql = 'SELECT * FROM payment_methods WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		var empty = 0;
		for (var i in result) {
			if (result[i].status == "available" && empty == 0) {
				if (result[i].method != "WIN") {
					var rCash = result[i].amount;
					GetDepositFunc2(email, lSocket, parseFloat(rCash), result[i].id);
					empty = 1;
				} else {
					var rCash = result[i].amount;
					GetWinFunc2(email, lSocket, parseFloat(rCash), result[i].id, lSocket);
				}
			}
		}
		if (empty == 0)
			lSocket.emit("GetDeposit", { status: "no" });
	});
}
//win
function GetWinFunc2(email, lSocket, rCash, res_id, lSocket) {
	var sql = "UPDATE payment_methods set status = ? WHERE id = ?";
	var status = "complete";
	pool.query(sql, [status, res_id], function (err, result) {
		if (!err)
			GetWinFunc3(email, lSocket, rCash, res_id, lSocket);
	});
}
function GetWinFunc3(email, lSocket, rCash, res_id, lSocket) {
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		for (var i in result) {
			var cCash = result[i].cash + parseFloat(rCash, 10);
			GetWinFunc4(email, lSocket, cCash, lSocket);
		}
	});
}
function GetWinFunc4(email, lSocket, cCash, lSocket) {
	var sql = "UPDATE categories set cash = ? WHERE email = ?";
	pool.query(sql, [cCash, email], function (err, result) {
		if (!err) {
			VerifyCash(email, lSocket);
		}
	});
}




function GetDepositFunc2(email, lSocket, rCash, res_id) {
	var sql = "UPDATE payment_methods set status = ? WHERE id = ?";
	var status = "complete";
	pool.query(sql, [status, res_id], function (err, result) {
		if (!err)
			GetDepositFunc3(email, lSocket, rCash, res_id);

	});
}
function GetDepositFunc3(email, lSocket, rCash, res_id) {
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		for (var i in result) {
			var cCash = result[i].chips + parseFloat(rCash, 10);
			GetDepositFunc4(email, lSocket, cCash);
		}
	});
}
function GetDepositFunc4(email, lSocket, cCash) {
	var sql = "UPDATE categories set chips = ? WHERE email = ?";
	pool.query(sql, [cCash, email], function (err, result) {
		if (!err)
			GetDepositFunc5(email, lSocket, cCash);
	});
}
function GetDepositFunc5(email, lSocket, cCash) {
	var sql = 'SELECT * FROM payment_methods WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		var empty = 0;
		for (var i in result) {
			if (result[i].status == "available") {
				empty = 1;
			}
		}
		if (empty == 0)
			lSocket.emit("GetDeposit", { chips: cCash, status: "yes" });
		else GetDepositFunc(email, lSocket);
	});
}
function GetReferFunc(email, lSocket) {
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		for (var i in result) {
			if (result[i].first_deposit == "available") {
				GetReferFunc2(email, lSocket, result[i].referby_friends);
			}
		}
	});
}
function GetReferFunc2(email, lSocket, referby_friends) {
	var sql = 'SELECT * FROM payment_methods WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		var empty = 0;
		var rAmount = 0;
		for (var i in result) {
			if (result[i].method == "CashFree") {
				empty += 1;
				rAmount = result[i].amount;
			}
		}
		if (empty == 1) {
			GetReferFunc3(email, lSocket, referby_friends, rAmount);
		}
	});
}
function GetReferFunc3(email, lSocket, referby_friends, rAmount) {
	var sql = "UPDATE categories set first_deposit = ? WHERE email = ?";
	var complete = "complete";
	pool.query(sql, [complete, email], function (err, result) {
		if (!err)
			GetReferFunc4(email, lSocket, referby_friends, rAmount);
	});
}
function GetReferFunc4(email, lSocket, referby_friends, rAmount) {
	var sql = 'SELECT * FROM categories WHERE referral_code = ?';
	pool.query(sql, [referby_friends], function (error, result, fields) {
		if (result.length != 0) {
			GetReferFunc5(result[0].email, rAmount);
		}
	});
}
function GetReferFunc5(refer_email, rAmount) {
	var today = new Date();
	var amount = (parseFloat(rAmount) / 100);
	amount = amount * 25;
	if (amount > 100)
		amount = 100;
	var post = {
		orderId: "",
		email: refer_email,
		amount: amount,
		status: "available",
		method: "Refer Bonus",
		commission: 0,
		game_name: "Ludo Real",
		created_at: today,
		updated_at: today
	};
	pool.query('INSERT INTO payment_methods SET ?', post, function (error, result, fields) {
		if (!error) {
			console.log("Data inserted sucessfully ");
		} else {
			console.log("not done " + error);
		}
	});
}
function SignUpBonus(referFriend) {
	var sql = 'SELECT * FROM categories WHERE referral_code = ?';
	pool.query(sql, [referFriend], function (error, result, fields) {
		if (result.length != 0)
			SignUpBonus2(result[0].email);
	});
}
function SignUpBonus2(email) {
	var today = new Date();
	var post = {
		orderId: "",
		email: email,
		amount: 1,
		status: "available",
		method: "SignUp Bonus",
		commission: 0,
		game_name: "Ludo Real",
		created_at: today,
		updated_at: today
	};
	pool.query('INSERT INTO payment_methods SET ?', post, function (error, result, fields) {
		if (!error) {
			console.log("Data inserted sucessfully ");
		} else {
			console.log("not done " + error);
		}
	});
}
function InsertDeposit(data, lSocket) {
	var today = new Date();
	data.created_at = today;
	data.updated_at = today;
	data.commission = 0;
	data.orderId = "";
	data.amount = 5;
	data.status = "available";
	data.method = "Deposit Bonus";
	data.game_name = "Ludo Real";

	var post = {
		orderId: data.orderId,
		email: data.email,
		amount: data.amount,
		status: data.status,
		method: data.method,
		commission: data.commission,
		game_name: data.game_name,
		created_at: data.created_at,
		updated_at: data.updated_at
	};
	pool.query('INSERT INTO payment_methods SET ?', post, function (error, result, fields) {
		if (!error) {
			console.log("Data inserted sucessfully ");
			GetDepositFunc(data.email, lSocket)
		} else {
			console.log("not done " + error);
		}
	});
}
function ProfileUpdate(lSocket, email, edit, pStr) {
	var sql;
	if (edit == "ANameEdit")
		sql = "UPDATE categories set account_holder_name = ? WHERE email = ?";
	else if (edit == "AccNumEdit")
		sql = "UPDATE categories set account_number = ? WHERE email = ?";
	else if (edit == "IfscEdit")
		sql = "UPDATE categories set ifsc_code = ? WHERE email = ?";
	else if (edit == "UpiEdit")
		sql = "UPDATE categories set upi_id = ? WHERE email = ?";
	else if (edit == "PaytmEdit")
		sql = "UPDATE categories set paytm = ? WHERE email = ?";
	pool.query(sql, [pStr, email], function (err, result) {
		if (err) {
			console.log("error update document");
		} else {
			lSocket.emit("ProfileEdit", {
				pStr: pStr, edit: edit
			});
		}
	});
}


function PlayedFunc(email, lSocket) {
	var sql = 'SELECT * FROM categories WHERE email = ?';
	pool.query(sql, [email], function (error, result, fields) {
		if (result.length != 0) {
			var pValue = parseInt(result[0].played) + 1;
			PlayedFunc2(email, pValue, lSocket);
		}
	});
}
function PlayedFunc2(email, playedValue, lSocket) {
	var sql = "UPDATE categories set played = ? WHERE email = ?";
	pool.query(sql, [playedValue, email], function (err, result) {
		if (!err) {
			console.log("Played Update success");
			lSocket.emit("Played", { playedValue: playedValue });
		}

	});
}
server.listen(app.get('port'), function () {
	//console.log(server.address())
	console.log("Server is Running : " + server.address().port);
});


function sendSMSFunc(data) {
	var smsReq = unirest("POST", "https://www.fast2sms.com/dev/bulkV2");
	smsReq.headers({
		"authorization": "20hZsEuPgrQYW1oaifjMOwqdAXBbDRGLxUKT9t8pNFyIv7CS5HgSzX9UFba68VkPo02C4n"
	});
	console.log(data.mobile + " " + data.otp);
	smsReq.form({
		"variables_values": data.otp,
		"route": "otp",
		"numbers": data.mobile,
	});

	smsReq.end(function (res) {
		if (res.error) throw new Error(res.error);

		console.log(res.body);
	});
}
app.get("/test",(req,res)=>{
	console.log("Hi I am Vasile");
	
});
app.get("/payments", (req, res) => {
	user_email = req.query.email;
	//console.log(user_email);
	res.render("payment", {
		key: razorpay_key_id,
		amount: (req.query.amount + "00"),
		email: user_email,
		mobile: req.query.mobile,
	});
});

app.post("/api/payment/order", (req, res) => {
	params = req.body;
	instance.orders
		.create(params)
		.then((data) => {
			res.send({ sub: data, status: "success" });
		})
		.catch((error) => {
			res.send({ sub: error, status: "failed" });
		});
});

app.post("/api/payment/verify", (req, res) => {
	body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
	var expectedSignature = crypto
		.createHmac("sha256", razorpay_key_secret)
		.update(body.toString())
		.digest("hex");
	console.log("sig" + req.body.razorpay_signature + " " + req.body.amount);

	var response = { status: "failure" };
	if (expectedSignature === req.body.razorpay_signature) {
		var chValue = parseInt(req.body.amount, 10) / 100;
		razorPayDeposit(user_email, chValue);
		response = { status: "success" };
	}
	//console.log(response);
	res.send(response);
});


function razorPayDeposit(email, amount) {
	var today = new Date();
	var data = [];
	data.created_at = today;
	data.updated_at = today;
	data.commission = 0;
	data.orderId = "";
	data.amount = amount;
	data.status = "available";
	data.method = "Razorpay";
	data.game_name = "LudoReal";
	data.email = email;


	var post = {
		orderId: data.orderId,
		email: data.email,
		amount: data.amount,
		status: data.status,
		method: data.method,
		commission: data.commission,
		game_name: data.game_name,
		created_at: data.created_at,
		updated_at: data.updated_at
	};
	pool.query('INSERT INTO payment_methods SET ?', post, function (error, result, fields) {
		console.log("not done " + error);
		if (!error) {
			console.log("Data inserted sucessfully ");
		} else {
			console.log("not done " + error);
		}
	});
}
function winningDeposit(email, amount) {
	var today = new Date();
	var data = [];
	data.created_at = today;
	data.updated_at = today;
	data.commission = 0;
	data.orderId = "";
	data.amount = amount;
	data.status = "available";
	data.method = "WIN";
	data.game_name = "Ludo Real";
	data.email = email;

	var post = {
		orderId: data.orderId,
		email: data.email,
		amount: data.amount,
		status: data.status,
		method: data.method,
		commission: data.commission,
		game_name: data.game_name,
		created_at: data.created_at,
		updated_at: data.updated_at
	};
	pool.query('INSERT INTO payment_methods SET ?', post, function (error, result, fields) {
		console.log("not done " + error);
		if (!error) {
			console.log("Data inserted sucessfully ");
		} else {
			console.log("not done " + error);
		}
	});
}

function GetNotifications(lSocket, data) {
	var sql = 'SELECT * FROM notifications WHERE email = ?';
	pool.query(sql, [data.email], function (error, result, fields) {
		if (!error) {
			var empty = "no";
			for (var i = 0; i < result.length; i++) {
				lSocket.emit("GetNotifications", {
					id: result[i].id, message: result[i].message, status: result[i].status, created_at: result[i].created_at,
					forYou: data.status
				});
				if (data.status == "you") {
					if (result[i].status == "available") {
						empty = "yes";
					}
				}
			}

			lSocket.emit("NotificationsAlarm", {
				alarm: empty
			});
		}
	});
}

function NotificationsRead(lSocket, data) {
	var sql = "UPDATE notifications set status = ? WHERE email = ?";
	var complete = "complete";
	pool.query(sql, [complete, data.email], function (err, result) {
		if (!err)
			console.log("update read complete");
	});
}

function GetHistory(lSocket, data) {
	var iValue = parseInt(data.no, 10);
	//var sql = 'SELECT * FROM payment_methods WHERE email = ?';
	var sql = "SELECT * FROM payment_methods WHERE email = ? ORDER BY id DESC LIMIT 10 OFFSET " + iValue;
	pool.query(sql, [data.email], function (error, result, fields) {
		if (!error) {

			var empty = 0;
			for (var i = 0; i < result.length; i++) {
				lSocket.emit("GetHistory", {
					status: "yes", no: iValue, date: result[i].created_at, method: result[i].method, amount: result[i].amount,
					game_name: result[i].game_name
				});
				iValue += 1;
				empty = 1;
			}
			if (empty == 0) {
				lSocket.emit("GetHistory", {
					status: "no"
				});
			}
		}
	});
}













