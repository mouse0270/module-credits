// GET MODULE CORE
import { MODULE } from './_module.mjs';

// IMPORT SETTINGS -> Settings Register on Hooks.Setup
import './_settings.mjs';

// IMPORT MODULE FUNCTIONALITY
import { ModuleCredits } from './module.mjs';
import { ModuleCreditsDialog } from './moduleCreditsDialog.mjs';

Hooks.once('setup', async function() { 
	ModuleCredits.api();
});

// FOUNDRY HOOKS -> INIT
Hooks.once('init', async function() { 
	Handlebars.registerHelper('markdown', (stringId, options) => {
		return MODULE.markup(game.i18n.localize(`${stringId}`));
	});
});

// FOUNDRY HOOKS -> READY
Hooks.once('ready', async () => {
	ModuleCredits.init();
	
    Hooks.callAll('moduleCreditsReady');
});

Hooks.once('libChangelogsReady', async () => {
	console.log('registerConflict');
	libChangelogs.registerConflict(
		'module-credits',
		'lib-changelogs',
		'Provides similar functionality.',
		'minor'
	)
});
	
// FOUNDRY HOOKS -> REDNER SETTINGS CONFIG
Hooks.on("renderSettingsConfig", (app, html) => {
	ModuleCredits.renderSettingsConfig(app, html);
});

// FOUNDRY HOOKS -> RENDER MODULE MANAGEMENT
Hooks.on("renderModuleManagement", (app, html) => {
	ModuleCredits.renderModuleManagement(app, html);

	ModuleCredits.conflicts.forEach((conflict, index) => {
		console.log(conflict, `#module-management #module-list .package[data-module-name="${conflict.moduleID}"]`)
		$(`#module-management #module-list .package[data-module-name="${conflict.moduleID}"]`).addClass(`module-credits-conflict-${conflict.status}`);
		$(`#module-management #module-list .package[data-module-name="${conflict.conflictingModuleID}"]`).addClass(`module-credits-conflict-${conflict.status}`);
	})
});