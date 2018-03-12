/* 
 * Create a bottery map and parse out all its commands
 */

/*
 * Variables: 	
 * local(object)	property
 * local(pointer)	foo/bar
 * instance			/instance/
 * data 			/data/
 * in an expression (gp > 15*exp + [/weapon/damage/poison])
 * in a function create(gp)
 */

/*
 * common actions
 * combine lists (a + b), (a + b) where hasTag('foo') 
 */

let testMapBetrayal = {
	id: "betrayal",


	states: {
		origin: {
			exits: "wait:1 ->startGame"
		},

		startGame: {
			onEnterSay: "How many players?",
			exits: [
			"'#number#' ->setup playerCount=parseInt(TEMPLATE_0)",
				"'#use# #weapon#' inList(TEMPLATE_1, inventory) ->* weapon=TEMPLATE_1",
				//"'*' ->* 'Sorry, say a number'"
			],
		},
		setup: {
			onEnterSay: "Initializing mansion with #/playerCount# players",
			onEnter: "create(players,playerCount,'player')",
			exits: "wait:1 ->playerTurn",
		},
		playerTurn: {
			onEnterSay: "Player #/playerIndex#'s turn.  You are in #player/player#",
			exits: "wait:(3 + players+ 2^random(0,players)) ->mansionUpdate",
			onExit: "turnover(players,playerIndex)"
		},
		mansionUpdate: {
			exits: "wait:5 ->playerTurn",
		}
	},

	entityTypes: {
		player: {
			name: "#name#",
			hp: "random(8, 10)",
			inventory: [],
		}
	},

	grammar: {
		number: ["one", "two", "three", "four", "1", "2", "3", "4"],
		weapon: ["spear", "amulet"],
		use: ["use", "equip"],
		go: ["walk", "go", "explore"],
		verb: ["#go#", "#use#"],
			noun: ["#weapon#", "#number#", "#dir#"]

	},


	blackboard: {
		players: [],
		inventory: ["spear"],
		playerIndex: 0,
	}


}

