// GET REQUIRED LIBRARIES
import './libraries/marked.min.js';
import './libraries/purify.min.js';

let _STORE = {};
export class MODULE {
	static ID = 'module-credits';
	static OPTIONS = {
		background: '#7030A0',
		color: '#fff',
		LOG_LEVEL: [
			{ title: 'OFF', background: '#000', color: '#fff' },
			{ title: "ERROR", background: '#F93154', color: '#fff' },
			{ title: "WARN", background: '#FFA900', color: '#fff' },
			{ title: "DEBUG", background: '#B23CFD', color: '#fff' },
			{ title: "INFO", background: '#39C0ED', color: '#fff' },
			{ title: "LOG", background: '#39C0ED', color: '#fff' }
		]
	}

	static get TITLE() {
		return this.localize('title');
	}

	static get api() {
		return game.modules?.get(this.ID)?.api;
	}

	static get store() {
		return _STORE;
	}
	static set store(data) {
		_STORE = foundry.utils.mergeObject(_STORE, data, { inplace: false });
	}

	static localize(stringId, data = {}) {
		return isObjectEmpty(data.hash ?? {}) ? game.i18n.localize(`${this.ID}.${stringId}`) : game.i18n.format(`${this.ID}.${stringId}`, data);
	}

	static CONSOLE = (LOG_LEVEL, ...args) => {
		try {
			if (game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID, 'level') >= LOG_LEVEL) {
				console.log(
					`%c${this.TITLE}%c${this.OPTIONS.LOG_LEVEL[LOG_LEVEL].title}`
					, `background-color: ${this.OPTIONS.background}; border-radius: 2px; color: ${this.OPTIONS.color}; padding: 0.15rem 0.25rem;`
					, `background-color: ${this.OPTIONS.LOG_LEVEL[LOG_LEVEL].background}; border-radius: 2px; color: ${this.OPTIONS.LOG_LEVEL[LOG_LEVEL].color}; padding: 0.15rem 0.25rem; margin-left: 0.25rem;${LOG_LEVEL >= 4 ? 'display:none' : ''}`
					, ...args
				);
			}
		}catch (event) {
			console.warn(`${this.TITLE} debug logging failed`, event);
		}
	}

	static log = (...args) => { this.CONSOLE(5, ...args); }
	static info = (...args) => { this.CONSOLE(4, ...args); }
	static debug = (...args) => { this.CONSOLE(3, ...args); }
	static warn = (...args) => { this.CONSOLE(2, ...args); }
	static error = (...args) => { this.CONSOLE(1, ...args); }

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
			game.settings.register(this.ID, setting, newSetting);

			return newSetting;
		} else {
			let setting = args[0];
			// If only one value is passed in, get setting
			if (typeof args[1] == 'undefined') {
				return game.settings.get(this.ID, setting);
			} else { 
				// If two values are passed in, then set setting
				return game.settings.set(this.ID, setting, args[1]);
			}
		}
	}

	// CUSTOM MODULE FUNCTIONS
	static markup = (content, markedOptions = {}, DOMPurifyOptions = {}) => {
		return DOMPurify.sanitize(marked.parse(content, markedOptions), mergeObject({USE_PROFILES: {html: true}}, DOMPurifyOptions, { inplace: false }));
	}
}