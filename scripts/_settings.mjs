// GET MODULE CORE
import { MODULE } from './_module.mjs';

// FOUNDRY HOOKS -> SETUP
Hooks.once('setup', () => {
	// SET MODULE SETTINGS
	// SET MODULE SETTINGS
	MODULE.setting('register', 'trackedChangelogs', {
		type: Object,
		default: {},
		scope: 'world',
		config: false
	});
	
	MODULE.setting('register', 'showNewChangelogsOnLoad', {
		type: Boolean,
		default: true,
		scope: 'world',
	});
});

