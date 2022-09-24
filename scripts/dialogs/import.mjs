// GET MODULE CORE
import { MODULE } from '../_module.mjs';

export class ImportDialog extends FormApplication {
	constructor(moduleData, importType) {
		super();

		// Format Module Data
		for (const [key, module] of Object.entries(moduleData)) {
			moduleData[key].isInstalled = game.modules.has(key) ?? false 
			/*moduleData[key].isNewerVersion = isNewerVersion(module?.version ?? "0.0.0", game.modules.get(key)?.data?.version ?? "0.0.0");
			moduleData[key].isCurrentVersion = !moduleData[key].isNewerVersion && (module?.version ?? "0.0.0") == (game.modules.get(key)?.data?.version ?? "0.0.0");
			moduleData[key].isOlderVersion = !moduleData[key].isNewerVersion && !moduleData[key].isCurrentVersion*/
			moduleData[key].hasClientSettings = moduleData[key].isInstalled && (moduleData[key]?.settings?.client ?? false)
			moduleData[key].hasWorldSettings = moduleData[key].isInstalled && (moduleData[key]?.settings?.world ?? false)
		}

		this.importType = importType
		this.moduleData = moduleData;
	}

	static get defaultOptions() {
		return {
			...super.defaultOptions,
			title: `${MODULE.TITLE} - ${MODULE.localize('dialog.titles.import')}`,
			id: `${MODULE.ID}-import-dialog`,
			classes: ['dialog'],
			template: `./modules/${MODULE.ID}/templates/import.hbs`,
			resizable: false,
			width: $(window).width() > 580 ? 580 : $(window).width() - 100,
			height: $(window).height() > 620 ? 620 : $(window).height() - 100
		}
	}

	getData() {
		return {
			DIALOG: {
				ID: MODULE.ID,
				TITLE: MODULE.TITLE
			},
			modules: this.moduleData,
			IsTidyUI: this.importType == 'tidy-ui_game-settings',
			IsGM: game.user.isGM
		}
	}

	processSettingData(moduleID, type, settings) {
		return new Promise((resolve, reject) => {
			for (const [key, setting] of Object.entries(settings)) {
				if (type == 'client') {
					game.settings.storage.get(type).setItem(`${moduleID}.${key}`, setting)
					resolve({moduleID, key, setting});
				}else if (type == 'world' && game.user.isGM) {
					SocketInterface.dispatch("modifyDocument", {
						type: "Setting",
						action: "update",
						data: {
							key: `${moduleID}.${key}`,
							value: setting
						}
					}).then((response) => {
						resolve({moduleID, key, setting, response});
					});
				}else{
					resolve(false);
				}
			}
		});
	}
	
