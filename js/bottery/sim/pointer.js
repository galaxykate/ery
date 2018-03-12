/* 
 * Almost everything in bottery is driven with a pointer
 * Think of a pointer like a token in monopoly, it indicates where you are
 *  Sometimes there are multiple pointers, across several maps
 *  Each pointer also has a blackboard that it can refer to
 */
let pointerCount = 0;

function Pointer(entity, id) {
	this.entity = entity;
	this.idNumber = pointerCount++;
	this.id = id;
	this.currentTime = 0;
	this.timeEnteredState = 0;


	this.exitMonitors = [];
	this.stateStack = [];
	this.handlers = {
		onMove: [],
		onTimeUpdate: [],
		onExitStatusChanged: []
	}
}

Pointer.prototype.notify = function(actionName, handler) {
	if (this.handlers[actionName] === undefined)
		console.warn(actionName + " is not a defined handler")
	this.handlers[actionName].push(handler)
}

/*
 * Input format
 * We want to support all sorts of inputs, strings, text, data, chip
 * String
 * OR
 * object {type, text, speaker...?}
 */
Pointer.prototype.input = function(input) {
	console.log(this + " receives input " + input)

}



Pointer.prototype.update = function(time) {

	// Do a time update
	if (time) {
		this.currentTime = time.current;

		let t = this.currentTime - this.timeEnteredState
		this.timeInState = t;
		this.handlers.onTimeUpdate.forEach(handler => handler.call(this))


		let changes = [];

		if (this.activeExit) {
			if (this.activeExit.checkTime(time)) {

				console.log("USE EXIT!", this.activeExit);

				this.activeExit.exit.actions.forEach(action => this.perform(action))

				this.enterState(this.activeExit.targetID)
				this.activeExit = undefined;
			}

		}

		this.exitMonitors.forEach(monitor => monitor.update(changes))

		if (changes.length > 0) {

			if (this.activeExit === undefined) {
				let openExits = this.exitMonitors
					.filter(monitor => monitor.isOpen)
				if (openExits.length > 0) {
					this.activeExit = openExits[0];
					this.activeExit.activate();
				}
			}
			this.handlers.onExitStatusChanged.forEach(handler => handler.call(this))

		}
	}

	/*
	 * Update all the exits
	 */


}

Pointer.prototype.collectExits = function() {

	// Collect all of the exits currently available from this state
	let exits = this.map.collectExits(this.currentState.id)
	this.exitMonitors = exits.map(exit => new ExitMonitor(this, exit))
}



// A map is just a dictionary of parsed states, etc
Pointer.prototype.enterMap = function(map, stateID) {
	this.map = map;


	// Do all the entry actions
	map.onEnter.forEach(action => {
		this.perform(action);
	})

	if (!stateID)
		stateID = "origin"
	this.enterState(stateID)
}

Pointer.prototype.evaluateExpression = function(expression) {
	switch (expression.type) {
		case "blackboardPath":
			let val = this.entity.get(expression.value);
			return val;
			break;

		case "function":
			if (expression.key in botteryFxns) {

				let parameters = expression.parameters.map((param) => this.evaluateExpression(param))
				let value = botteryFxns[expression.key].apply(this, parameters)

				return value;
			}

			break;

		case "number":
			return expression.value
			break;

		default:

			console.warn("Not implemented: " + expression.type, expression.raw)
			return false;
			break;
	}
}
Pointer.prototype.evaluateCondition = function(condition) {
	switch (condition.type) {
		case "command":
			if (condition.command === "wait") {

				let val = this.evaluateExpression(condition.value)

				return {
					value: this.timeInState > val,
				}
			}

			break;
		case "template":
			// TODO match this against some text
			let lastInput = this.entity.blackboard.LASTINPUT

			if (lastInput) {
				let s = lastInput.slice(0).trim().toLowerCase()
				let templateMatches = [];

				for (var i = 0; i < condition.template.sections.length; i++) {
					let section = condition.template.sections[i]

					if (section.type === "plainText") {
						let query = section.val.trim().toLowerCase()
						if (s.startsWith(query)) {
							s = s.slice(query.length)
						} else {
							return {
								value: false,
								reason: section.val + " not found in " + s
							}
						}

					} else {
						// Get rules
						let rules = this.entity.grammar.getRules(section.val).map(rule => rule.raw.toLowerCase().trim())
						rules = rules.filter(rule => s.startsWith(rule))

						if (rules.length > 0) {
							templateMatches.push(rules[0])
							s = s.slice(rules[0].length).trim();
						} else {
							return {
								value: false,
								reason: "no matching rules found for " + inQuotes(section.val) + " for substring " + inQuotes(s)
							}
						}
					}
				}

				if (s.trim().length === 0) {
					return {
						value: true,
						templateMatches: templateMatches
					}
				} else {

					// Still has extra stuff on the end?
					return {
						value: false,
						templateMatches: templateMatches,
						reason: "unmatched string portion " + s
					}
				}
			} else {
				return {
					value: false,
					reason: "No input "
				}
			}
			break;
		default:

			return {
				value: this.evaluateExpression(condition)
			}
			break;
	}

}

