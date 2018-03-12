/* 
 * Little fake chat app
 */



function Chat(holder) {

	this.bubbles = []
	this.voices = {
		"player": 0,
		"bot": 1
	}

	this.div = createContainer(holder, "chat", "chatapp")

	this.div.content.addClass("chat")
	this.div.css({
		display: "flex",
		flexDirection: "column"
	})

	this.chatHolder = $("<div/>", {
		class: "chat-log",
	}).appendTo(this.div.content)

	this.textEntryRow = $("<div/>", {
		class: "chat-inputrow",

	}).appendTo(this.div.content)

	this.textEntry = $("<div/>", {
		class: "chat-input",

	}).appendTo(this.textEntryRow)

	this.textEntryBox = $("<input/>", {

	}).appendTo(this.textEntry).keyup((ev) => {
		if (ev.which === 13) {
			let text = this.textEntryBox.val();
			this.textEntryBox.val("")
			this.say("player", text)
		}

	})


	this.enterButton = $("<button/>", {
		class: "chat-enter",
		html: "⏎"
	}).appendTo(this.textEntryRow)

	this.currentBubble;
}

Chat.prototype.scroll = function() {
	this.chatHolder.scrollTop(this.chatHolder.prop("scrollHeight"));

}
Chat.prototype.closeBubble = function(index) {
	this.currentBubble = undefined;
	
	}

Chat.prototype.createBubble = function(index) {
	let bubbleRow = $("<div/>", {
		class: "chat-bubblerow chat-bubblerow-" + index
	}).appendTo(this.chatHolder)

	let bubble = $("<div/>", {
		class: "chat-bubble chat-bubble-" + index
	}).appendTo(bubbleRow)

	bubble.owner = index;
	this.currentBubble = bubble;
	return bubble
}
Chat.prototype.type = function(who, text) {
	//console.log(who, text)
	if (this.currentBubble && this.currentBubble.owner === this.voices[who]) {
		this.currentBubble.append(text)
	} else {
		this.say(who, text)
	}

	this.scroll();
}

Chat.prototype.say = function(who, text) {
	if (text.trim().length > 0) {
		let bubble = this.createBubble(this.voices[who])
		bubble.html(text)
		bubble.css({
			transform: "scale(1, 1)"
		})
	}

	if (who === "player") {

		if (this.bottery)
			this.bottery.input(text)

	}

	this.scroll()

}