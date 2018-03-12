let edgeViewCount = 0;


function MapEdgeView(mapView, startState, endState) {
	if (startState === undefined)
		console.warn("No start state");
	if (endState === undefined)
		console.warn("No end state");
	let handleR = 40;
	// An edge component, has a start and end socket, sockets are offsets
	this.start = new Vector();
	this.start.anchor = new Vector();
	this.start.theta = 0;
	this.start.state = startState;
	this.start.handle = new Vector();
	this.start.handle.radius = handleR;
	this.start.handle.thetaOffset = 0;

	this.end = new Vector();
	this.end.theta = Math.PI;
	this.end.anchor = new Vector();
	this.end.state = endState;
	this.end.handle = new Vector();
	this.end.handle.radius = handleR;
	this.end.handle.thetaOffset = 0;

	this.offset = new Vector();


	if (startState === endState) {
		this.end.handle.thetaOffset = .5;
		this.start.handle.thetaOffset = -.5;
	}
	this.idNumber = edgeViewCount++;
	this.id = mapView.id + "-edge" + edgeViewCount + "-" + startState.state.id + "-" + endState.state.id;
}


MapEdgeView.prototype.initSVG = function(t) {
	this.svgGroup = $("#" + this.id);
	let inner = toTag("path", {
		class: "path",
		stroke: "black",
		fill: "none"
	}) + toTag("ellipse", {
		class: "startdot",
		rx: 1,
		ry: 1,
		fill: "cyan"
	}) + toTag("path", {
		class: "arrow",
		fill: "black",
		d: "M0,0 L3,7 L0,5 L-3,7 Z"
	});


	this.svgGroup.html(inner);
	this.start.dot = this.svgGroup.find(".startdot");
	this.end.dot = this.svgGroup.find(".enddot");
	this.pathSVG = this.svgGroup.find(".path");
	this.arrowSVG = this.svgGroup.find(".arrow");


	this.update();
	this.updateSVG();

}

MapEdgeView.prototype.update = function(t) {
	if (t !== undefined && t > 0) {}

	this.start.state.setToAnchorPoint(this.start, this.start.theta)

	this.end.state.setToAnchorPoint(this.end, this.end.theta)

}



function offsetAngle(theta, offset, amt) {
	let v = Vector.polar(1, theta);
	if (offset.magnitude() > 0) {
		v.addMultiple(offset, amt / offset.magnitude());
		return v.getAngle();
	}
	return theta
}
MapEdgeView.prototype.updateSVG = function() {


	if (this.start.state !== this.end.state) {
		this.start.handle.thetaOffset = offsetAngle(this.start.theta, this.offset, -.7) - this.start.theta;
		this.end.handle.thetaOffset = offsetAngle(this.end.theta, this.offset, .7) - this.end.theta;


	}

	this.start.state.setToAnchorPoint(this.start.anchor, this.start.theta + this.start.handle.thetaOffset);
	this.end.state.setToAnchorPoint(this.end.anchor, this.end.theta + this.end.handle.thetaOffset);



	let handleMult = (Math.cos(this.offset.getAngle()) + 1) * Math.pow(this.offset.magnitude(), .9) * .3;
	this.end.handle.radius = handleMult;
	this.start.handle.radius = handleMult;



	this.end.handle.setToPolarOffset(this.end.anchor, this.end.handle.radius, this.end.handle.thetaOffset + this.end.theta)
	this.start.handle.setToPolarOffset(this.start.anchor, this.start.handle.radius, this.start.handle.thetaOffset + this.start.theta)

	
	this.arrowSVG.attr({
		transform: "translate(" + this.end.anchor.x + "," + this.end.anchor.y + ") rotate(" + (this.end.handle.thetaOffset + this.end.theta - Math.PI / 2) * 180 / Math.PI + ")"
	})

	this.pathSVG.attr({
		d: "M" + this.start.anchor.toSVG() + " C" + this.start.handle.toSVG() + " " + this.end.handle.toSVG() + " " + this.end.anchor.toSVG()
	})
}


MapEdgeView.prototype.setForce = function(t) {

	this.offset.setToDifference(this.start, this.end);
	let pull = new Vector(this.offset);

	let d = this.offset.magnitude();
	if (d > 0) {
		if (d > 50) {
			let power = -Math.pow(d, .4) * .10;
			//console.log(d)
			this.start.state.a.addMultiple(this.offset, power / d);
			this.end.state.a.addMultiple(this.offset, -power / d);
		}
	}
}