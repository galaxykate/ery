let botteryFxns = {
	inList: function(query, list) {
		let count = 0;
		$.each(list, (index, val) => {

			if (val === query) {
				count++;
			}
		})
		return count > 0;
	},

	set: function(path, value) {
		console.log(path, value)
		this.entity.set(path, value)

	},

	parseInt: function(amt) {
		if (!isNaN(amt))
			return Math.floor(amt)

		amt = amt.toLowerCase()
		if (amt === "none" ||
			amt === "zero")
			return 0;
		if (amt === "one")
			return 1;
		if (amt === "two")
			return 2;
		if (amt === "three")
			return 3;
		if (amt === "four")
			return 4;

	}

}