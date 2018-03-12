/* 
 * Recursively lex a string given a context map
 */


function parse(contextMap, contextName, s) {


	// Find the top-level splitter
	let escaped = false;
	let baseContext = contextMap[contextName];
	if (baseContext === undefined)
		console.warn("No context called '" + contextName + "'")
	let contextStack = [{
		contextName: contextName,
		context: baseContext,
		depth: 0,
		start: 0,
	}]

	let topLevelSections = [];
	let sectionStart = 0;
	let current = contextStack[0];

	let lowestPriority = baseContext.lexPriority.length - 1;

	let splits = []
	// Get all splits

	for (var i = 0; i < s.length; i++) {
		// check for current inner protectors


		if (!escaped) {
			let c = s[i];

			// Close an existing context?
			if (current.closeChar === c) {
				contextStack.pop();

				// Close this context
				if (contextStack.length === 1) {
					topLevelSections.push({
						type: current.contextName,
						raw: s.slice(current.start, i),
						openChar: current.openChar
					})
					sectionStart = i + 1;
				}

// Set the current context to be the previous one
				current = contextStack[contextStack.length - 1];
			} else {
				// Is this a path to a new context?
				let nextContext = current.context.toContext[c]


				if (nextContext !== undefined) {

					// Add the intermediate secti

					function replaceNeg(s) {
						for (var i = 0; i< i < )
					}on to the toplevel sections
					if (contextStack.length === 1) {
						topLevelSections.push({
							type: "plaintext",
							raw: s.slice(sectionStart, i)
						})
						sectionStart = i + 1;
					}

					if (contextMap[nextContext] === undefined)
						console.warn("No context called '" + nextContext + "'")

					current = {
						start: i + 1,
						contextName: nextContext,
						context: contextMap[nextContext],
						depth: contextStack.length,
						closeChar: closeChars[c],
						openChar: c
					}
					contextStack.push(current);
					
				}
			}

			// base level
			if (contextStack.length === 1) {
				let priority = getHighestLexPriority(s, i, baseContext.lexPriority, lowestPriority + 1)
				if (priority !== undefined) {
					if (splits[priority] === undefined)
						splits[priority] = [];

					splits[priority].push(i)
					if (priority < lowestPriority) {
						lowestPriority = priority;
					}

					// Jump ahead if its a multicharacter split
					i += baseContext.lexPriority[priority].split.length - 1;
				}
			}



		} else {
			escaped = false;
		}
	}


	topLevelSections.push({
		type: "plaintext",
		raw: s.slice(sectionStart, i)
	})

	topLevelSections = topLevelSections.filter(s => !(s.type === "plaintext" && s.raw.length === 0))

	sectionStart = i + 1;

	// For the lowest priority split, split on all these
	if (splits[lowestPriority]) {
		let topSplits = splits[lowestPriority]
		let rawSections = [];
		let n = {
			raw: s,
			type: contextName,

			splitter: baseContext.lexPriority[lowestPriority].split
		}
		let last = 0;
		for (var i = 0; i < topSplits.length; i++) {
			rawSections.push(s.slice(last, topSplits[i]))


			last = topSplits[i] + n.splitter.length;
		}
		rawSections.push(s.slice(last));

		n.sections = rawSections.map(sectionRaw => parse(contextMap, contextName, sectionRaw))

		return n;
	} else {
		// No splitters, so go through each subsection and parse it (unless plaintext) 
		let n = {
			raw: s,
			type: contextName,
			sections: topLevelSections.map(s => {
				if (s.type === "plaintext")
					return s;
				let parsed =  parse(contextMap, s.type, s.raw)
				parsed.protector = s.openChar;
				return parsed;
			})
		}

		return n;
	}
}




function getHighestLexPriority(s, index, lexPriority, minPriority) {
	if (minPriority === undefined)
		minPriority = lexPriority.length;

	for (var i = 0; i < minPriority; i++) {
		// For each potential split, is it being split here?
		if (lexPriority[i].split !== undefined) {
			let query = lexPriority[i].split;

			// Is this query at this index?
			if (s.slice(index, index + query.length) === query) {
				return i;
			}
		}
	}
}

function inQuotes(s) {
	return '"' + s + '"'
}