class MousesLib {
	constructor(module) {
		let defaults = {
			primaryColor: '#673ab7;'
		}

		this.MODULE = {...defaults, ...module};
	}

	LOG() {
		let self = this;
		if (typeof this.MODULE == "undefined") self = this.lib;
		console.log.apply(console, [`%c${self.MODULE.title}`, `background-color: ${self.MODULE.primaryColor}; color: rgb(255 255 255);font-weight: 700;padding: 3px 5px;`, ...arguments]);
	}
}