	activateListeners(html) {
		super.activateListeners(html);
		// All The Checkboxes
		let totalModulesToImport = $(html).find('li[data-module] input[name="import-module"]:not([disabled])').length;
		let enabledModulesToImport = $(html).find('li[data-module] input[name="import-module"]:not([disabled]):checked').length;
		let totalClientSettingsToImport = $(html).find('li[data-module] input[name="import-settings-client"]:not([disabled])').length;
		let enabledClientSettingsToImport = $(html).find('li[data-module] input[name="import-settings-client"]:not([disabled]):checked').length;
		let totalWorldSettingsToImport = $(html).find('li[data-module] input[name="import-settings-world"]:not([disabled])').length;
		let enabledWorldSettingsToImport = $(html).find('li[data-module] input[name="import-settings-world"]:not([disabled]):checked').length;

		// Set Import Module Checkbox Initial State
		$(html).find('input[name="import-toggle-modules"]').prop('indeterminate', enabledModulesToImport > 0 && enabledModulesToImport != totalModulesToImport);
		$(html).find('input[name="import-toggle-modules"]').prop('checked', enabledModulesToImport == totalModulesToImport);

		// Handle When User Changes Import Checkbox State
		$(html).find('li[data-module] input[name="import-module"]:not([disabled])').on('change', (event) => {
			enabledModulesToImport = $(html).find('li[data-module] input[name="import-module"]:not([disabled]):checked').length;

			$(html).find('input[name="import-toggle-modules"]').prop('indeterminate', enabledModulesToImport > 0 && enabledModulesToImport != totalModulesToImport);
			$(html).find('input[name="import-toggle-modules"]').prop('checked', enabledModulesToImport == totalModulesToImport);
		});
		// HToggle All Import Checkbox States
		$(html).find('input[name="import-toggle-modules"][type="checkbox"]').on('change', (event) => {
			$(html).find('li[data-module] input[name="import-module"]:not([disabled])').prop('indeterminate', false);
			$(html).find('li[data-module] input[name="import-module"]:not([disabled])').prop('checked', $(event.target).is(':checked'));
		})

		// Handle When User Changes Import Client Settings Checkbox State
		$(html).find('li[data-module] input[name="import-settings-client"]:not([disabled])').on('change', (event) => {
			enabledClientSettingsToImport = $(html).find('li[data-module] input[name="import-settings-client"]:not([disabled]):checked').length;

			$(html).find('input[name="import-toggle-client-settings"]').prop('indeterminate', enabledClientSettingsToImport > 0 && enabledClientSettingsToImport != totalClientSettingsToImport);
			$(html).find('input[name="import-toggle-client-settings"]').prop('checked', enabledClientSettingsToImport == totalClientSettingsToImport);
		});
		// Toggle All Import Checkbox States
		$(html).find('input[name="import-toggle-client-settings"][type="checkbox"]').on('change', (event) => {
			$(html).find('li[data-module] input[name="import-settings-client"]:not([disabled])').prop('indeterminate', false);
			$(html).find('li[data-module] input[name="import-settings-client"]:not([disabled])').prop('checked', $(event.target).is(':checked'));
		})

		// Handle When User Changes Import Client Settings Checkbox State
		$(html).find('li[data-module] input[name="import-settings-world"]:not([disabled])').on('change', (event) => {
			enabledWorldSettingsToImport = $(html).find('li[data-module] input[name="import-settings-world"]:not([disabled]):checked').length;

			$(html).find('input[name="import-toggle-world-settings"]').prop('indeterminate', enabledWorldSettingsToImport > 0 && enabledWorldSettingsToImport != totalWorldSettingsToImport);
			$(html).find('input[name="import-toggle-world-settings"]').prop('checked', enabledWorldSettingsToImport == totalWorldSettingsToImport);
		});
		// Toggle All Import Checkbox States
		$(html).find('input[name="import-toggle-world-settings"][type="checkbox"]').on('change', (event) => {
			$(html).find('li[data-module] input[name="import-settings-world"]:not([disabled])').prop('indeterminate', false);
			$(html).find('li[data-module] input[name="import-settings-world"]:not([disabled])').prop('checked', $(event.target).is(':checked'));
		})

		$(html).find('[data-button="import"]').on('click', (event) => {
			event.preventDefault();
			let keepActiveModules = $('html').find('.dialog-buttons input[name="keep-enabled-modules"]').is(':checked');
			let moduleStates = game.settings.get('core', ModuleManagement.CONFIG_SETTING);
			let $moduleManagment = $('body #module-management');
			let settingsCalls = [];

			// check if User Wants to keep their currently Enabled modules
			if (!keepActiveModules) {
				$moduleManagment.find('#module-list li.package input[type="checkbox"]').prop('checked', false);
				$moduleManagment.find('#module-list li.package input[type="checkbox"]').removeClass('active');
				
				// Disable All Modules
				for (const property in moduleStates)  moduleStates[property] = false;
			}

			$(html).find('ul li[data-module] input[type="checkbox"]').prop('disabled', true);
			$(html).find('ul li[data-module]').each((index, module) => {
				let moduleID = $(module).data('module');
				let isEnabled = $(module).find(`input[name="import-module"][type="checkbox"]`).is(':checked');
				let importClientSettings = $(module).find(`input[name="import-${moduleID}-settings-client"][type="checkbox"]`).is(':checked') ?? false;
				let importWorldSettings = $(module).find(`input[name="import-${moduleID}-settings-world"][type="checkbox"]`).is(':checked') ?? false;

				// Control Module Active Status
				moduleStates[moduleID] = isEnabled;

				$moduleManagment.find(`#module-list li.package[data-module-name="${moduleID}"] input[type="checkbox"]`).prop('checked', isEnabled);
				$moduleManagment.find(`#module-list li.package[data-module-name="${moduleID}"] input[type="checkbox"]`).toggleClass('active', isEnabled);	

				if (isEnabled) {
					// Import World Settings
					if (importWorldSettings && (this.moduleData[moduleID]?.settings?.world ?? false)) {
						settingsCalls.push(this.processSettingData(moduleID, 'world', this.moduleData[moduleID]?.settings?.world));
					}

					// Import Client Settings
					if (importClientSettings && (this.moduleData[moduleID]?.settings?.client ?? false)) {
						settingsCalls.push(this.processSettingData(moduleID, 'client', this.moduleData[moduleID]?.settings?.client));
					}
				}
			});

			Promise.allSettled(settingsCalls).then((response) => {
				if (!MODULE.setting('storePreviousOnPreset')) MODULE.setting('storedRollback', {});
				game.settings.set('core', ModuleManagement.CONFIG_SETTING, moduleStates).then((response) => {
					SettingsConfig.reloadConfirm({world: true});
				});
			});
		})
	}
}