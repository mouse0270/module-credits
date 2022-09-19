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

	// SET MODULE SETTINGS
	const trackedChangelogs =  {
		type: Object,
		default: {},
		config: false,
	}
	const presets = {
		type: Object,
		default: {},
		config: false,
		scope: 'world',
	}
	const showNewChangelogsOnLoad = {
		type: Boolean,
		default: true,
		scope: 'world',
	}
	const renamedModules = {
		type: Object,
		default: {},
		config: false
	}
	if (game.modules.get('lib-server-setting')?.active ?? false) {
		Hooks.once('lib-server-setting.Setup', async (SETTING) => {
			SETTING(MODULE.ID, 'trackedChangelogs', trackedChangelogs);
			SETTING(MODULE.ID, 'showNewChangelogsOnLoad', showNewChangelogsOnLoad);
			SETTING(MODULE.ID, 'renamedModules', renamedModules);
			SETTING(MODULE.ID, 'presets', presets);
		});
	}else{
		MODULE.setting('register', 'trackedChangelogs', trackedChangelogs);
		MODULE.setting('register', 'showNewChangelogsOnLoad', showNewChangelogsOnLoad);
		MODULE.setting('register', 'renamedModules', renamedModules);
		MODULE.setting('register', 'presets', presets);
	}

	MODULE.setting('register', 'disableSyncPrompt', {
		type: Boolean,
		default: true,
		config: true,
		scope: 'world'
	});
	MODULE.setting('register', 'bigPictureMode', {
		type: Boolean,
		default: true,
		config: true,
	});
});

