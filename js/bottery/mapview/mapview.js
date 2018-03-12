/*
 * Show things about bottery 
 */


let mapViewCount = 0;
// Draw a map in  SVG
function MapView(holder, map, pointers) {
	holder.css({overflow: "none"})
	this.map = map;
	this.id = "mapview" + (mapViewCount++);


	this.mapHolder = $("<div/>", {
		class: "mapview",
		id: this.id,
	}).appendTo(holder);

	let dim = new Vector(this.mapHolder.width(), this.mapHolder.height());

	// Create layers
	// edge layer: svg for connection curves
	// states

	this.mapHolder.append(toTag("svg", {
		id: this.id,
		height: dim.y,
		width: dim.x
	}, toTag("g", {
		id: this.id + "-edges",
		transform: "translate(" + dim.x / 2 + ", " + dim.y / 2 + ")"
	})))

	this.edgeHolder = $("#" + this.id + "-edges");


	this.stateHolder = $("<div/>", {
		class: "mapview-root"
	}).appendTo(this.mapHolder)

	this.stateViews = mapObj(this.map.states, (state) => new MapViewState(this, state))


	// compile all the edges
	this.connections = concatArrays(objToArray(this.stateViews, state => {

		return state.state.exits.map(exit => {
			let target = this.stateViews[exit.target];
			if (exit.target === "*")
				target = state;
			if (target === undefined) {
				console.warn(exit.target + " not found");
			} else {

				if (state === undefined || target === undefined) {
					console.warn("No bad connection added to map: " + exit.target);
				} else
					return new MapEdgeView(this, state, target);

				//	console.log(state.state.exits)
			}
		}).filter(s => s !== undefined)
	}));

	let edgeGroups = this.connections.map((edge) => toTag("g", {
		id: edge.id
	})).join("\n")

	this.edgeHolder.html(edgeGroups)

	this.connections.forEach(c => c.initSVG())
	/*

		$.each(this.connections, (index, connection) => connection.initSVG());

		for (var i = 0; i < 1400; i++) {
			this.update(.2);
		}
	*/

	let count = 0;
	setInterval(() => {

		if (count < 400) {
			//this.update(.2);

		}
	}, 20);

	// Load position
	let savedPositions = localStorage.getItem(this.map.id);

	if (savedPositions !== null) {
		savedPositions = JSON.parse(savedPositions);
		$.each(savedPositions, (id, pos) => {
			let p = pos.split(" ").map(s => parseFloat(s))

			if (this.stateViews[id]) {
				this.stateViews[id].p.setTo(p[0], p[1])
				this.stateViews[id].updateView()
			}

		})

		this.update(.1);
		this.updateSVG(.1);
		this.updateSVG(.1);this.updateSVG(.1);
		console.log(savedPositions)
	}

}


function MapViewPointer(pointer, mapView) {
	this.root = $("<div/>", {
		class: "mapview-pointer"
	}).appendTo(mapView.pointerOverlay).css({
		position: "absolute"
	})

	let shadow = $("<div/>", {
		class: "mapview-pointer-shadow"
	}).appendTo(this.root).css({
		width: 10,
		height: 10,
		borderRadius: 20,
		transform: "scale(1, .4)",
		backgroundColor: "black"

	})

	let triangle = $("<div/>", {
		class: "mapview-pointer-triangle"
	}).appendTo(this.root).css({
		position: "absolute",
		width: 0,
		height: 0,
		bottom: -0,
		left: -15,
		"border-left": "20px solid transparent",
		"border-right": "20px solid transparent",

		"border-top": "120px solid #000"
	})

}


// Save the current state positions of this map
MapView.prototype.saveFavoritePosition = function() {

	let data = mapObj(this.stateViews, s => s.p.x.toFixed(2) + " " + s.p.y.toFixed(2));
	localStorage.setItem(this.map.id, JSON.stringify(data));
}

MapView.prototype.update = function(elapsed) {
	$.each(this.states, (key, state) => state.setForce(100, this.allStates));
	$.each(this.connections, (key, connection) => connection.setForce(elapsed))
	$.each(this.states, (key, state) => state.update(elapsed))
	$.each(this.connections, (key, connection) => connection.update(elapsed))
}


MapView.prototype.updateSVG = function() {
	$.each(this.connections, (key, connection) => connection.updateSVG())
}