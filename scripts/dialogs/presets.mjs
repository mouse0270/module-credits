// GET MODULE CORE
import { MODULE } from '../_module.mjs';

export class PresetDialog extends FormApplication {
	constructor(packages) {
		super();
	}

	static get defaultOptions() {
		return {
			...super.defaultOptions,
			title: `${MODULE.TITLE} - ${MODULE.localize('dialog.titles.presets')}`,
			id: `${MODULE.ID}-preset-dialog`,
			classes: ['dialog'],
			template: `./modules/${MODULE.ID}/templates/presets.hbs`,
			resizable: false,
			width: $(window).width() > 400 ? 400 : $(window).width() - 100,
			height: $(window).height() > 275 ? 275 : $(window).height() - 100
		}
	}

	getData() {
		return {
			DIALOG: {
				ID: MODULE.ID,
				TITLE: MODULE.TITLE
			},
			presets: MODULE.setting('presets')
		}
	}
	
	activateListeners(html) {
		super.activateListeners(html);

		const presetInfo = (event) => {
			const presetKey = event.target.closest('li').dataset.preset;
			let preset = MODULE.setting('presets')[presetKey];
			let uninstalledModules = preset.modules.filter((module) => {
				return (game.modules.get(module.id) ?? false) == false;
			});
			let installedModules = preset.modules.filter((module) => {
				return (game.modules.get(module.id) ?? false) != false;
			});
			let output = [];
			if (uninstalledModules.length > 0) {
				output.push(`### ${MODULE.localize('dialog.presets.info.uninstalledModules')}`);
				uninstalledModules.forEach(module => {
					output.push(module.title);
				})
			}
			if (installedModules.length > 0) {
				if (uninstalledModules.length > 0) output.push('');
				output.push(`### ${MODULE.localize('dialog.presets.info.installedModules')}`);
				installedModules.forEach(module => {
					output.push(module.title);
				})
			}
			Dialog.prompt({
				id: `${MODULE.ID}-create-preset`,
				title: MODULE.TITLE,
				content: `<p style="margin-top: 0px;">${MODULE.localize('dialog.presets.info.description', {name: preset.name})}</p>
					<textarea readonly rows="15" style="margin-bottom: 0.5rem;">${output.join('\n')}</textarea>`
			});
		}

		const updatePreset = (event) => {
			const presetKey = event.target.closest('li').dataset.preset;
			let presets = MODULE.setting('presets');

			// Get Active Modules
			const packages = document.querySelectorAll('#module-management #module-list li.package');
			let presetPackages = [];
			packages.forEach(elemPackage => {
				if (elemPackage.querySelector('input[type="checkbox"]:checked') ?? false) {
					presetPackages.push({
						id: game.modules.get(elemPackage.dataset.moduleId).id,
						title: game.modules.get(elemPackage.dataset.moduleId).title
					})
				}
			});

			Dialog.confirm({
				id: `${MODULE.ID}-update-preset`,
				title: MODULE.TITLE,
				content: `<p style="margin-top: 0px;">${MODULE.localize('dialog.presets.update.description')}</p>
					<textarea readonly rows="${presetPackages.length <= 15 ? presetPackages.length + 2 : 15}" style="margin-bottom: 0.5rem;">### ${MODULE.localize('dialog.generic.activeModules')}\n${presetPackages.map(module => {
						return module.title;
					}).join('\n')}</textarea>`,
				yes: (elemDialog) => {
					presets[presetKey].modules = presetPackages;
					MODULE.setting('presets', presets).then(response => {
						MODULE.log('UPDATE', response);
					});
				},
				no: (elemDialog) => {
					return false;
				}
			});

		}
		const deletePreset = (event) => {
			const presetKey = event.target.closest('li').dataset.preset;
			let presets = MODULE.setting('presets');

			Dialog.confirm({
				id: `${MODULE.ID}-delete-preset`,
				title: MODULE.TITLE,
				content: `<p style="margin-top: 0px;">${MODULE.localize('dialog.presets.delete.description', {name: presets[presetKey].name})}</p>
					<div class="notification warning">${MODULE.localize('dialog.presets.delete.warning')}</div>`,
				yes: (elemDialog) => {
					delete presets[presetKey];
					MODULE.setting('presets', presets).then(response => {
						event.target.closest('li').remove();
					});
				},
				no: (elemDialog) => {
					return false;
				}
			});
		}
		const activatePreset = (event) => {
			const presetKey = event.target.closest('li').dataset.preset;
			let moduleStates = game.settings.get('core', ModuleManagement.CONFIG_SETTING);
			let preset = MODULE.setting('presets')[presetKey];

			Dialog.confirm({
				id: `${MODULE.ID}-activate-preset`,
				title: MODULE.TITLE,
				content: `<p style="margin-top: 0px;">${MODULE.localize('dialog.presets.activate.description')}</p>
				<textarea readonly rows="${preset.modules.length <= 15 ? preset.modules.length + 2 : 15}" style="margin-bottom: 0.5rem;">### ${MODULE.localize('dialog.generic.activeModules')}\n${preset.modules.filter((module) => {
					return (game.modules.get(module.id) ?? false) != false;
				}).map(module => {
					return module.title;
				}).join('\n')}</textarea>`,
				yes: (elemDialog) => {
					// Disable All Modules
					for (const property in moduleStates)  moduleStates[property] = false;
		
					// Enable Modules
					preset.modules.forEach(module => {
						if (typeof moduleStates[module.id] != undefined) {
							moduleStates[module.id] = true;
						}
					});
		
					// Update Modules and Reload Game
					if (!MODULE.setting('storePreviousOnPreset')) MODULE.setting('storedRollback', {});
					game.settings.set('core', ModuleManagement.CONFIG_SETTING, moduleStates).then((response) => {
						SettingsConfig.reloadConfirm({world: true});
					});
				},
				no: (elemDialog) => {
					return false;
				}
			});
		}

		// Manage Presets Buttons
		html[0].querySelectorAll(`#${MODULE.ID}-presets-list li`).forEach(elemPreset => {
			// INFO
			elemPreset.querySelector('button[data-action="info"]').addEventListener('click', presetInfo);
			// UPDATE
			elemPreset.querySelector('button[data-action="update"]').addEventListener('click', updatePreset);
			// Delete
			elemPreset.querySelector('button[data-action="delete"]').addEventListener('click', deletePreset);
			// ACTIVATE
			elemPreset.querySelector('button[data-action="activate"]').addEventListener('click', activatePreset);
		})

		// Create a New Preset
		html[html.length - 1].querySelector('.dialog-buttons button[data-action="create"]').addEventListener('click', (event) => {
			const packages = document.querySelectorAll('#module-management #module-list li.package');
			let presetPackages = [];
			packages.forEach(elemPackage => {
				if (elemPackage.querySelector('input[type="checkbox"]:checked') ?? false) {
					presetPackages.push({
						id: game.modules.get(elemPackage.dataset.moduleId).id,
						title: game.modules.get(elemPackage.dataset.moduleId).title
					})
				}
			});

			return Dialog.confirm({
				id: `${MODULE.ID}-create-preset`,
				title: MODULE.TITLE,
				content: `<p style="margin-top: 0px;">${MODULE.localize('dialog.presets.create.title')}</p>
					<input type="text" name="${MODULE.ID}-preset-title" placeholder="${MODULE.localize('dialog.presets.create.placeholder')}" />
					<textarea readonly rows="${presetPackages.length <= 15 ? presetPackages.length + 2 : 15}" style="margin-bottom: 0.5rem;">### ${MODULE.localize('dialog.generic.activeModules')}\n${presetPackages.map(module => {
						return module.title;
					}).join('\n')}</textarea>`,
				yes: (elemDialog) => {
					if (elemDialog[0].querySelector(`input[name="${MODULE.ID}-preset-title"]`)?.value?.length == 0) {
						throw `<strong>${MODULE.TITLE}</strong> ${MODULE.localize('dialog.presets.create.notification.noTitleError')}`;
					}

					const presetKey = foundry.utils.randomID();
					MODULE.setting('presets', mergeObject(MODULE.setting('presets'), { 
						[presetKey]: {
							"name": elemDialog[0].querySelector(`input[name="${MODULE.ID}-preset-title"]`)?.value,
							"modules": presetPackages
						}
					}, { inplace: false })).then((response) => {
						html[0].querySelector(`#${MODULE.ID}-presets-list`).insertAdjacentHTML('beforeend', `<li data-preset="${presetKey}">
							<label for="preset-${presetKey}">${elemDialog[0].querySelector(`input[name="${MODULE.ID}-preset-title"]`)?.value}</label>
							<button data-action="info" data-tooltip="${MODULE.localize('dialog.presets.tooltips.info')}">
								<i class="fa-solid fa-circle-info"></i>
							</button>
							<button data-action="update" data-tooltip="${MODULE.localize('dialog.presets.tooltips.update')}">
								<i class="fa-solid fa-floppy-disk"></i>
							</button>
							<button data-action="delete" data-tooltip="${MODULE.localize('dialog.presets.tooltips.delete')}">
								<i class="fa-solid fa-trash"></i>
							</button>
							<button data-action="activate" data-tooltip="${MODULE.localize('dialog.presets.tooltips.activate')}">
								<i class="fa-solid fa-circle-play"></i>
							</button>
						</li>`);
						
						// INFO
						html[0].querySelector(`#${MODULE.ID}-presets-list li:last-of-type button[data-action="info"]`).addEventListener('click', presetInfo);
						
						// UPDATE
						html[0].querySelector(`#${MODULE.ID}-presets-list li:last-of-type button[data-action="update"]`).addEventListener('click', updatePreset);

						// Delete
						html[0].querySelector(`#${MODULE.ID}-presets-list li:last-of-type button[data-action="delete"]`).addEventListener('click', deletePreset);

						// ACTIVATE
						html[0].querySelector(`#${MODULE.ID}-presets-list li:last-of-type button[data-action="activate"]`).addEventListener('click', activatePreset);
						return true;
					});
				},
				no: () => {
					return 'Player Rejected Setting'
				},
				render: (elem) => {
					setTimeout(() => {
						elem[0].querySelector(`input[type="text"][name="${MODULE.ID}-preset-title"]`).focus();
					}, 1);
				}
			}).then(response => {
			});
		})
	}
}