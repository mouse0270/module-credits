// GET MODULE CORE
import { MODULE } from './_module.mjs';

// FOUNDRY HOOKS -> SETUP
Hooks.once('setup', () => {
	// SET MODULE MIGRATE SETTINGS
	MODULE.setting('register', 'clientMigratedVersion', {
		type: String,
		default: "0.0.0",
		scope: 'world',
		config: false
	});
	MODULE.setting('register', 'worldMigratedVersion', {
		type: String,
		default: "0.0.0",
		scope: 'world',
		config: false
	});

	// SET MODULE SETTINGS
	MODULE.setting('register', 'showNewChangelogsOnLoad', {
		type: Boolean,
		default: true,
		scope: 'world',
	});
	MODULE.setting('register', 'trackedChangelogs', {
		type: Object,
		default: {},
		config: false
	});
	MODULE.setting('register', 'presets', {
		type: Object,
		default: {},
		config: false
	});
	MODULE.setting('register', 'enableGlobalConflicts', {
		type: Boolean,
		default: true,
		config: true,
		scope: 'world',
	});
	MODULE.setting('register', 'bigPictureMode', {
		type: Boolean,
		default: true,
		config: true
	});
});

