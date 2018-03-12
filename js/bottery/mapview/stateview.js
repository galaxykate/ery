let stateSquash = .3;
// Draw a map in  SVG
function MapViewState(mapView, state) {
	this.state = state;
	this.drag = 0;

	this.id = mapView.id + "-state-" + state.id;

	this.radius = 60;

	this.p = Vector.polar(200 * Math.pow(Math.random(), .7), Math.random() * 6.25);
	this.v = Vector.polar(10 * Math.pow(Math.random(), .7), Math.random() * 6.25);
	this.a = new Vector();

	this.root = $("<div/>", {

			id: this.id,
			class: "mapview-stateroot  mapview-state-" + state.id
		}).appendTo(mapView.stateHolder)

		// Style
		.css({
			position: "absolute",
			left: this.p.y,
			top: this.p.x,
			textAlign: "center",
			
			width: this.radius * 2,
			height: this.radius * 2 * stateSquash,

		})
		// Make it draggable
		.draggable({
			drag: (ev, ui) => {
				this.p.x = ui.position.left + this.radius;
				this.p.y = ui.position.top + this.radius * stateSquash;
				mapView.updateSVG();
			},
			stop: () => {

				mapView.saveFavoritePosition()
			}
		})

	this.pad = $("<div/>", {
		class: "pad"
	}).appendTo(this.root).css({
		width: this.radius * 2,
		height: this.radius * 2,
		position: "absolute",
		//left: -this.radius, 
		top: -this.radius * (1 - stateSquash),
		transform: "scale(1, " + stateSquash + ")",
			borderRadius: 150,
		})

	this.label = $("<div/>", {
		html: state.id
	}).appendTo(this.root).css({
		width: this.radius * 2,
		height: this.radius * 2,
		position: "absolute",
		//left: -this.radius, 
		top: 0

	})


	this.tagHolder = $("<div/>", {
		html: state.tags
	}).appendTo(this.div).css({
		fontSize: "10px",
		top: -5,
		right: 0,
		position: "absolute"
	});


}

MapViewState.prototype.setToAnchorPoint = function(p, theta) {
	p.setToPolar(this.radius, theta);
	p.y *= stateSquash;
	p.add(this.p);
}


MapViewState.prototype.setForce = function(radius, particles) {

	let d = this.p.magnitude();
	if (d > 0) {
		let power = -.02 * Math.pow(Math.max(0, d - radius), .3);
		this.a.setToMultiple(this.p, power / d);


	}

	let bounceRange = 30;
	let offset = new Vector();


	for (var i = 0; i < particles.length; i++) {
		offset.setToDifference(particles[i].p, this.p);
		offset.x *= .02;
		let d2 = offset.magnitude();

		if (d2 > 0 && d2 < bounceRange) {
			let intrusion = (bounceRange - d2) / bounceRange;
			this.a.addMultiple(offset, -5 * Math.pow(intrusion, 1.4) / d2)
		}
	}
}

MapViewState.prototype.updateView = function() {
	this.root.css({
		left: this.p.x - this.radius,
		top: this.p.y - this.radius * stateSquash,
	})
}

MapViewState.prototype.update = function(t) {
	if (t !== undefined && t > 0) {
		this.drag += t * .01;
		this.drag = Math.min(.9999, this.drag);

		this.v.addMultiple(this.a, t);
		this.v.mult(1 - this.drag);


		this.p.addMultiple(this.v, t);
	}
}