let testMapDungeon = {
	id: "testMapDungeon",
	grammar: {


	},

	states: {
		explore: {
			onEnter: "currentRoom=create(room) 'You are in #/currentRoom#. You see #.join([/currentRoom/objects])#. There are #.joinexits#'",
			exits: ["'fight #thisMonster:monster#' roomObjects.contains(thisMonster) ->fight lastRoom=* ",
				"'take #thisObject:object#' roomObjects.contains(thisMonster) ->* 'you take the #thisObject#'"
			]
		},


	},
	objects: {
		room: {
			parameters: "floor",
			properties: {
				preCreate: "size=randomInt(2, 5) level=floor(floor*random(1,3))",
				description: "'#roomAdj# #roomType# #roomDesc#'",
				treasure: "treasure=createSet(/data/treasure, level*random(1, 9))",
				monsters: "monsters=createSet(/data/monsters, level*random(1, 9))"
			}
		}
	},

	data: {
		monsters: {
			bunny: {
				description: "bunny",
				hp: 1,
				danger: 1
			},
			dragon: {
				description: "dragon",
				hp: 20,
				danger: 5
			}

		}
	},

	blackboard: {

	}
}
let testMapDressupDate = {
	id: "testMapDressupDate",
	grammar: {
		dateAdj: ["shy", "mercurial", "butch", "burly", "macho", "muscular", "mustachio'd", "feminine", "delicate", "bawdy", "gothy", "leather-clad"],
		datePerson: ["lawyer", "boy", "boi", "daddy", "biker", "guy", "dude", "gal", "goth", "queen", "lumberjack", "skater", "femme", "princess", "nerd", "geek", "adventurer", "wizard", "witch"],
		date: "#dateAdj# #datePerson#",
	},
	states: {
		origin: {
			onEnter: "'Welcome to Dress Up Date'",
			exits: "wait(2) ->home"
		},
		inventory: {
			tags: "inventory",
			onEnter: "You look at your closet. You have shoes, dresses, and makeup",
		},
		inventoryShoes: {
			tags: "inventory",
			onEnter: "SHOES: You have #[/shoes].join('\n')#",
		},
		inventoryDresses: {
			tags: "inventory",
			onEnter: "DRESSES: You have #[/dresses].join('\n')#",
		},
		inventoryMakeup: {
			tags: "inventory",
			onEnter: "Apply Makeup?",
			exits: [
				"'yes' ->applyMakeup  makeup='#makeup#' you put on #/makeup#.'",
				"'no' ->inventory",
			]
		},

		shop: {
			exits: ["'buy dress' ->* add(/dresses,create('dress', /shopLevel))",
				"'buy shoes' ->home add(/shoes,create('shoes', /shopLevel))",
				"'buy makeup' ->home  add(/makeup,create('makeup', /shopLevel)",
				"'exit' ->home"
			],
		},

		home: {
			exits: [

				"'closet' ->inventory",
				"'go on a date' ->startDate currentDate='#date#'",
			]
		},

		startDate: {
			onEnter: "'You are on a date with #date#, flirt or leave?' startMap(dinner) startMap(date)",
			exits: ["'flirt' ->flirtResult flirtQuality=random()", "'#leave#' ->home"]
		},

		flirtResult: {
			onEnter: "",
			exits: ["flirtQuality>.5 ->onDate 'you flirt successfully'",
				"->onDate 'you pour wine on yourself"
			]
		},
	},

	tags: {
		inventory: {
			exits: ["'exit' ->*",
				"'#showMe# shoes' ->inventoryShoes",
				"'#showMe# dresses' ->inventoryDresses",
				"'#showMe# makeup' ->inventoryMakeup",
			],
		}
	},

	exits: [
		"'look at self' ->* 'you are wearing #/makeup#, #/shoes#, and #/dress.a#'"
	],

	submaps: {
		dinner: {
			states: {
				origin: {
					onEnterSay: "You are at #bar#",
					exits: ["wait:5 ->orderDinner"]
				},

				orderDinner: {
					onEnterSay: "What do you want for dinner?",
					exits: ["'*' or wait:5 nextCourse='orderDessert' ->eating  food='#food#' foodCost=random(10, 30)  'You order #food# for #/foodCost#' bill+=foodCost"]
				},
				orderDessert: {
					onEnterSay: "Order a dessert?",
					exits: ["#yes# nextCourse='pay' ->eating foodCost=random(5, 10) food='#dessert#' foodAmt=random(2, 8) 'You order #food# for #/foodCost#' bill+=foodCost",
						"'no' or wait:5 ->pay 'No dessert then'"
					]
				},
				eating: {
					onEnter: "'You take a bit of #/food#.  There are #/foodAmt# bites left' foodAmt--",
					exits: ["wait:5 ->nextcourse 'the waiter removes your #/food#",
						"footAmt==0 ->nextcourse 'the waiter removes your #/food#"
					]
				},
				pay: {
					onEnterSay: "The waiter is looking at your table expectantly",
					exits: ["'offer to pay' money>bill ->EXITMAP", "wait:5 ->EXITMAP"],
				}
			}
		},

		date: {
			origin: {
				// setup date
				onEnter: "Your date is #/date/name#, #/date/they# is wearing #date/outfit#",
				exits: ["'*' ->chat"],
			},
			chat: {
				// setup date
				onEnterSay: "You should make conversation",
				exits: ["'ask about childhood' ->respondToChat '#/date/they# tells you some stories.",
					"'ask about job' ->origin '#/date/they# is #job.a#.'",
					"'leave' ->EXITMAP 'you stand up and run out, leaving your date bewildered"
				],
			},

			respondToChat: {
				onEnterSay: "Your date looks at you expectantly",
				exits: ["smile #conversationalAdv# ->chat", "'#gesture#' ->chat", "wait:5 ->chat 'your date looks awkward'"],
			}
		}
	},

	blackboard: {
		makeup: "no makeup",
		dress: "ecru smock",
		shoes: "no shoes",
		inventory: {
			boyfriends: [],
			dresses: [],
			shoes: [],
			makeup: 0,
		}
	},

	objects: {
		dress: {
			parameters: "level",
			preCreate: "quality=floor(level*random()) description='#dress{/level}#'",
			stats: {
				trend: "tagSum(/description,'trend')",
				geek: "tagSum(/description,'geek')",
				sexy: "tagSum(/description,'sexy')",
				femme: "tagSum(/description,'femme')",
				power: "tagSum(/description,'power')",
				macho: "tagSum(/description,'macho')",
				pockets: "hasTag(/description, 'pockets')"
			}
		},
		shoes: {
			parameters: "level",
			preCreate: "quality=floor(level*random()) description='#shoes{/level}#'",
			stats: {
				comfort: "tagMult(/description,'comfort')",
				trend: "tagSum(/description,'trend')",
				geek: "tagSum(/description,'geek')",
				sexy: "tagSum(/description,'sexy')",
				femme: "tagSum(/description,'femme')",
				power: "tagSum(/description,'power')",
				macho: "tagSum(/description,'macho')",
			}
		}

	}
}