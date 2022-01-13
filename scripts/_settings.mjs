// GET MODULE CORE
import { MODULE } from './_module.mjs';

// FOUNDRY HOOKS -> SETUP
Hooks.once('setup', () => {
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
	MODULE.setting('register', 'useSourceInsteadofSchema', {
		type: Boolean,
		default: true
	});
	MODULE.setting('register', 'defaultIcons', {
		type: Boolean,
		default: true
	});
	MODULE.setting('register', 'condenseDefaultTags', {
		type: Boolean,
		default: true
	});
	MODULE.setting('register', 'condenseTags', {
		type: Boolean,
		default: true
	});
	MODULE.setting('register', 'condenseCompatibilityRisk', {
		type: Boolean,
		default: true
	});
	MODULE.setting('register', 'condenseVersion', {
		type: Boolean,
		default: true
	});
	MODULE.setting('register', 'condenseAuthors', {
		type: Boolean,
		default: false
	});
	MODULE.setting('register', 'showReadme', {
		type: Boolean,
		default: true
	});
	MODULE.setting('register', 'fetchLocalReadme', {
		type: Boolean,
		default: true
	});
	MODULE.setting('register', 'showIssues', {
		type: Boolean,
		default: true
	});
	MODULE.setting('register', 'showChangelog', {
		type: Boolean,
		default: true,
	});
	MODULE.setting('register', 'fetchLocalChangelogs', {
		type: Boolean,
		default: true
	});
});