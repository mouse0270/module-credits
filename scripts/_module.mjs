// GET REQUIRED LIBRARIES
import './lib/marked.min.js';
import './lib/purify.min.js';

let _STORE = {};
export class MODULE {
	static name = 'module-credits';

	static get title() {
		return `${this.name}.title`;
	}

	static get api() {
		return game.modules?.get(this.name)?.api;
	}

	static get store() {
		return _STORE;
	}
	static set store(data) {
		_STORE = foundry.utils.mergeObject(_STORE, data, { inplace: false });
	}

	static localize() {
		return game.i18n.localize(`${this.name}.${arguments[0]}`);
	}

	static markup = (content) => {
		return DOMPurify.sanitize(marked.parse(content), {USE_PROFILES: {html: true}});
	}

	static setting = (...args) => {		
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
			let newSetting = foundry.utils.mergeObject(settingDefaults, value, { inplace: false });
			game.settings.register(this.name, setting, newSetting);

			return newSetting;
		} else {
			let setting = args[0];
			// If only one value is passed in, get setting
			if (typeof args[1] == 'undefined') {
				return game.settings.get(this.name, setting);
			} else { 
				// If two values are passed in, then set setting
				return game.settings.set(this.name, setting, args[1]);
			}
		}
	}
}