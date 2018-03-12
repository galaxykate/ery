function createBottery(mainMap, handlers) {
	let main = new BotteryEntity(mainMap, handlers);
	


	return main;
}



//===============================================

function BotteryEntity(mainMap, handlers) {

	this.pointers = {}

	this.blackboard = {}
	this.handlers = {}

	this.map = mainMap

	this.handlers = handlers;
		this.grammar = new TraceryGrammar(this.map.grammar)


	addToBlackboard(this.blackboard, this.map.blackboard)

	this.createPointer(this.map, "main");



}

// Set a value.
// This is local to this entity, unless prefixed with .. or "/"
BotteryEntity.prototype.set = function(path, value) {
	if (typeof path === "string")
		path = path.split("/")

	if (path[0] == "..")
		return this.parent.set(path.slice(1), value)
	if (path[0] == "")
		return this.root.set(path.slice(1), value)

	let val0 = blackboardGet(this.blackboard, path);
	blackboardSet(this.blackboard, path, value);
	if (val0 !== value) {
		if (this.handlers.onChangeBlackboard)
			this.handlers.onChangeBlackboard(path, value)
	}
}

BotteryEntity.prototype.get = function(path) {
		if (typeof path === "string")
		path = path.split("/")

	if (path[0] == "..")
		return this.parent.get(path.slice(1))
	if (path[0] == "")
		return this.root.get(path.slice(1))

	return blackboardGet(this.blackboard, path);
}

BotteryEntity.prototype.onMovePointer = function(pointer) {
	if (this.handlers.onMovePointer)
		this.handlers.onMovePointer(pointer)
}

BotteryEntity.prototype.output = function(channel, data) {
	if (this.handlers.onOutput)
		this.handlers.onOutput(channel, data)
	else
	if (this.parent !== this && this.parent !== undefined) {

		this.parent.output(channel, data)
	}
}

BotteryEntity.prototype.input = function(data) {
	console.log("Input received!", data)
	if (typeof data === "string")
		data = {
			text: data
		}


	this.set("LASTINPUT", data.text)



	// Offer the input to all available pointers/exits

	$.each(this.pointers, (index, p) => p.update());
}


BotteryEntity.prototype.flatten = function(rule) {
	return this.grammar.flatten(rule);
}

BotteryEntity.prototype.update = function(time) {
	$.each(this.pointers, (index, p) => p.update(time))
}


BotteryEntity.prototype.createPointer = function(map, id) {
	let pointer = new Pointer(this, id);
	this.pointers[id] = pointer;

	if (this.handlers.onCreatePointer)
		this.handlers.onCreatePointer(pointer)

	pointer.enterMap(map);

}