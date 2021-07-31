let moduleCredits = null;

Hooks.once('init', async () => {
	moduleCredits = new ModuleCredits({
			name: 'module-credits',
			title: 'Module Credits'
		});

	moduleCredits.setting('register', 'allowHTMLforAllSettings', {
		type: Boolean,
		default: false
	});
	moduleCredits.setting('register', 'showWiki', {
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

	window.moduleCredits = moduleCredits || {};
});

Hooks.once('ready', async () => {

});

Hooks.on("renderSettingsConfig", (app, html) => {
	moduleCredits.renderSettingsConfig(app, html);
});

Hooks.on("renderModuleManagement", (app, html) => {
	moduleCredits.renderModuleManagement(app, html);
});