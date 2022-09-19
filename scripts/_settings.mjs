// GET MODULE CORE
import { MODULE } from './_module.mjs';

// FOUNDRY HOOKS -> SETUP
Hooks.once('setup', () => {
	// SET MODULE MIGRATE SETTINGS
	MODULE.setting('register', 'enableGlobalConflicts', {
		type: Boolean,
		default: true,
		config: false,
		scope: 'world',
	});
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
	MODULE.setting('register', 'lockedSettings', {
		type: Object,
		default: {},
		scope: 'world',
		config: false
	});
	MODULE.setting('register', 'renamedModules', {
		type: Object,
		default: {},
		scope: 'world',
		config: false
	});

	// SET MODULE SETTINGS
	const trackedChangelogs =  {
		type: Object,
		default: {},
		config: false,
	}
	if (game.modules.get('lib-server-setting')?.active ?? false) {
		Hooks.once('lib-server-setting.Setup', async (SETTING) => {
			SETTING(MODULE.ID, 'trackedChangelogs', trackedChangelogs);
		});
	}else{
		MODULE.setting('register', 'trackedChangelogs', trackedChangelogs);
	}

	MODULE.setting('register', 'presets', {
		type: Object,
		default: {},
		config: false
	});
	MODULE.setting('register', 'disableSyncPrompt', {
		type: Boolean,
		default: true,
		config: true,
		scope: 'world'
	});
	MODULE.setting('register', 'showNewChangelogsOnLoad', {
		type: Boolean,
		default: true,
		scope: 'world',
	});
	MODULE.setting('register', 'bigPictureMode', {
		type: Boolean,
		default: true,
		config: true,
	});
});

