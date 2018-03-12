/* 
 * Implement a tracery
 * The grammar is untouchable, except to parse out the rules
 */


let testGrammar = {
	count: 5,
	outcome: {
		falldown: {
			"isTagged(myAdj,'good')": "and the #myAdj# #myAnimal# ate pie",
			"isTagged(myAdj,'bad')": "and the #myAdj# #myAnimal# ate cake",
			default: "and the #myAdj# #myAnimal# had a nap"
		}
	},

	consonant: ["tr", "l", "p", "r", "sk", "b", "f"],
	vowel: ["ary", "olly", "appery", "o", "ay", "a", "oo"],
	syllable: "#consonant##vowel#",
	animal: ["zebra", "emu", "okapi", "corgi"],
	adj: ["evil<bad>", "tipsy", "happy<good>", "jolly<good>", "silly", "sheepish", "sleepy", "sinister<bad>", "envious<good>", "loving<good>", "curious", "trendy", "laughing"],
	setChorus: "[chorus:#syllable# #syllable# #syllable# {#syllable#}]",
	//origin: "#setChorus##.test.join('#story#' for myAnimal in animal where myAnimal != zebra, '#chorus#')#",
	origin: "#story#",
	story: "#setChorus#[myAdj:#adj#][myAnimal:#animal#]There was #myAnimal.a#, so #myAdj# so #myAdj# was the #myAnimal#. #chorus#"
	//story: "#setChorus#[myAdj:#adj#][myAnimal:#animal#]There was #myAnimal.a#, so #myAdj# so #myAdj# was the #myAnimal#. #outcome.capitalize#"
}

function TraceryGrammar(grammar) {
	this.symbols = {}
	// Clone the grammar
	$.each(grammar, (key, rules) => {
		this.symbols[key] = parseRules(rules);
	})

	itemToDiv(this.symbols, $("#view"));
}



function getRandom(arr) {
	return arr[Math.floor(Math.random() * arr.length)]
}

TraceryGrammar.prototype.getRules = function(key) {
	if (this.symbols[key] === undefined || this.symbols[key].length === 0) {
		return []
	}
	return this.symbols[key]
}

TraceryGrammar.prototype.getRule = function(key) {
	if (this.symbols[key] === undefined || this.symbols[key].length === 0) {
		console.warn("No rules for " + inQuotes(key))
		return "[[" + key + "]]"
	}
	let rule = getRandom(this.symbols[key])
	return rule;
}

TraceryGrammar.prototype.flatten = function(rule) {

	let exp =  new TraceryExpansion(this, rule)
	
return exp.root.finished;
}


TraceryGrammar.prototype.createExpansion = function(rule) {

	return new TraceryExpansion(this, rule)

}


function TraceryExpansion(grammar, rule) {
	if (!rule) {
		rule = "#origin#"
	}


	this.grammar = grammar;
	this.overlays = {

	}
	rule = parse(languages.tracery.contextMap, "rule", rule)

	this.root = new TraceryNode(this, rule, "rule")
	this.root.expand();
}

TraceryExpansion.prototype.pushRules = function(key, rules) {
	if (this.overlays[key] === undefined)
		this.overlays[key] = [];
	this.overlays[key].push(rules)
}

TraceryExpansion.prototype.getRule = function(key) {
	// Check for pushed values
	if (key === "")
		return "";

	if (this.overlays[key] === undefined || this.overlays[key].length === 0) {
		return this.grammar.getRule(key);
	}

	let stack = this.overlays[key];
	let ruleset = stack[stack.length - 1]
	return getRandom(ruleset)
}

TraceryExpansion.prototype.applyMod = function(modAddress, value, parameters) {
	// Check for pushed values


	if (typeof modAddress === "string") {

		let fxn = fxns[modAddress];
		if (fxn !== undefined) {
			return fxn(value, parameters)
		} else {
			return value + ".[[" + modAddress + "]]";
		}
	} else {
		console.warn("path-address modifiers not implemented")
		return value + ".[[" + modAddress + "]]";
	}
}


