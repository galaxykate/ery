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
		pointer.entity.set(path, value)
	},

	parseInt: function(amt) {
		if (amt.equalsIgnoreCase("one"))
			return 1;
			if (amt.equalsIgnoreCase("one"))
			return 1;
			if (amt.equalsIgnoreCase("one"))
			return 1;
	}

}