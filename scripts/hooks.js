Hooks.once('module-creditsInit', async () => {
	// SET MODULE SETTINGS
	moduleCredits.setting('register', 'trackedChangelogs', {
		type: Object,
		default: {},
		scope: 'world',
		config: false
	});
	moduleCredits.setting('register', 'showNewChangelogsOnLoad', {
		type: Boolean,
		default: true,
		scope: 'world',
	});
	moduleCredits.setting('register', 'defaultIcons', {
		type: Boolean,
		default: true
	});
	moduleCredits.setting('register', 'condenseDefaultTags', {
		type: Boolean,
		default: true
	});
	moduleCredits.setting('register', 'condenseTags', {
		type: Boolean,
		default: true
	});
	moduleCredits.setting('register', 'condenseCompatibilityRisk', {
		type: Boolean,
		default: true
	});
	moduleCredits.setting('register', 'condenseVersion', {
		type: Boolean,
		default: true
	});
	moduleCredits.setting('register', 'showReadme', {
		type: Boolean,
		default: true
	});
	moduleCredits.setting('register', 'fetchLocalReadme', {
		type: Boolean,
		default: true
	});
	moduleCredits.setting('register', 'showIssues', {
		type: Boolean,
		default: true
	});
	moduleCredits.setting('register', 'showChangelog', {
		type: Boolean,
		default: true,
	});
	moduleCredits.setting('register', 'fetchLocalChangelogs', {
		type: Boolean,
		default: true
	});

	moduleCredits.setting('register', 'allowHTMLforAllSettings', {
		type: Boolean,
		default: false
	});

	// HOOK INTO FOUNDRY
	Hooks.once('ready', async () => {
		moduleCredits.init();
	});
	
	Hooks.on("renderSettingsConfig", (app, html) => {
		moduleCredits.renderSettingsConfig(app, html);
	});
	
	Hooks.on("renderModuleManagement", (app, html) => {
		moduleCredits.renderModuleManagement(app, html);
	});
});