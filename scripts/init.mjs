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
		const input = event.target;
		const module = game.modules.get(input.name);

		// No relationships, No reason to check
		if (!module.relationships ?? false) return false;

		// Get All packages, Merging Modules, System and World
		const allPackages = Array.from(game.modules).concat([game.system, game.world]);

		// Get All Required Packages
		const getValidRelationship = (relationship, isOptional) => (relationship.reduce((filtered, requirement) => {
			// If required Module is already enabled or checked, then exclude
			const isEnabled = (requirementID) => {
				return input.form.querySelector(`.package input[type="checkbox"][name="${requirementID}"]`).checked;
			}

			// Exclude Systems
			if ((requirement?.type ?? '').toLowerCase() == 'system') return filtered.concat([]);

			// If Required Module is not installed
			if (!game.modules.get(requirement.id) ?? false) {
				if (!isOptional) ui.notifications.error(game.i18n.format("MODMANAGE.DepNotInstalled", {missing: requirement.id}));
				return filtered.concat([]);
			}

			// If Enabling 
			if (input.checked && isEnabled(requirement.id)) return filtered.concat([]);

			// If Disabling
			if (!input.checked) {
				let requirements = (allPackages.reduce((relationships, aRequirement) => {
					// Check if Module is Enabled
					if ((aRequirement?.type ?? '').toLowerCase() == 'module' && !isEnabled(aRequirement?.id)) return relationships.concat([]);
					
					return relationships.concat((Array.from(aRequirement?.relationships?.requires ?? []).concat(
						Array.from(aRequirement?.relationships?.optional ?? (Array.from(aRequirement?.relationships?.flags?.optional ?? [])))
					)).filter(relationship => {
						return requirement.id == relationship.id && isEnabled(relationship.id);
					}) ?? []);
				}, []))

				if ((requirements.length ?? 0) > 0) return filtered.concat([]);
			}

			// Check if Requirement is already in same state as input
			if (isEnabled(requirement.id) == input.checked) return filtered.concat([]);

			// Check if Requirement is Locked
			//if (!input.checked && (MODULE.setting('lockedModules').hasOwnProperty(requirement.id) ?? false)) return filtered.concat([]);

			MODULE.log(input.checked, !(MODULE.setting('lockedModules').hasOwnProperty(requirement.id) ?? false))
			return filtered.concat([foundry.utils.mergeObject(requirement, {
				title: game.modules.get(requirement?.id)?.title ?? '',
				isChecked: () => {
					if (input.checked) return true;
					return !(MODULE.setting('lockedModules').hasOwnProperty(requirement.id) ?? false)
				},
				isDisabled: () => {
					if (MODULE.setting('disableLockedModules') && (MODULE.setting('lockedModules').hasOwnProperty(requirement.id) ?? false)) return true;
					return false;
				}
			}, { inplace: false })]);
		}, []));

		const requires = getValidRelationship(Array.from(module?.relationships?.requires ?? []), false);
		const optionals = getValidRelationship(Array.from(module?.relationships?.optional ?? (Array.from(module?.relationships?.flags?.optional ?? []))), true);

		// If Dependencies is Empty
		if (!(requires?.length ?? 0) && !(optionals?.length ?? 0)) return false;

		// Add Required Module Details to Requires;
		const content = await renderTemplate(`/modules/${MODULE.ID}/templates/dependencies.hbs`, {
			id: MODULE.ID,
			moduleTitle: module.title,
			enabling: input.checked,
			numberOfDependencies: (requires?.length ?? 0) + (optionals?.length ?? 0),
			showRequires: (requires?.length ?? 0) > 0,
			showOptional: (optionals?.length ?? 0) > 0,
			requires, optionals
		});

		return Dialog[MODULE.setting('dependencyDialogType')]({
			title: game.i18n.localize("MODMANAGE.Dependencies"),
			content: content,
			render: (elem) => {
				MODULE.log('render', elem);
			},
			[`${MODULE.setting('dependencyDialogType') == 'prompt' ? 'callback' : 'yes'}`]: (elem) => {
				MODULE.log('callback', elem);
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
	
	// Enable MM+ Locked Settings if FCS is inactive
	if (!(game.modules.get('force-client-settings')?.active ?? false)) {
		Hooks.on('renderApplication', MMP.renderApplication);
		Hooks.on('closeSettingsConfig', MMP.closeSettingsConfig);
	}
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// FOUNDRY HOOKS -> MODULE FUNCTIONS
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.on('renderModuleManagement', MMP.renderModuleManagement);
Hooks.on('renderSettingsConfig', MMP.renderSettingsConfig);

Handlebars.registerHelper("incIndex", function(value, options) {
    return parseInt(value) + 1;
});
