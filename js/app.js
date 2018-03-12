let pointerViews = []
let blackboardView;
let mapView;
let chat;

let activationTime = .5;
let speechSpeed = 100;

$(document).ready(function() {
	initUI();
	panels.chat.html("")
	chat = new Chat(panels.chat);



	let speechQueue = [];
	let speakingCountdown = 0;
	let speakingLine = "";
	let speaking = false;

	function updateBlackboard() {
		//	console.log("path is now ", path, value)
		panels.blackboard.content.html("")
		objectToDiv(main.blackboard, panels.blackboard.content);
	}

	let main = createBottery(new BotteryMap(testMapBetrayal), {
		onChangeBlackboard: (path, value) => {
			updateBlackboard();
		},

		onCreatePointer: (pointer) => {

			// Create a pointer view in the pointer panel
			let pv = new PointerView(panels.pointer.content)
			pointerViews.push(pv);
			pv.setPointer(pointer)

			// Add a pointer to the map view
			if (mapView)
				mapView.addPointer(pointer)
		},

		onMovePointer: (pointer) => {

			/*
			let text = pointer.entity.flatten("#verb# #noun#");
			chat.say("player",text)
			*/

			$(".mapview-stateroot").removeClass("active")
			$(".mapview-state-" + pointer.currentState.id).addClass("active")
		},

		onCreateEntity: (path, entity) => {
			console.log("created entity", path, entity)
		},

		onOutput: (channel, data) => {

			if (channel === "debug") {
				panels.log.content.append("<div>" + data + "</div>")
				panels.log.content.scrollTop(panels.log.content.prop("scrollHeight"));
			} else {
				speechQueue.push(data)
			}
			// start speaking

		}
	})

	chat.bottery = main;


	mapView = new MapView(panels.map.content, main.map, objToArray(main.pointers, p => p))
	console.log("CREATED MAP VIEW")
	updateBlackboard();

	let time = new AnimTime();

	setInterval(() => {

		time.update();


		main.update(time);

		if (speakingCountdown <= 0 && speaking) {
			speaking = false;
		}
		if (speechQueue.length > 0 && !speaking) {
			speakingLine = speechQueue[0]
			responsiveVoice.speak(speakingLine, "UK English Male", {
				volume: .2
			});


			speechQueue = speechQueue.slice(1)
			speaking = true;
			speakingCountdown = speakingLine.length
		}

		if (speaking) {
			for (var i = 0; i < speechSpeed; i++) {
				if (speakingCountdown > 0) {

					chat.type("bot", speakingLine[speakingLine.length - speakingCountdown])
					speakingCountdown--;
				}
				if (speakingCountdown === 0)
					chat.closeBubble("bot")

			}

		}

	}, 100)



});

let panels = {}



function initUI() {
	let x0 = 0;
	let w0 = 320;
	let w1 = 420;

	let y0 = 0;
	let h0 = 350;
	let h1 = 250;

	function setPanel(id, x, y, w, h) {
		panels[id] = createContainer($("#panels"), "panel-" + id, "panel");

		panels[id].css({
			width: w - 5,
			height: h - 5,
			left: x,
			top: y
		})
	}

	setPanel("chat", x0, y0, w0, h0)

	setPanel("log", x0, y0 + h0, w0, h1)

	setPanel("map", x0 + w0, y0, w1, h0)

	setPanel("pointer", x0 + w0, y0 + h0, w1, h1)
	setPanel("blackboard", x0 + w0 + w1, y0, w0, 500)


}