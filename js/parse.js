function parse(contextMap, contextName, s) {

	if (typeof s !== "string")
		console.warn("Can't parse non-string ", s);

	let baseContext = contextMap[contextName];
	if (!baseContext)
		console.warn("No context", contextName, "in", contextMap);
	let lowestPriority = baseContext.lexPriority.length - 1;
	let splits = []

	let baseSections = []

	let lastSectionEnd = 0
	navigateNested(contextMap, contextName, {
		onBaseChar: (char, index) => {

			if (baseContext.replaceChar)
				char = baseContext.replaceChar(char, s, index)


			// Get the lex priority of this character that is above the current lowest priority
			let priority = getHighestLexPriority(s, index, baseContext.lexPriority, lowestPriority + 1)


			if (priority !== undefined) {
				if (splits[priority] === undefined)
					splits[priority] = [];

				splits[priority].push(index)
				if (priority < lowestPriority) {
					lowestPriority = priority;
				}

				// Jump ahead if its a multicharacter split
				//i += baseContext.lexPriority[priority].split.length - 1;
			}

		},
		onCloseContext: (openChar, string, contextName, index) => {
			//console.log(openChar, string)

			// Add a section for this context data
			baseSections.push({
				char: openChar,
				inner: string,
				contextName: contextName
			});

			lastSectionEnd = index + 1;

		},
		onOpenContext: (openChar, contextName, index) => {
			//console.log(openChar, index)

			// Add a plaintext section
			baseSections.push({
				inner: s.slice(lastSectionEnd, index),
				plaintext: true,
			})
		}

	}, s);

	// Add one final section
	baseSections.push({
		inner: s.slice(lastSectionEnd),
		plaintext: true,
	})


	// If a splitter occurs, split on the highest priority one
	let splitIndices = splits[lowestPriority];
	if (splitIndices !== undefined) {

		let splitter = baseContext.lexPriority[lowestPriority].split;

		let last = 0
		let sectionsRaw = [];
		for (var i = 0; i < splitIndices.length; i++) {
			sectionsRaw.push(s.slice(last, splitIndices[i]))
			last = splitIndices[i] + splitter.length;
		}
		sectionsRaw.push(s.slice(last))

		return {
			raw: s,
			splitter: splitter,
			sections: sectionsRaw.map(section => parse(contextMap, contextName, section))
		}
	} else {

		// Cleanup the sections

		// Remove any whitespace from plaintext sections
		if (baseContext.clearWhiteSpace) {
			baseSections.forEach(s => {
				if (s.plaintext)
					s.inner = s.inner.trim()
			})
		}

		// Remove empty sections
		baseSections = baseSections.filter(section => !(section.plaintext && section.inner.length === 0))
		baseSections = baseSections.map(section => {
			if (section.plaintext)
				return section.inner

			let parsed = parse(contextMap, section.contextName, section.inner)
			parsed.char = section.char
			return parsed;
		})


		return {
			raw: s,
			sections: baseSections
		}
	}
}



function getHighestLexPriority(s, index, lexPriority, minPriority) {
	if (minPriority === undefined)
		minPriority = lexPriority.length;

	for (var i = 0; i < minPriority; i++) {
		// For each potential split, is it being split here?
		let priority = lexPriority[i];
		let query = priority.split;

		// Is this query at this index?
		if (s.slice(index, index + query.length) === query) {

			if (priority.condition === undefined || priority.condition(s, index)) {
				return i;
			}
		}
	}
}



/*
	Hero function
*/

function navigateNested(contextMap, contextName, handlers, s) {

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


	let current = contextStack[0];


	for (var i = 0; i < s.length; i++) {
		// check for current inner protectors


		if (!escaped) {
			let c = s[i];
			let nextContextName = current.context.toContext[c]


			// Close an existing context?
			if (current.closeChar === c) {
				contextStack.pop();

				if (contextStack.length === 1) {
					if (handlers.onCloseContext)
						handlers.onCloseContext(current.openChar, s.substring(current.start + 1, i), current.contextName, i)
				}

				// Set the current context to be the previous one
				current = contextStack[contextStack.length - 1];
			} else if (nextContextName !== undefined) {
				// Is this a path to a new context?

				if (contextStack.length === 1) {
					if (handlers.onOpenContext)
						handlers.onOpenContext(c, nextContextName, i)
				}

				if (contextMap[nextContextName] === undefined)
					console.warn("No context called '" + nextContextName + "'")

				// Start a new context
				current = {
					start: i,
					contextName: nextContextName,
					context: contextMap[nextContextName],
					depth: contextStack.length,
					closeChar: closeChars[c],
					openChar: c
				}
				contextStack.push(current);


			} else {
				// Escape character?
				if (c === "\\")
					escaped = true;
				else {
					// base level
					if (contextStack.length === 1) {
						if (handlers.onBaseChar)
							handlers.onBaseChar(c, i);
					}
				}

			}

		} else {
			escaped = false;
			if (contextStack.length === 1) {
				if (handlers.onBaseChar)
					handlers.onBaseChar(c, i);
			}
		}
	}
	if (handlers.onFinish)
		handlers.onFinish();

}

function inQuotes(s) {
	return '"' + s + '"'
}