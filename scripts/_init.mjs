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
	
// FOUNDRY HOOKS -> REDNER SETTINGS CONFIG
Hooks.on("renderSettingsConfig", (app, html) => {
	ModuleCredits.renderSettingsConfig(app, html);
});

// FOUNDRY HOOKS -> RENDER MODULE MANAGEMENT
Hooks.on("renderModuleManagement", (app, html) => {
	ModuleCredits.renderModuleManagement(app, html);

	ModuleCredits.conflicts.forEach((conflict, index) => {
		let $package = $(`#module-management #module-list .package[data-module-name="${conflict.moduleID}"]`);
		$package.find('.package-title input').after('<i class="module-credits-conflict fas fa-exclamation-triangle"></i>');

		let tooltip = `## Conflicts with ${game.modules.get(conflict.conflictingModuleID).data.title}
${conflict.content}`;
		$package.find('.module-credits-conflict').data('conflict', tooltip);

		$package = $(`#module-management #module-list .package[data-module-name="${conflict.conflictingModuleID}"]`);
		$package.find('.package-title input').after('<i class="module-credits-conflict fas fa-exclamation-triangle"></i>');

		tooltip = `## Conflicts with ${game.modules.get(conflict.moduleID).data.title}
${conflict.content}`;
		$package.find('.module-credits-conflict').data('conflict', tooltip);
	});

	let popperInstance = null;
	$('.module-credits-conflict').on('mouseenter focus', (event) => {
		let $self = $(event.target);
		let $tooltip = $(`<div id="${MODULE.name}-tooltip" role="tooltip">
				<div id="${MODULE.name}-arrow" data-popper-arrow></div>
			</div>`);
		$tooltip.prepend(MODULE.markup($self.data('conflict')));
		$self.before($tooltip);

		popperInstance = Popper.createPopper($self[0], $tooltip[0], {
			modifiers: [{
				name: 'offset',
				options: {
					offset: [0, 8],
				}
			}]
		});

		popperInstance.update();
	})


	$('.module-credits-conflict').on('mouseleave blur', (event) => {
		popperInstance.destroy();
		$(`#${MODULE.name}-tooltip`).remove();
	});
});