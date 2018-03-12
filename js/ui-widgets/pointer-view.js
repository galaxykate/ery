let pointerViewCount = 0;

function PointerView(holder) {
	this.id = pointerViewCount;
	this.panel = createContainer(holder, "pointerview", "pointerview section");
	this.location = createParameterRow(this.panel.content, "location", "");
	this.time = createParameterRow(this.panel.content, "time in state", "");

	this.exits = createContainer(this.panel.content, "exits", "exitlist section");
}

PointerView.prototype.setPointer = function(pointer) {
	let view = this;
	this.pointer = pointer;
	this.panel.header.html(pointer.id)

	this.pointer.notify("onMove", () => {
		view.location.content.html(pointer.currentState.id)
		view.relistExits();
	})

	this.pointer.notify("onTimeUpdate", () => {
		view.time.content.html(pointer.timeInState.toFixed(2))
		view.exitViews.forEach(exitView => exitView.updateConditions())

	})

	this.pointer.notify("onExitStatusChanged", () => {
		view.exitViews.forEach(exitView => exitView.update())

	})


}



PointerView.prototype.relistExits = function() {
	this.exits.content.html("")


	this.exitViews = this.pointer.exitMonitors.map((exitMonitor) => new ExitView(this.exits.content, exitMonitor));

}



// A view of this exit monitor
function ExitView(holder, exitMonitor) {
	this.exitMonitor = exitMonitor;

	this.row = $("<div/>", {
		class: "exitrow",
	}).appendTo(holder).click(() => {
		console.log("CLICK")
		exitMonitor.forceOpen();
	}).dblclick(() => {
		exitMonitor.forceActivate();
	})

	this.target = $("<div/>", {
		class: "target",
		html: "►" + exitMonitor.exit.target
	}).appendTo(this.row)

	this.conditionRow = $("<div/>", {
		class: "conditions",
	}).appendTo(this.row)

	this.conditions = this.exitMonitor.conditionMonitors.map((conditionMonitor) => {
		let condView = $("<div/>", {
			html: conditionMonitor.condition.raw,

			class: "conditionview conditionview-" + conditionMonitor.type,
		}).appendTo(this.conditionRow)

		condView.reason = $("<div/>", {
			
			class: "conditionview-reason"
		}).appendTo(condView)

		condView.conditionMonitor = conditionMonitor;
		return condView;
	});

}
ExitView.prototype.updateConditions = function() {

	$.each(this.conditions, (index, condView) => {
			if (condView.conditionMonitor.failReason) {
condView.reason.html(condView.conditionMonitor.failReason)
	}

		if (condView.conditionMonitor.isTrue)
			condView.addClass("true")
		else
			condView.removeClass("true")
	})
}

ExitView.prototype.update = function() {
	if (this.exitMonitor.isOpen)
		this.row.addClass("open")
	else
		this.row.removeClass("open")
	if (this.exitMonitor.isActivated)
		this.row.addClass("active")
	else
		this.row.removeClass("active")


}