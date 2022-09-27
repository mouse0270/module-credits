// GET MODULE FUNCTIONS
import { MODULE } from './_module.mjs';

// GET SETTINGS 
import './_settings.mjs';

// GET CORE MODULE
import { MMP } from './module.mjs';

// GET MIGRATION
import './_migration.mjs';

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// 🧙 DEVELOPER MODE HOOKS -> devModeReady
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MODULE.ID, 'level', {
		choiceLabelOverrides: {
			0: 'NONE',
			1: 'ERROR',
			2: 'WARN',
			3: 'DEBUG',
			4: 'INFO',
			5: 'ALL'
		}
	});
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// socketlib HOOKS -> socketlib.ready
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('socketlib.ready', () => {
	MODULE.debug('SOCKETLIB Ready - SOCKET'); // WONT REGISTER CAUSE CALL HAPPENS WAY TO EARLY
	MMP.registerSocketLib();
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// libWrapper HOOKS -> ready
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('ready', async () => {
	async function expandedModuleDependencies(event) {
		MODULE.log('OVERRIDE DEPENDENCIES CHECK');
		const input = event.target;
		const module = game.modules.get(input.name);

		// No relationships, No reason to check
		if (!module.relationships ?? false) return false;

		// Get All packages, Merging Modules, System and World
		const allPackages = Array.from(game.modules).concat([game.system, game.world]);

		// Get All Required Packages
		const getValidRelationship = (relationship, type = 'requires') => (relationship).filter(requirement => {
			// Exclude Systems
			if ((requirement?.type ?? '').toLowerCase() == 'system') return false;

			// Get Requirement Details
			const requiredModule = game.modules.get(requirement.id);

			// If Required Module is not installed
			if (!requiredModule ?? false) {
				ui.notifications.error(game.i18n.format("MODMANAGE.DepNotInstalled", {missing: requirement.id}));
				return false;
			}

			// If required Module is already enabled or checked, then exclude
			const checkIfEnabled = (requirement) => {
				return input.form.querySelector(`#module-list .package[data-module-id="${requirement?.id}"] input[type="checkbox"]`).checked;
			}
			
			if (input.checked && checkIfEnabled(requiredModule)) return false
			if (!input.checked) {
				// Check if other modules depend on this dependency, and if so, remove it from the to-disable list.
				return !(allPackages.filter(aRequiredModule => {
					if (aRequiredModule.id == input.name) return false;
					if ((aRequiredModule?.type ?? '').toLowerCase() == "module" && !checkIfEnabled(aRequiredModule)) return false;

					let requiredModules = (Array.from(aRequiredModule.relationships?.requires).concat(
						(Array.from(aRequiredModule.relationships?.optional ?? []) ?? []).concat(
							(aRequiredModule.relationships?.flags?.optional ?? [])
						)
					));

					if (requiredModules.length == 0) return false;

					return requiredModules.filter(bRequiredModule => {
						return requirement.id == bRequiredModule.id && checkIfEnabled(bRequiredModule);
					}).length > 0;
				}).length > 0);
			}

			// Dependency Required and not Active
			return true;
		}).map(requirement => {
			return foundry.utils.mergeObject(requirement, {
				title: game.modules.get(requirement?.id)?.title ?? ''
			}, {inplace: false});
		});

		const requires = getValidRelationship(module?.relationships?.requires ?? []);
		const optionals = getValidRelationship(Array.from(module?.relationships?.optional ?? []).concat(Array.from(module?.relationships?.flags?.optional ?? [])), 'optional');

		// If Dependencies is Empty
		if (!requires.size && !(optionals.size ?? (optionals?.length ?? 0))) return false;

		// Add Required Module Details to Requires;
		const content = await renderTemplate(`/modules/${MODULE.ID}/templates/dependencies.hbs`, {
			id: MODULE.ID,
			enabling: input.checked,
			numberOfDependencies: (requires?.size ?? 0) + (optionals.size ?? (optionals?.length ?? 0)),
			showRequires: (requires?.size ?? 0) > 0,
			showOptional: (optionals.size ?? (optionals?.length ?? 0)) > 0,
			requires, optionals
		});

		return Dialog.prompt({
			title: game.i18n.localize("MODMANAGE.Dependencies"),
			content: content,
			callback: (elem) => {
				elem[0].querySelectorAll('input[type="checkbox"]').forEach(requirementInput => {
					if (requirementInput.checked) {
						input.form.querySelector(`#module-list .package[data-module-id="${requirementInput?.name}"] input[type="checkbox"]`).checked = input.checked;
						
						// HANDLE FOR MM+ SPECIFIC FUNCTIONALITY
						input.form.querySelector(`#module-list .package[data-module-id="${requirementInput?.name}"]`).classList.toggle('active', input.checked);
						input.form.querySelector(`#module-list .package[data-module-id="${requirementInput?.name}"]`).classList.toggle('checked', input.checked);
					}
				})
			}
		});
	}

	if (game.modules.get('lib-wrapper')?.active ?? false) {
		libWrapper.register(MODULE.ID, "ModuleManagement.prototype._onChangeCheckbox", expandedModuleDependencies, "OVERRIDE");
	}else{
		ModuleManagement.prototype._onChangeCheckbox = expandedModuleDependencies;
	}
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// libThemer HOOKS -> lib-themer.Ready
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('lib-themer.Ready', (API) => {
	API.register(`/modules/${MODULE.ID}/styles/TidyMMW.theme`);
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// FOUNDRY HOOKS -> READY
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('init', () => {
	Hooks.on("renderSidebarTab", MMP.renderSidebarTab);
});
Hooks.once('ready', async () => {
	//await MIGRATE.init();
	
	MMP.init();
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// FOUNDRY HOOKS -> MODULE FUNCTIONS
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.on('renderModuleManagement', MMP.renderModuleManagement);
Hooks.on('renderSettingsConfig', MMP.renderSettingsConfig);
Hooks.on('renderApplication', MMP.renderApplication);
Hooks.on('closeSettingsConfig', MMP.closeSettingsConfig);

Handlebars.registerHelper("incIndex", function(value, options) {
    return parseInt(value) + 1;
});
