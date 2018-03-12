function createContainer(holder, id, classes) {
	let div = $("<div/>", {
		class: classes
	}).appendTo(holder)

	let header = $("<div/>", {
		class: "header",
		html: id
	}).appendTo(div)

	let content = $("<div/>", {
		class: "content"
	}).appendTo(div)

	div.header = header;
	div.content = content;
	return div;
}

function createParameterRow(holder, id, classes) {
	let div = $("<div/>", {
		class: classes + " parameterRow"
	}).appendTo(holder)

	let label = $("<div/>", {
		class: "label",
		html: id
	}).appendTo(div)

	let content = $("<div/>", {
		class: "content"
	}).appendTo(div)

	div.label = label;
	div.content = content;
	return div;
}



function itemToDiv(item, holder) {
	if (typeof item === "object") {

		if (Array.isArray(item)) {

			let arrayHolder = $("<div>", {
				class: "array",
			}).appendTo(holder)

			$.each(item, (index, subItem) => {
				let arrayItem = $("<div>", {
					class: "array-item",
				}).appendTo(arrayHolder)
				itemToDiv(subItem, arrayItem)
			})

		} else {
			objectToDiv(item, holder)
		}
	} else {

		if (typeof item === "string")
			holder.addClass("string-item")
		holder.html(item)
	}
}

function objectToDiv(obj, holder) {
	let objHolder = $("<div/>", {}).appendTo(holder)
	

	if (obj.type)
		objHolder.addClass("item-" + obj.type)

	if (obj.type === "plaintext") {
		objHolder.html(obj.raw);
		objHolder.addClass("string-item")
	} else {

		$.each(obj, (key, item) => {
			let itemHolder = $("<div>", {
				class: "line",
			}).appendTo(objHolder)


			let label = $("<label>", {
				class: "label",
				html: key
			}).appendTo(itemHolder)

			let content = $("<div>", {
				class: "content",
			}).appendTo(itemHolder);

			itemToDiv(item, content)
		})
	}
}


function showSchema(holder, language) {
	let schemaHolder = $("<div/>", {

	}).appendTo(holder);


	createSection("types", language.types)
	createSection("context map", language.contextMap)

	function createSection(title, items) {
		let section = $("<div/>", {
			class: "section"
		}).appendTo(schemaHolder);

		let sectionHeader = $("<div/>", {
			class: "header",
			html: title,
		}).appendTo(section);

		let sectionContent = $("<div/>", {
			class: "content"
		}).appendTo(section);
		objectToDiv(items, sectionContent);
	}
}