Pointer.prototype.perform = function(action) {
	switch (action.type) {
		case "output":
			this.entity.output("say", action.value)

			break;


		default:
			console.warn("unknown action type:" + action.type, action.raw)
	}
}



Pointer.prototype.enterState = function(stateID) {
	if (stateID === "*")
		stateID = this.currentState.id;

	let state = this.map.states[stateID]
	if (!state)
		console.warn("No state for id '" + stateID + "'")

	// Changing state?
	if (!this.currentState || this.currentState.id !== stateID) {
		this.entity.output("debug", this + " enters " + stateID)

		this.stateStack.push(stateID)

	} else {
		this.entity.output("debug", this + " reenters " + stateID)
	}


	// TODO
	// EXIT ACTIONS
	// TODO: TAG actions

	// Do exit stuff
	if (this.currentState)
		this.currentState.onExit.forEach(action => this.perform(action))

	this.currentState = state;

	// Do entrance stuff
	this.currentState.onEnter.forEach(action => this.perform(action))

	this.collectExits();


	// Record the time we entered
	this.timeEnteredState = this.currentTime;

	// Do exit stuff

	this.handlers.onMove.forEach(handler => handler.call(this))
	this.entity.onMovePointer(this)
}


Pointer.prototype.toString = function() {
	return "Pointer" + this.id

}

//==================================================

function ExitMonitor(pointer, exit) {
	this.pointer = pointer;
	this.exit = exit;

	this.targetID = exit.target;

	// This condition might 
	// Pattern matching: "attack foo" "wear blue dress"
	this.conditionMonitors = exit.conditions.map(cond => new ConditionMonitor(pointer, cond))

	this.isOpen = false;
	this.isActivated = false;
}

ExitMonitor.prototype.activate = function() {
	this.isActivated = true;
	this.time = 0;
}
ExitMonitor.prototype.checkTime = function(t) {

	this.time += t.elapsed;
	if (this.time > activationTime)
		return true;
}



ExitMonitor.prototype.update = function(changes) {
	let falseCount = 0;
	this.conditionMonitors.forEach(monitor => {
		monitor.update()
		if (!monitor.isTrue) {
			falseCount++
		}

		// If the monitor has template matches, add them
		if (monitor.templateMatches) {
			monitor.templateMatches.forEach((match, index) => this.pointer.entity.set("TEMPLATE_" + index, match))
		}
	})

	if (this.isOpen && falseCount > 0) {
		this.isOpen = false;
		changes.push(this);
		return true;
	}
	if (!this.isOpen && falseCount == 0) {
		this.isOpen = true;
		changes.push(this);
		return true;
	}


}

//==================================================
// Monitor the state of this particular condition

function ConditionMonitor(pointer, condition) {
	this.pointer = pointer;
	this.condition = condition;
	this.isTrue = false;

}

ConditionMonitor.prototype.update = function() {
	this.evaluation = this.pointer.evaluateCondition(this.condition)



	this.failReason = this.evaluation.reason;
	this.templateMatches = this.evaluation.templateMatches;
	this.isTrue = this.evaluation.value;

	// if (this.failReason)
	// 	console.warn(this.failReason)

}