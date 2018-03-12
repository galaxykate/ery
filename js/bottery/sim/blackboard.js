// Get gets the value
// or undefined if not defined
function blackboardGet(data, path) {
	for (var i = 0; i < path.length; i++) {
		data = data[path[i]]
		if (data === undefined) {
			//console.log("Not found, path dead at " + path.slice(0, i + 1))
			return undefined
		}

	}
	//console.log("Found " + path + ": " + data)
	return data;
}

function blackboardSet(data, path, value) {
	//console.log("Set at path ", path, value)

	for (var i = 0; i < path.length; i++) {
		// What is the current data?
		let next = path[i]

		// Is this the last one?
		if (i === path.length - 1) {
			if (data[next] !== undefined && data[next] !== value)
				console.warn("Overwriting " + path.slice(0, i) + " current value:", data[next], data)
			data[next] = value
		} else {
			// Get the next object
			if (typeof(data) === "object") {
				if (data[next] === undefined) {
					data[next] = {}
				}
				data = data[next]
			} else {
				// Wait, the next step isn't an object?
				console.warn("'" + next + "' in " + path + " isnt an object!")
			}
		}
	}
}


function blackboardToString(data, endline, spaceChar) {

	function toString(data, spacer) {
		

		switch (typeof data) {

			case "object":
				let s = []
				$.each(data, (index, subdata) => {

					if (typeof subdata === "object") {
						s.push(spacer + "" + index + ":" + endline + toString(subdata, spacer + "" + spaceChar))
					} else {
						s.push(spacer + "" + index + ": " + toString(subdata, spacer))
					}

				})
				return s.join(endline)
				break;
			case "string":
				return spacer + "'" + data + "'";
				break;

			default:

				return spacer + "" + data;
				break;
		}

	}

	return toString(data, "", "")

}

function addToBlackboard(blackboard, values) {
	
	$.each(values, (key, val) => blackboard[key] = values[key]) 

}