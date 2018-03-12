//===============================================

function BotteryMap(rawMap) {
	this.onEnter = [{
		type: "output",

		value: "you enter a map"
	}]

	this.states = mapObj(rawMap.states, (rawState, id) => {
		return new BotteryState(id, rawState)
	})


	this.grammar = rawMap.grammar;
	if (rawMap.grammar === undefined)
		this.grammar = {}

	this.blackboard = rawMap.blackboard;
	if (rawMap.blackboard === undefined)
		this.blackboard = {}

}


BotteryMap.prototype.collectExits = function(stateID) {
	let state = this.states[stateID];
	let exits = state.exits;

	$.each(state.tags, (index, tag) => {
		exits = exits.concat(this.tags[tag])
	})
	return exits;
}

//===============================================

function BotteryState(id, rawState) {
	this.id = id;
	this.onEnter = []
	this.onExit = []

	this.tags = []
	if (rawState.tags) {
		this.tags = rawState.tags
		if (typeof rawState.tags === "string") {
			this.tags = rawState.tags.split(" ")
		}
	}

	if (!rawState.exits) {
		console.warn("No exits for " + id)
	}

	let rawExits = rawState.exits;
	if (!Array.isArray(rawExits))
		rawExits = [rawState.exits]
	this.exits = rawExits.map((rawExit) => new BotteryExit(rawExit))

	if (rawState.onEnterSay)
		this.onEnter.push({
			type: "output",
			channel: "main",
			value: rawState.onEnterSay
		})

	if (rawState.onExitSay)
		this.onExit.push({
			type: "output",
			channel: "main",
			value: rawState.onExitSay
		})
}


//===============================================


function parseExpression(preparsed) {

	if (preparsed.sections.length === 1) {
		let s = preparsed.sections[0];
		switch (s.char) {

			// Non-function (): "(foo)"
			case "(":
				return parseExpression(s)
				break;

				// No char?
			case undefined:
				if (!isNaN(s))
					return {
						type: "number",
						value: parseFloat(s)
					}
				else
					return {
						type: "blackboardPath",
						value: s
					}
				// a number or symbol
				break;
			default:
				console.warn("Unknown expression character", s.char)
		}
	} else {

		if (preparsed.splitter) {
			// do splitter stuff
			if (["*", "/", "-", "+", "%", "^", "==", "!=", "<", ">", ">=", "<=", "!"].includes(preparsed.splitter)) {
				return {
					type: "operator",
					op: preparsed.splitter,
					sections: preparsed.sections.map(s => parseExpression(s))
				}
			} else {
				console.warn("Unexpected operator", preparsed.splitter)
			}
		} else {
			if (preparsed.sections.length === 2 && preparsed.sections[1].char === "(") {
				let fxn = {
					type: "function",
					key: parseKey(preparsed.sections[0]),
				}
				if (preparsed.sections[1].splitter === ",") {
					fxn.parameters = preparsed.sections[1].sections.map(s => parseExpression(s))
				} else {
					fxn.parameters = [parseExpression(preparsed.sections[1])]
				}
				return fxn;
			}
		}
	}
}

function parseTemplate(preparsed) {
	let template = {
		type: "template",
		sections: preparsed.sections.map(s => {
			if (typeof s === "string") {
				return {
					type: "plainText",
					val: s
				}
			} else {
				return {
					type: "templateKey",
					val: s.sections[0]
				}
			}
		})
	}
	return template
}

function parseKey(preparsed) {
	if (typeof preparsed === "string") {
		return preparsed
	}

	if (preparsed.splitter !== undefined)
		console.warn("Unknown key type: " + preparsed)
	if (typeof preparsed.sections[0] !== "string")
		console.warn("Unknown key type: " + preparsed)
	return preparsed.sections[0]
}


//========================================================================
//========================================================================
//========================================================================
//========================================================================

function parseAction(preparsed) {

	console.log(preparsed)
	if (preparsed.splitter === "=") {
		return {
			type: "setter",
			path:  parseKey(preparsed.sections[0]),
			value: parseExpression( preparsed.sections[1])
		}
	} else {

		if (preparsed.sections.length === 1) {
			let s = preparsed.sections[0]
			switch (s.char) {
				case "'":
					return {
						raw: preparsed.raw,
						type: "output",
						value: s
					}
					break;

				case "\"":
					return {
						raw: preparsed.raw,
						type: "output",
						value: s
					}
					break;
				case "(":
					let exp = parseExpression(s)
					exp.raw = preparsed.raw;
					return exp;
				default:
					console.warn("Unknown action format: ", preparsed)
					return {
						raw: preparsed.raw,
						type: "error"
					}
					break;
			}

		} else {
			let exp = parseExpression(preparsed)
			exp.raw = preparsed.raw
			return exp
		}

	}

}

function parseActions(preparsed) {
	console.log("PARSE ACTIONS", preparsed)

	if (preparsed.splitter === " ") {
		let parsed = preparsed.sections.filter(s => s.raw.length > 0).map(s => parseAction(s))
		return parsed;
	} else {
		if (preparsed.raw === "")
			return []

		return [parseAction(preparsed[0])]
	}
}


//========================================================================
//========================================================================
//========================================================================
//========================================================================

function parseCondition(preparsed) {
	if (preparsed.splitter === ":") {
		return {
			raw: preparsed.raw,
			type: "command",
			command: parseKey(preparsed.sections[0]),
			value: parseExpression(preparsed.sections[1])
		}
	} else {

		if (preparsed.sections.length === 1) {
			let s = preparsed.sections[0]
			switch (s.char) {
				case "'":
					return {
						raw: preparsed.raw,
						type: "template",
						template: parseTemplate(s)
					}
					break;

				case "\"":
					return {
						raw: preparsed.raw,
						type: "template",
						template: parseTemplate(s)
					}
					break;
				case "(":
					let exp = parseExpression(s)
					exp.raw = preparsed.raw;
					return exp;
				default:
					console.warn("Unknown condition format: ", preparsed)
					return {
						raw: preparsed.raw,
						type: "error"
					}
					break;
			}

		} else {
			let exp = parseExpression(preparsed)
			exp.raw = preparsed.raw
			return exp
		}

	}

}

function parseConditions(preparsed) {

	if (preparsed.splitter === " ") {
		let parsed = preparsed.sections.filter(s => s.raw.length > 0).map(s => parseCondition(s))
		return parsed;
	} else {
		if (preparsed.raw === "")
			return []
		console.warn("Unknown condition format ", preparsed)
		return []
	}
}

//========================================================================
//========================================================================
//========================================================================
//========================================================================

function BotteryExit(rawExit) {

	this.raw = rawExit;

	function parseTarget(target) {
		return target.sections[0];
	}
	console.log(rawExit)

	let parsed = parse(languages.bottery.contextMap, "exit", rawExit)

	if (parsed.splitter === "->") {
		this.conditions = parseConditions(parsed.sections[0]);
		if (parsed.sections[1].splitter === " ") {
			this.target = parseTarget(parsed.sections[1].sections[0]);
			this.actions = parseActions(parsed.sections[1].sections.slice(1));
			console.log(this.actions);
		} else {
			this.target = parseTarget(parsed.sections[1]);
			this.actions = [];
		}

	} else {
		console.warn("Unknown exit format " + inQuotes(rawExit));
	}

	if (this.target === undefined) {
		console.warn(rawExit)
	}
}