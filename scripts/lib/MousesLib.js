if (!Object.prototype.hasOwnProperty('extend')) {
	Object.defineProperty(Object.prototype, 'extend',{
		value: function() {    
			// Variables
			var extended = {};
			var deep = false;
			var i = 0;

			// Check if a deep merge
			if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
				deep = arguments[0];
				i++;
			}
		
			// Merge the object into the extended object
			var merge = function (obj) {
				for (var prop in obj) {
					if (obj.hasOwnProperty(prop)) {
						// If property is an object, merge properties
						if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
							extended[prop] = Object.extend(extended[prop], obj[prop]);
						} else {
							extended[prop] = obj[prop];
						}
					}
				}
			};
		
			// Loop through each object and conduct a merge
			for (; i < arguments.length; i++) {
				merge(arguments[i]);
			}
		
			return extended;
		},
		writable: true,
		configurable: true,
		enumerable: false
	});
}

class MousesLib {
	constructor(module) {
		let defaults = {
			primaryColor: '#673ab7;',
			secondaryColor: '#8AB73A',
			successColor: '#00B74A',
			dangerColor: '#F93154',
			warningColor: '#FFA900',
			infoColor: '#39C0ED'
		}

		this.MODULE = {...defaults, ...module};

		Handlebars.registerHelper('markdown', (stringId, options) => {
			return DOMPurify.sanitize(marked(game.i18n.localize(`${this.MODULE.name}.${stringId}`)), {USE_PROFILES: {html: true}});
		});
	}

	logger(type) {
		let color = this.MODULE.primaryColor;
		switch (type.toLowerCase()) {
			case 'warn':	color = this.MODULE.warningColor;	break;
			case 'info':	color = this.MODULE.infoColor;		break;
			case 'error':	color = this.MODULE.dangerColor;	break;
		}
		console.log.apply(console, [`%c${this.MODULE.title}`, `background-color: ${color}; color: rgb(255 255 255);font-weight: 700;padding: 3px 5px;`, ...arguments[1]]);
	}

	LOG() { this.logger('log', arguments); }
	WARN() { this.logger('warn', arguments); }
	INFO() { this.logger('info', arguments); }
	ERROR() { this.logger('error', arguments); }

	localize() {
		return game.i18n.localize(`${this.MODULE.name}.${arguments[0]}`);
	}

	setting() {
		let args = arguments;

		// Are we registering a new setting
		if (args[0].toLowerCase() == 'register') {
			// Register New Setting
			let setting = args[1]; // This is the name of the setting
			let value = args[2]; // This is the settings of the setting
			let settingDefaults = {
				name: this.localize(`settings.${setting}.name`),
				hint: this.localize(`settings.${setting}.hint`),
				scope: 'client',
				config: true
			}
			let newSetting = Object.extend(true, settingDefaults, value)
			game.settings.register(this.MODULE.name, setting, newSetting);
			return newSetting;
		}else{
			let setting = args[0];
			// If only one value is passed in, get setting
			if (typeof args[1] == 'undefined') {
				return game.settings.get(this.MODULE.name, setting);
			}else{
				return game.settings.set(this.MODULE.name, setting, args[1]);
			}
		}
	}
}