let fxns = {
	s: s => {
		return s + "s"
	},

	a: s => {
		if (s.startsWith("uni"))
			return "a " + s;
		if ("AEIOUaeiou".indexOf(s.charAt(0)) < 0)
			return "a " + s;
		return "an " + s;
	},
	capitalize: s => {
		return s.slice(0, 1).toUpperCase() + s.slice(1)
	}
}


function TraceryNode(expansion, command, type) {
	this.type = type;
	this.expansion = expansion;
	this.command = command;

}

TraceryNode.prototype.createNode = function(command, type) {
	return new TraceryNode(this.expansion, command, type)
}

TraceryNode.prototype.expand = function() {
	switch (this.type) {
		case "keySection":
			if (typeof this.command === "string") {
				this.finished = this.command;
			} else {
				console.warn("dynamic keySections not implemented")
			}

			break;
		case "ruleGenerator":
			console.log(this.command)
			if (this.command.splitter !== undefined) {
				console.warn("no splitters implemented yet for rule generators", this.command);
				this.finished = ["FOO"]
			} else {
				this.rule = this.createNode(this.command, "rule").expand();
				this.finished = [this.rule.finished]
			}
			break;
		case "action":

			// Push function
			if (this.command.splitter === ":") {

				this.address = this.createNode(this.command.sections[0], "address");
				this.address.expand();

				this.ruleGenerator = this.createNode(this.command.sections[1], "ruleGenerator");
				this.ruleGenerator.expand();

				//console.log(this.address.finished, this.ruleGenerator.finished)
				this.expansion.pushRules(this.address.finished, this.ruleGenerator.finished)
			} else {
				console.warn("non-push actions not yet implemented")
			}
			break;

		case "address":
			// May be a path or not
			if (this.command.splitter === "/") {
				console.log("PATH!")
			} else {
				// regular symbol key

				// Possible complex
				this.keySections = this.command.sections.map((section) => {
					let node = this.createNode(section, "keySection");
					node.expand();
					return node;
				})


				this.finished = this.keySections.map(s => s.finished).join("")

			}



			break;
		case "tag":
			let addressCommand = this.command;
			let modifierCommands = []

			if (this.command.splitter === ".") {
				modifierCommands = this.command.sections.slice(1)
				addressCommand = this.command.sections[0]
			}

			this.address = this.createNode(addressCommand, "address");
			this.address.expand();

			this.key = this.address.finished;

			// Get the rule
			this.selectedRule = this.expansion.getRule(this.key)

			// Handle plain-text rules
			if (typeof this.selectedRule === "string") {
				this.rule = {
					finished: this.selectedRule
				}
			} else {
				this.rule = this.createNode(this.selectedRule, "rule")
				this.rule.expand();
			}

			this.finished = this.rule.finished;
			//console.log(this.key + ": " + this.rule.finished)


			this.modifiers = modifierCommands.map(command => this.createNode(command, "address").expand())


			this.modifiers.forEach(mod => {

				// TODO: parameters
				let modName = mod.finished;
				let parameters = []
				this.finished = this.expansion.applyMod(mod.finished, this.finished, parameters)

			})

			break;
		case "rule":
			// Expand all subsection

			this.subsections = this.command.sections.map(section => {
				if (typeof section === "string")
					return {
						type: "plaintext",
						finished: section
					}

				let type = "unknown"

				if (section.char === "#")
					type = "tag"
				if (section.char === "{")
					type = "protectedRule"
				if (section.char === "[")
					type = "action"

				return this.createNode(section, type)
			})

			this.subsections.forEach(node => {
				if (node.expand !== undefined)
					node.expand();
			});

			this.finished = this.subsections.map(s => s.finished).join("");
			console.log(inQuotes(this.command.raw) + "=>" + inQuotes(this.finished))

			break;
		default:
			console.warn("cant expand node of unknown type: " + this.type)
	}

	return this;
}

//==================================


function parseRules(ruleset) {
	// String, array or object?
	if (typeof ruleset === "string")
		ruleset = [ruleset]
	if (typeof ruleset === "object") {
		if (Array.isArray(ruleset)) {
			// Parse each with Tracery syntax
			return ruleset.map(rule => parse(languages.tracery.contextMap, "rule", rule))
		} else {
			console.warn("object rulesets not yet implemented")
		}
	} else {
		console.warn("unknown ruleset type", typeof ruleset)
	}
}