// GET MODULE CORE
import { MODULE } from './_module.mjs';

// IMPORT SETTINGS -> Settings Register on Hooks.Setup
import './_settings.mjs';

// IMPORT MODULE FUNCTIONALITY
import { ModuleCredits } from './module.mjs';
import { ModuleCreditsDialog } from './moduleCreditsDialog.mjs';

// FOUNDRY HOOKS -> INIT
Hooks.once('init', async function() { 
	Handlebars.registerHelper('markdown', (stringId, options) => {
		return MODULE.markup(game.i18n.localize(`${stringId}`));
	});
});

// FOUNDRY HOOKS -> READY
Hooks.once('ready', async () => {
	ModuleCredits.init();
});
	
// FOUNDRY HOOKS -> REDNER SETTINGS CONFIG
Hooks.on("renderSettingsConfig", (app, html) => {
	ModuleCredits.renderSettingsConfig(app, html);
});

// FOUNDRY HOOKS -> RENDER MODULE MANAGEMENT
Hooks.on("renderModuleManagement", (app, html) => {
	ModuleCredits.renderModuleManagement(app, html);
});