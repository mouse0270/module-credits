// GET REQUIRED LIBRARIES
import './libraries/popper.min.js';
import './libraries/tippy.min.js';

// GET MODULE CORE
import { MODULE } from './_module.mjs';
import { PreviewDialog } from './dialogs/preview.mjs';
import { ExportDialog } from './dialogs/export.mjs';
import { ImportDialog } from './dialogs/import.mjs';

// Foundry Overwrite Dialog
import { BetterDialog as Dialog } from './foundry/dialog.mjs';

// DEFINE MODULE CLASS
export class MMP {
	static packages = new Map();
	static conflicts = {};
	static popperInstance = null;
	static socket;

	/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
	// MODULE SUPPORT CODE
	/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
	// MODULE SUPPORT FOR || 🐛 Bug Reporter Support ||
	static bugReporterSupport = (moduleData) => {
		// 🐛 Bug Reporter Support
		let bugReporter = game.modules.get('bug-reporter') || {api: undefined};
		// Check if Bug Reporter is Exists and Enabled
		return (
			typeof bugReporter.api != 'undefined'
			&& (
				// Check if Module has Opted into Bug Reporter Support
				moduleData?.allowBugReporter
				|| moduleData?.flags?.allowBugReporter
			)
		);
	}

	// MODULE SUPPORT FOR || socketlib ||
	static registerSocketLib = () => {
		this.socket = socketlib.registerModule(MODULE.ID);
		this.socket.register("useFilePicker", this.useFilePicker);
	}

	/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
	// WHAT IS THIS?
	/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
	static get hasPermission() {
		return game.permissions.FILES_BROWSE.includes(game.user.role) || (game.modules.get('socketlib')?.active ?? false);
	}
	static get isGMOnline() {
		return game.users.find(user => user.isGM && user.active);
	}

	/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
	// FUNCTIONS
	/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
	static async useFilePicker(url, options = {}) {
		// IF URL HAS FILE EXTENSION, ASSUME WE ARE LOOKING FOR A SPECIFIC FILE
		let getFile = url.split('/').pop().includes('.');

		return await FilePicker.browse('user', url, options).then(response => {
			let files = getFile ? [] : response.files.filter(file => file.toLowerCase().endsWith(url.split('/').pop().toLowerCase()));
			if (files.length > 0 || !getFile) {
				return getFile ? files[0] : response.files;
			}
			throw TypeError(`unable to access ${url}`);
		}).then(file => file).catch((error) => {
			MODULE.debug(error);
			return false;
		});
	}
	
	static async useFetch(url, options ={}) {
		return await fetch(url).then(response => {
			if (response.status >= 200 && response.status <= 299) {
				return response;
			}
			throw TypeError("unable to fetch file content");
		}).then(data => {
			return url;
		}).catch(error => {
			MODULE.debug(error);
			return false;
		})
	}

	static async checkIfFilesExists(url, options = {}) {
		// Check if User is able to use FilePicker
		if (!this.hasPermission) return false;

		// Use socketlib if user does not have access to `FILES_BROWSE`
		if (!game.permissions.FILES_BROWSE.includes(game.user.role) && this.isGMOnline) {
			return await this.socket.executeAsGM("useFilePicker", url, options).then(file => file)
		}

		// Else use file picker directly
		return await this.useFilePicker(url, options).then(file => file);
	}

	static async getFile(url) {
		return await fetch(url).then(response => {
			if (response.status >= 200 && response.status <= 299) {
				if (url.split('.').pop().toLowerCase().startsWith('json')) {
					return response.json();
				}else{
					return response.text();
				}
			}
			throw TypeError("unable to fetch file content");
		}).then(data => {
			return data;
		}).catch(error => {
			MODULE.debug(error);
			return false;
		})
	}

	static versionCompare = (versionMin, versionCurrent, versionMax = false) => {
		if (!versionMin) {
			return true
		}else if (!versionMax) {
			return (isNewerVersion(versionCurrent, versionMin) || versionCurrent == versionMin);
		}else if (versionMax) {
			return (isNewerVersion(versionCurrent, versionMin) || versionCurrent == versionMin) && !isNewerVersion(versionCurrent, versionMax)
		}

		return true;
	}

	// DEFINE API
	static installAPI = () => {
		game.modules.get(MODULE.ID).API = {
			getContent: async (module, type) => this.getFile(this.packages.get(module)?.[type]),
			getChangelog: async (module) => this.getFile(this.packages.get(module).changelog),
			getReadme: async (module) => this.getFile(this.packages.get(module).readme)
		}
	}

	static init = () => {
		// SETUP API
		this.installAPI();

		this.getPackages().then((response) => {
			this.updateSettingsTab({}, $('#ui-right #sidebar'), {});

			// Get unseen Changelogs and Show to GM
			if (game.user.isGM && MODULE.setting('showNewChangelogsOnLoad')) {
				var unseenChangelogs = Object.keys(MODULE.setting('trackedChangelogs')).reduce((result, key) => {    
					if (!MODULE.setting('trackedChangelogs')[key].hasSeen) result[key] = MODULE.setting('trackedChangelogs')[key];
					return result;
				}, {});

				if (Object.keys(unseenChangelogs).length >= 1) {
					new PreviewDialog(unseenChangelogs).render(true);
				}
			}
		})
	}

	static registerConflictsAndIssues = () => {
		let conflicts = {};
		for (let [key, module] of this.packages) {
			// Check if conflict exists
			if (module?.conflicts?.length > 0 ?? false) {
				module.conflicts.filter((conflict) => {
					let conflictID = [
							`${key}${(conflict?.name ?? false) ? '^'+conflict?.name : ''}`,
							`${(conflict?.name ?? false) ? conflict?.name+'^' : ''}${key}`
						]

					// SET CONFLICT ID
					// This code determins if a conflict between two modules has already been defined
					// if so, append to that conflict instead of adding a new one.
					if (conflict.type == 'foundry') conflictID = `${key}|foundry`;
					else if (this.conflicts.hasOwnProperty(conflictID[0])) conflictID = conflictID[0];
					else if (this.conflicts.hasOwnProperty(conflictID[1])) conflictID = conflictID[1];
					else conflictID = conflictID[0];
					
					// Conflict has been registered already - Append
					if (this.conflicts.hasOwnProperty(conflictID)) {
						this.conflicts[conflictID].description.push(conflict?.description)
						return false;

					// Conflict has not been Registered - Create
					}else{
						this.conflicts[conflictID] = {
							type: conflict.type,
							description: [conflict?.description]
						}
					}
					return true;
				});
			}
		}
	}

	static formatAuthors = (moduleData) => {
		// Build Authors
		let authors = [];
		moduleData?.authors?.forEach(author => {
			if (typeof author == 'string') authors.push({ name: author });
			else authors.push({...author});
		});
		
		// If no authors found, use author tag instead
		if (authors.length == 0 && moduleData?.author?.length > 0) {
			if (typeof moduleData?.author == 'string' || (Array.isArray(moduleData?.author) && (moduleData?.author?.length >= 1 ?? false))) {
				try {
					if (Array.isArray(moduleData?.author)) moduleData?.author.join(',');
					moduleData?.author.split(',').forEach((author, index) => {
						authors.push({ name: author})
					})
				} catch (error) {
					MODULE.error(`${game.modules.get(moduleData.name).data.title} is using an unknown format for the author property in there module.json file. Unable to process this modules authors.`,  moduleData?.author);
				}
			}else{
				MODULE.error(`${game.modules.get(moduleData.name).data.title} is using an unknown format for the author property in there module.json file. Unable to process this modules authors.`,  moduleData?.author);
			}
		}

		return authors;
	}

	static async getTrackedChangelogs() {
		for await (const [key, module] of this.packages) {
			// Track Changelogs
			// Check if version is newer then saved.
			if (module.changelog && game.user.isGM) {
				let hasSeen = MODULE.setting('trackedChangelogs')?.[key]?.hasSeen ?? false;
				if (isNewerVersion(module?.version ?? '0.0.0', MODULE.setting('trackedChangelogs')?.[key]?.version ?? '0.0.0')) {
					MODULE.debug(`${key} is newer then last seen, set hasSeen to false`);
					hasSeen = false;
				}
				await MODULE.setting('trackedChangelogs', mergeObject(MODULE.setting('trackedChangelogs'), {
					[key]: {
						title: game.modules.get(key).data.title,
						version: module?.version ?? '0.0.0',
						hasSeen: hasSeen
					}
				}));
			}
		}

		return MODULE.setting('trackedChangelogs');
	}

	static async formatPackage(moduleData) {
		// Get README and CHANGELOG Files
		let getFiles = await this.checkIfFilesExists(`./modules/${moduleData.name}/`, { extensions: ['.md'] });
		// Required as Foundry Does not Load All Required Information from module.json file
		let moduleJSON = await this.getFile(`./modules/${moduleData.name}/module.json`);
		// Assign Files to Variables
		let readme = getFiles ? getFiles.filter(file => file.toLowerCase().endsWith('README.md'.toLowerCase()))[0] : false;
		let changelog = getFiles ? getFiles.filter(file => file.toLowerCase().endsWith('CHANGELOG.md'.toLowerCase()))[0] : false;
		let acknowledgments = getFiles ? getFiles.filter(file => file.toLowerCase().endsWith('ACKNOWLEDGMENTS.md'.toLowerCase()))[0] : false;
		// Get License File
		let license = false; // Foundry File Picker Does not Display this File

		// Format MMP Package
		let formatedData = {
			authors: this.formatAuthors(moduleData),
			version: moduleData?.version != 'This is auto replaced' ? moduleData?.version : '0.0.0' ?? false,
			socket: moduleData?.socket ?? false,
			library: moduleData?.library ?? false,
			readme: readme,
			changelog: changelog,
			acknowledgments: acknowledgments,
			license: license,
			bugs: moduleData?.bugs ?? false,
			conflicts: [], //moduleJSON?.conflicts ?? false,
			issues: [], //moduleJSON?.conflicts ?? false,
			deprecated: moduleJSON?.deprecated ?? false,
			attributions: moduleJSON?.attributions ?? false,
			allowBugReporter: moduleData?.allowBugReporter ?? moduleData?.flags?.allowBugReporter ?? moduleJSON.allowBugReporter ?? false
		}

		// Throw Dev Debug Warning if Developer has not updated to using .flags.allowBugReporter
		if (moduleJSON.allowBugReporter && !moduleData?.flags?.allowBugReporter) {
			MODULE.warn(`${game.modules.get(moduleData.name).data.title} is using a deprecated version of support for 🐛 Bug Reporter.`);
		}

		// Track Changelogs
		// Check if version is newer then saved.
		if (changelog && game.user.isGM) {
			let hasSeen = MODULE.setting('trackedChangelogs')?.[moduleData.name]?.hasSeen ?? false;
			if (isNewerVersion(formatedData?.version ?? '0.0.0', MODULE.setting('trackedChangelogs')?.[moduleData.name]?.version ?? '0.0.0')) {
				MODULE.debug(`${moduleData.name} is newer then last seen, set hasSeen to false`);
				hasSeen = false;
			}
			await MODULE.setting('trackedChangelogs', Object.assign(MODULE.setting('trackedChangelogs'), {
				[moduleData.name]: {
					title: moduleData?.title,
					version: formatedData?.version ?? '0.0.0',
					hasSeen: hasSeen
				}
			}));
		}

		// Loop Through conflicts and Add them if they need to be added
		if ((moduleJSON?.conflicts || moduleJSON?.issues || moduleData?.flags?.conflicts || moduleData?.flags?.issues) ?? false) {

			// Check if Module is using Deprecated Version of Defining Conflicts | Issues
			if (moduleJSON?.conflicts?.length >= 1 ?? false) MODULE.warn(`${game.modules.get(moduleData.name).data.title} is using a deprecated version of defining conflicts. Please move your conflicts to the flags property.`);
			if (moduleJSON?.issues?.length >= 1 ?? false) MODULE.warn(`${game.modules.get(moduleData.name).data.title} is using a deprecated version of defining issues. Please move your issues to the flags property.`);
			
			// Cause I am lazy, merge Conflicts and Issues
			// Yes this does mean techncially a user could list a conflict as an issue and vice versa
			// But I also don't honestly care for the purpose of display the content is the same
			let conflicts = (moduleJSON?.conflicts ?? []).concat(moduleJSON?.issues ?? []).concat(moduleData?.flags?.conflicts ?? []).concat(moduleData?.flags?.issues ?? []);
			if (conflicts.length > 0) MODULE.debug(`Registering Conflict from ${moduleData.name}.`, conflicts)
			conflicts.forEach((conflict, index) => {
				if (game.modules.get(conflict?.name) ?? false) {
					if (this.versionCompare(conflict.versionMin, game.modules.get(conflict?.name).data.version, conflict.versionMax)) {
						formatedData.conflicts.push(mergeObject(conflict, { type: 'module' }, { inplace:false }))
					}
				}else {
					if (conflict.type == 'foundry') {
						if (this.versionCompare(conflict.versionMin, game.release.version, conflict.versionMax)) {
							formatedData.conflicts.push(mergeObject(conflict, { type: 'foundry' }, { inplace:false }))
						}
					}else if (conflict.type == 'foundry') {
						if (this.versionCompare(conflict.versionMin, moduleData.version, conflict.versionMax)) {
							formatedData.conflicts.push(mergeObject(conflict, { type: 'issue' }, { inplace:false }));
						}
					}
				}
			})
		}

		return formatedData;
	}

	static async getGlobalConflicts() {
		// Get Global Conflcits
		let globalConflicts = await this.getFile(`//foundryvtt.mouse0270.com/module-credits/conflicts.json?time=${Date.now()}`);

		// Assign Conflict if Package Exists
		globalConflicts.forEach((conflict, index) => {
			if (this.packages.get(conflict.moduleID) && this.packages.get(conflict.conflictingModuleID)) {
				// HANDLE CONFLICT BETWEEN TWO MODULES
				if (this.versionCompare(conflict.versionMin, this.packages.get(conflict.conflictingModuleID).version, conflict.versionMax)) {
					this.packages.get(conflict.moduleID).conflicts.push({
						"name": conflict.conflictingModuleID,
						"type": "module",
						"description": conflict.description ?? false,
						"versionMin": conflict.versionMin ?? false,
						"versionMax": conflict.versionMax ?? false
					})
				}
			}else if (this.packages.get(conflict.moduleID)) {
				// HANDLE KNOWN ISSUE
				if (this.versionCompare(conflict.versionMin, this.packages.get(conflict.moduleID).version, conflict.versionMax)) {
					this.packages.get(conflict.moduleID).conflicts.push({
						"type": "issue",
						"description": conflict.description ?? false,
						"versionMin": conflict.versionMin ?? false,
						"versionMax": conflict.versionMax ?? false
					})
				}
			}else{
				MODULE.debug('MODULES NOT ENABLED: ', this.packages.get(conflict.moduleID), this.packages.get(conflict.conflictingModuleID));
			}
		})
	}

	static async getPackages() {
		for await (let [key, module] of game.modules) {
			// HANDLE IF PACKAGE DOESNT HAVE SOURCE USE DATA THEN KICK OUT
			if (module?.data?._source ?? module?.data ?? false) this.packages.set(key, await this.formatPackage(module?.data?._source ?? module?.data));
		};

		await this.getGlobalConflicts();
		this.registerConflictsAndIssues();

		return this.packages;
	}

	static updateSettingsTab = (settings, $element, options) => {
		if ($element.find('#settings #settings-documentation').length >= 1) {
			if ($element.find('#settings #settings-documentation button[data-action="changelog"]').length <= 0 && this.hasPermission && this.isGMOnline) {
				$element.find('#settings #settings-documentation').append(`<button data-action="changelog">
						<i class="fas fa-exchange-alt"></i> Module Changelogs
					</button>`);

				$element.find('#settings #settings-documentation [data-action="changelog"]').off('click');
				$element.find('#settings #settings-documentation [data-action="changelog"]').on('click', event => {
					new PreviewDialog(MODULE.setting('trackedChangelogs')).render(true);
				});
			}

			// If user can manage modules, Show Conflicts
			if (game.permissions.SETTINGS_MODIFY.includes(game.user.role)) {
				$element.find('#settings #settings-game button[data-action="modules"]').attr('data-conflicts', Object.keys(this.conflicts).length);
			}
		}
	} 

	static fixModuleTags = ($element) => {
		// Handle Version Tag
		let version = $element.find('.tag.version').text();
		// Format Version Text | Use Translation Location for better Support
		version = version.replace(`${game.i18n.translations.PACKAGE.TagVersion} `, '').replace('This is auto replaced', '0.0.0');
		// Update Tag Text
		$element.find('.tag.version').text(version);

		// Handle Compatibility Risk Tag
		let compatibilityRisk = $element.find('.tag.unknown').text();
		// Format Compatibility Risk Text
		// * TODO: Find Translation Text for Compatibility Risk
		compatibilityRisk = compatibilityRisk.replace('Compatibility Risk (', '').replace(')', '');
		// Update Tag Text
		$element.find('.tag.unknown').text(compatibilityRisk);
	}

	static buildAuthorTooltip = (authors) => {
		let $tooltipHTML = $(`<div class="${MODULE.ID}-author-data"></div>`);
		const isURL = (url) => { try { new URL(url); return true; } catch { return false; }};

		// DEFINE AUTHOR TOOLTIP LAYOURS
		const defineTooltips = (template, {key, value}) => {
			if (value == undefined || typeof value == 'undefined') return '';
			if (key == 'url') key = 'website';

			if (key == 'name') {
				return `<div class="${MODULE.ID}-list-group-item tooltip-type-name">
					<strong>${value}</strong>
				</div>`;
			}else if (['twitter', 'patreon', 'github', 'reddit', 'ko-fi'].includes(key)) {
				return `<a href="${isURL(value) ? value : 'https://www.'+key+'.com/'+value}" target="_blank" class="${MODULE.ID}-list-group-item ${MODULE.ID}-tooltip-social ${MODULE.ID}-tooltip tooltip-type-${key}">
					<i class="fab fa-${key}"></i>
					${isURL(value) ? key : value}
				</a>`;
		 	}else {
				return `<${isURL(value) ? 'a' : 'div'} ${isURL(value) ? 'href="'+value+'" traget="_blank"' : ''} class="${MODULE.ID}-list-group-item ${MODULE.ID}-tooltip tooltip-type-${key}">
					<i class="fas fa-info-circle"></i>
					${isURL(value) ? key : value }
				</${isURL(value) ? 'a' : 'div'}>`;
			}
		}

		authors.forEach(function (author, index) {
			let $author = $(`<div class="${MODULE.ID}-list-group"></div>`);
			for (const [key, value] of Object.entries(author)) {
				$author.append(defineTooltips('default', {key, value}));
			}
			$tooltipHTML.append($author);
		});
		return $tooltipHTML;
	}

	static addPackageTag = ($element, tag, action = false, options = {}) => {
		let $tag = $(`<a class="tag ${tag}" title="${tag}"></a>`);

		if (action == 'popover') {
			tippy($tag[0], options)
		}else if (action && typeof action != 'function') {
			 $tag.attr({
				'href': action,
				'target': '_blank'
			});
		}else if (action && typeof action == 'function') {
			$tag.on('click', action);
		}

		$element.find('.package-overview .package-title').after($tag);
	}

	static addModulePresets = (element) => {
		let $presets = $(`<div id="${MODULE.ID}-presets">
			<button id="${MODULE.ID}-create-preset" title="Create New Preset"><i class="fas fa-plus"></i></button>
			<input type="text" id="${MODULE.ID}-preset-title" />
			<select id="${MODULE.ID}-preset-options">
				<option value="none">Select a Preset...</option>
			</select>
			<button id="${MODULE.ID}-cancel-preset" title="Delete Preset"><i class="far fa-trash-alt"></i></button>
			<button id="${MODULE.ID}-save-preset" title="Save Preset"><i class="far fa-save"></i></button>
			<button id="${MODULE.ID}-export-preset" title="Export Preset"><i class="fas fa-download"></i></button>
			<button id="${MODULE.ID}-import-preset" title="Import Preset"><i class="fas fa-upload"></i></button>
		</div>`);

		function handleButtonStates() {
			let isAddingPreset = $presets.hasClass('adding-preset');
			let presetSelected = $presets.hasClass('preset-selected');

			$presets.find(`button#${MODULE.ID}-cancel-preset`).prop('disabled', !isAddingPreset && !presetSelected);
			$presets.find(`button#${MODULE.ID}-save-preset`).prop('disabled', !isAddingPreset && !presetSelected);

			$presets.find(`button#${MODULE.ID}-create-preset`).prop('disabled', isAddingPreset);
			$presets.find(`button#${MODULE.ID}-export-preset`).prop('disabled', isAddingPreset);
			$presets.find(`button#${MODULE.ID}-import-preset`).prop('disabled', isAddingPreset);
		}

		// Handle Button States
		handleButtonStates();

		// Build Preset Dropdown List
		for (let [key, setting] of Object.entries(MODULE.setting('presets'))) {
			$presets.find(`select#${MODULE.ID}-preset-options`).append(`<option value="${key}">${setting.name}</option>`);
		}

		// When the Preset Changes
		$presets.find(`select#${MODULE.ID}-preset-options`).on('change', (event) => {
			let preset = $(event.target).val();

			$(event.target).closest(`#${MODULE.ID}-presets`).removeClass('adding-preset preset-selected');

			if (preset != "none") {
				$(element).find('.package-title input[type="checkbox"]').prop('checked', false);
				$(element).find('.package-title input[type="checkbox"]').removeClass('active');

				MODULE.setting('presets')[preset].modules.forEach((module, index) => {
					$(element).find(`.package[data-module-name="${module.name}"] input[type="checkbox"]`).prop('checked', true);
					$(element).find(`.package[data-module-name="${module.name}"] input[type="checkbox"]`).addClass('active');
				});
				//$(element).find(`.package input[type="checkbox"]`).trigger('change');

				$(event.target).closest(`#${MODULE.ID}-presets`).addClass('preset-selected');
				$(event.target).closest(`#${MODULE.ID}-presets`).find(`#${MODULE.ID}-cancel-preset`).attr('title', 'Delete Preset');
			}

			// Handle Button States
			handleButtonStates();
		})

		// HANDLE CREATING
		$presets.find(`#${MODULE.ID}-create-preset`).on('click', (event) => {
			event.preventDefault();

			$(event.target).closest(`#${MODULE.ID}-presets`).removeClass('preset-selected');
			$(event.target).closest(`#${MODULE.ID}-presets`).toggleClass('adding-preset');
			if ($(event.target).closest(`#${MODULE.ID}-presets`).hasClass('adding-preset')) {
				$(event.target).closest(`#${MODULE.ID}-presets`).find(`#${MODULE.ID}-preset-title`).val('');
				$(event.target).closest(`#${MODULE.ID}-presets`).find(`#${MODULE.ID}-preset-title`).focus();
				$(event.target).closest(`#${MODULE.ID}-presets`).find(`#${MODULE.ID}-cancel-preset`).attr('title', 'Cancel Preset');
			}else{
				$(event.target).closest(`#${MODULE.ID}-presets`).find(`#${MODULE.ID}-cancel-preset`).attr('title', 'Delete Preset');
			}

			// Handle Button States
			handleButtonStates();
		});

		// When Cancelling || When Deleting
		$presets.find(`#${MODULE.ID}-cancel-preset`).on('click', (event) => {
			event.preventDefault();

			if ($(event.target).closest(`#${MODULE.ID}-presets`).hasClass('adding-preset')) {
				$(event.target).closest(`#${MODULE.ID}-presets`).find(`#${MODULE.ID}-preset-title`).blur();
				$(event.target).closest(`#${MODULE.ID}-presets`).find(`#${MODULE.ID}-preset-title`).val('');
				$(event.target).closest(`#${MODULE.ID}-presets`).removeClass('adding-preset');
			}else{
				let presetKey = $presets.find(`#${MODULE.ID}-preset-options`).val();
				Dialog.confirm({
					title: MODULE.localize('dialog.deletePreset.name'), 
					content: MODULE.localize('dialog.deletePreset.hint'), 
					yes: (event) => { 
						let settings = MODULE.setting('presets');
						delete settings[presetKey];
						MODULE.setting('presets', settings).then(response => {
							$presets.find(`#${MODULE.ID}-preset-options option[value="${presetKey}"]`).remove();
							$presets.find(`#${MODULE.ID}-preset-options`).val('none');
							$presets.find(`#${MODULE.ID}-preset-options`).trigger('change');
						})
					}, 
					no: (event) => { return false; }
				})
			}

			// Handle Button States
			handleButtonStates();

		});

		// Saving
		$presets.find(`#${MODULE.ID}-save-preset`).on('click', (event) => {
			event.preventDefault();
			let modules = [];
			let presetKey = foundry.utils.randomID();
			let presetTitle = $presets.find(`#${MODULE.ID}-preset-title`).val();

			$(element).find('#module-list li.package  input[type="checkbox"]:checked').each((index, module) => {
				let moduleName = $(module).closest('li').data('module-name');
				modules.push({
					name: moduleName,
					title: game.modules.get(moduleName)?.data?.title ?? moduleName
				});
			})

			if ($presets.hasClass('adding-preset')) {
				$presets.find(`#${MODULE.ID}-preset-options`).append(`<option value="${presetKey}">${presetTitle}</option>`);
				$presets.find(`#${MODULE.ID}-preset-options`).val(presetKey);
			}else{
				presetKey = $presets.find(`#${MODULE.ID}-preset-options`).val();
				presetTitle = $presets.find(`#${MODULE.ID}-preset-options option:selected`).text();
			}

			$presets.find(`#${MODULE.ID}-save-preset`).prop('disabled', true).html('<i class="fas fa-circle-notch fa-spin"></i>');
			MODULE.setting('presets', mergeObject(MODULE.setting('presets'), { 
				[presetKey]: {
					"name": presetTitle,
					"modules": modules
				}  
			}, { inplace: false })).then((response) => {
				$presets.find(`#${MODULE.ID}-save-preset`).html('<i class="fas fa-check"></i>');
				setTimeout(() => {
					$(event.target).closest(`#${MODULE.ID}-presets`).removeClass('adding-preset');
					$presets.find(`#${MODULE.ID}-preset-options`).trigger('change');
					
					$presets.find(`#${MODULE.ID}-save-preset`).prop('disabled', false).html('<i class="far fa-save"></i>');
				}, 500);
			});
		});

		// Export
		$presets.find(`#${MODULE.ID}-export-preset`).on('click', (event) => {
			event.preventDefault();
			new ExportDialog($(element).find('#module-list li.package')).render(true);
		});

		// Import
		$presets.find(`#${MODULE.ID}-import-preset`).on('click', (event) => {
			event.preventDefault();
			$('<input type="file">').on('change', (event) => {
				const fileData = event.target.files[0];
				// Check if User Selected a File.
				if (!fileData) return false; 
				// Check if User Selected JSON File
				if (fileData.type != 'application/json') {
					ui.notifications.error(`<strong>${MODULE.TITLe}</strong> Please select a JSON file.`);
					return false;
				}

				// Read File Data
				readTextFromFile(fileData).then(async (response) => {
					try {
						// Convert Response into JSON
						const responseJSON = JSON.parse(response);
						let moduleData = {};
						let importType = MODULE.ID;

						// Check if Import is for TidyUI
						if (responseJSON.hasOwnProperty('activeModules') ?? false) {
							importType = 'tidy-ui_game-settings';
							responseJSON.activeModules.forEach((module, index) => {								
								moduleData[module.id] = {
									title: module.title,
									version: module.version,
									settings: {
										client: undefined,
										world: undefined
									}
								}
							})
						}else if (responseJSON?.[Object.keys(responseJSON)[0]]?.hasOwnProperty('title') ?? false) {
							moduleData = responseJSON;
						}else{
							ui.notifications.error(`<strong>${MODULE.TITLe}</strong> Unable to determine how to load file.`);
							return false;
						}

						// Show Import Dialog
						new ImportDialog(moduleData, importType).render(true);
					} catch (error) {
						MODULE.error('Failed to read selected file', error);
						ui.notifications.error(`<strong>${MODULE.TITLe}</strong> Failed to read selected file.`);
						return false;
					}
				})
			}).trigger('click');
			//new ImportDialog({}).render(true);
		});

		$(element).find('.list-filters').before($presets);

		// Terrible Fix - Breaks all UI modification
		$(element).find('#module-list').css({
			'max-height': 'calc(600px - 42px)'
		});
	}

	static renderModuleManagement = (ModuleManagement, element, options) => {
		let $element = $(element);

		/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
		// Module Management+ Adjustments
		/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
		// Auto Focus Filter Modules On Load
		$element.find('.list-filters input[type="text"]').focus();

		// If user does not have Access, Filter to show only active modules and hide
		if (!game.permissions.SETTINGS_MODIFY.includes(game.user.role)) {
			$element.find('.list-filters .filter[data-filter="active"]').trigger('click');
			$element.find('.list-filters .filter[data-filter="active"]').remove();
			$element.find('#module-list .package .package-title input[type="checkbox"]').remove();
		}else{
			$element.find('.list-filters .filter[data-filter="all"]').text($element.find('.list-filters .filter[data-filter="all"]').text().replace('Modules', ''));
			$element.find('.list-filters .filter[data-filter="active"]').text($element.find('.list-filters .filter[data-filter="active"]').text().replace('Modules', ''));
			$element.find('.list-filters .filter[data-filter="inactive"]').text($element.find('.list-filters .filter[data-filter="inactive"]').text().replace('Modules', ''));
			$element.find('.list-filters').prepend(`<button type="button" class="toggle-modules" title="Indeterminate">
				<i class="far fa-minus-square"></i>
			</button>`);

			// Add Toggle 
			function getModuleStatus() {
				let modules = $element.find('.package .package-title input[type="checkbox"]').length;
				let activeModules = $element.find('.package .package-title input[type="checkbox"]:checked').length;
				
				if (modules == 0) $element.find('.list-filters button.toggle-modules').html('<i class="far fa-square"></i>');
				else if (modules == activeModules) $element.find('.list-filters button.toggle-modules').html('<i class="far fa-check-square"></i>');
				else if (activeModules == 0) $element.find('.list-filters button.toggle-modules').html('<i class="far fa-square"></i>'); 
				else $element.find('.list-filters button.toggle-modules').html('<i class="far fa-minus-square"></i>');
			}

			$element.find('.list-filters button.toggle-modules').on('click', (event) => {
				let modules = $element.find('.package .package-title input[type="checkbox"]').length;
				let activeModules = $element.find('.package .package-title input[type="checkbox"]:checked').length;

				$element.find(`.package input[type="checkbox"]`).prop('checked', modules > activeModules);
				$element.find(`.package input[type="checkbox"]`).toggleClass('active', modules > activeModules);
				//$element.find(`.package input[type="checkbox"]`).trigger('change');

				getModuleStatus();				
			});

			$element.find(`.package input[type="checkbox"]`).on('change', getModuleStatus);


			// Adds the Ability to save Presets
			this.addModulePresets(element);
			//$element.find('p.notes').css('display', 'none');
		}

		$element.find('.list-filters button.expand').on('click', (event) => {
			let toggleState = $element.find('.list-filters button.expand').attr('title') == game.i18n.localize('Collapse');
			$element.find('.package-list .package .package-overview .expand').toggleClass('expanded', toggleState)
		});

		// Add Clear Text Button when user has typed content into filter
		$element.find('.list-filters input[type="text"]').on('keyup', (event) => {
			if ($(event.target).val().length > 0) {
				if ($(event.target).next('button.far').length == 0) {
					$(event.target).after('<button class="far fa-times-circle"></button>');
					$(event.target).next('button.far').css({
						position: `absolute`,
						left: `${$(event.target).width()}px`
					})
				}
			}else{
				$(event.target).next('button.far').remove();
			}
		});
		// When user clicks on filter, Clear text and reset filter
		$element.find('.list-filters').on('click', 'button.far', (event) => {
			$element.find('.list-filters input[type="text"]').val('');
			$element.find('.list-filters input[type="text"]').trigger('keyup');
			$element.find('.list-filters .filter[data-filter].active').trigger(`click`);
		})


		// Add Stripped Rows | Click active option
		$element.find('.list-filters .filter[data-filter]').on(`click.${MODULE.ID}`, (event) => {
			$("#module-management #module-list .package").removeClass('even');

			let isEven = true;
			$("#module-management #module-list .package").each((index, modulePackage) => {
				if (!$(modulePackage).hasClass('hidden')) {
					$(modulePackage).toggleClass('even', !isEven);
					isEven = !isEven;
				}
			})
		})
		// Trigger Stripped Effect when Module Management Window Loaded
		Hooks.once('renderApplication', () => {
			$element.find('.list-filters .filter[data-filter]').eq(0).trigger(`click.${MODULE.ID}`);
		});

		// Hook into Tidy UI Disable All
		$element.on(`click.${MODULE.ID}`, `.enhanced-module-management .disable-all-modules`, (event) => {
			var checkbox = $element.find(`.package[data-module-name="${MODULE.ID}"] input[type="checkbox"]`);
			checkbox.prop("checked", true);
		});

		// Remove Binds when Menu Closes
		Hooks.once('closeModuleManagement', () => {
			$element.find('.list-filters .filter[data-filter]').off(`click.${MODULE.ID}`);
			$element.off(`click.${MODULE.ID}`);
		})

		// Fix Module Tags
		for (const [key, module] of this.packages) {
			let $package = $element.find(`.package[data-module-name="${key}"]`);

			/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
			// UPDATE AND ADD NEW TAGS
			/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
			// Fix Version and Compatibility Risk Tags
			this.fixModuleTags($package);
			
			// Add Readme and Changelog Tags
			if (this.packages.get(key)?.readme) this.addPackageTag($package, 'readme', () => {
				new PreviewDialog({
					[key]: {
						hasSeen: false,
						title: game.modules.get(key).data.title,
						version: game.modules.get(key).data.version
					}
				}, 'readme').render(true);
			});
			if (this.packages.get(key)?.changelog) this.addPackageTag($package, 'changelog', () => {
				new PreviewDialog({
					[key]: {
						hasSeen: false,
						title: game.modules.get(key).data.title,
						version: game.modules.get(key).data.version
					}
				}, 'changelog').render(true)
			});

			// Add Issues Link | Support for 🐛 Bug Reporter Support
			if (this.bugReporterSupport(module)) {
				// Force Module to register allowBugReporter as True
				game.modules.get(key).data.flags.allowBugReporter = true;
				this.addPackageTag($package, 'issues bug-reporter', () => {
					game.modules.get("bug-reporter").api.bugWorkflow(key);
				});
			}
			if (this.packages.get(key)?.bugs ?? false) {
				this.addPackageTag($package, 'issues', this.packages.get(key).bugs);
			}

			
			if (this.packages.get(key)?.socket ?? false) {
				this.addPackageTag($package, 'socket');
			}
			if (this.packages.get(key)?.library ?? false) {
				this.addPackageTag($package, 'library');
			}

			// Add Authors Tag
			let authors = this.packages.get(key).authors;
			if (authors.length > 0) {
				let authorClasses = `author ${authors.length < 3 ? 'authors-' + authors.length : 'authors' }`;
				this.addPackageTag($package, authorClasses, 'popover', {
					content: this.buildAuthorTooltip(authors)[0],
					allowHTML: true,
					trigger: 'click',
					interactive: true,
				});
			}

			// Add Info Toggle
			let $expandButton = $(`<button type="button" class="expand" title="Expand">
				<i class="fa fa-angle-double-up"></i>
			</button>`).on('click', (event) => {
				$package.find('.package-overview button.expand').toggleClass('expanded');
				$package.find('.package-description').toggleClass('hidden', !$package.find('.package-overview button.expand').hasClass('expanded'))
			})
			$package.find('.package-overview').append($expandButton);
		}

		/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
		// REGISTER CONFLICTS AND KNOWN ISSUES
		/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
		for (let key in this.conflicts) {
			let conflict = this.conflicts[key];
			let moduleIDs = key.split('^');

			// Handle if conflict is with foundry
			moduleIDs[0] = moduleIDs[0].replace('|foundry', '');

			// Add Conflict Icon to Package
			let $tooltipContent = null;
			moduleIDs.forEach((moduleID) => {
				let $package = $element.find(`.package[data-module-name="${moduleID}"]`);
				if ($package.find(`.package-title .${MODULE.ID}-conflict`).length == 0) { 
					$package.find('.package-title input').after(`<span class="${MODULE.ID}-conflict">
						<i class="fas fa-exclamation-triangle"></i>
					</span>`);

					tippy($package.find(`.package-title .${MODULE.ID}-conflict`)[0], {
						content: 'Loading...',
						onShow: (instance) => {
							instance.setContent($(instance.reference).data('tooltip-content'));
						},
						allowHTML: true
					})
				}				
			});

			const getTypeHeading = (type, options) => {
				if (type == 'module' || type == 'conflict') return `Conflict with ${options.title}`;
				else if (type == 'foundry') return 'Incompatible Foundry Version'
				else return 'Known Issues';
			}

			if (conflict.type == 'foundry') {
				$element.find(`.package[data-module-name="${moduleIDs[0].replace('|foundry')}"] .tag.unknown`).addClass('error');
				if ((game.modules.get(moduleIDs[0])?.data?.flags?.MMP?.enableFoundryConfirm ?? false)) {
					$element.find(`.package[data-module-name="${moduleIDs[0]}"] input`).on('change', (event) => {
						if ($(event.target).is(':checked')) {
							Dialog.confirm({
								title: 'Would you like to enable this module?', 
								content: `<p><strong>Incompatible Foundry Version</p></strong>` + MODULE.markup(conflict.description.join("\n\n")), 
								yes: (event) => { return true }, 
								no: (event) => { 
									$element.find(`.package[data-module-name="${moduleIDs[0]}"] input`).trigger('click');
									return false; 
								},
								rejectClose: true
							}).catch((event) => {
								// User closed Dialog, They did not cofirm enabling the module, disable it.
								$element.find(`.package[data-module-name="${moduleIDs[0]}"] input`).trigger('click');
							})
						}
					})
				}
			}

			let htmlTitle = `<h3>${getTypeHeading(conflict.type, game.modules.get(moduleIDs[1])?.data ?? false)}</h3>`;
			let htmlContent = '';
			conflict.description.forEach((description) => {
				if (description) htmlContent += MODULE.markup(description.toString());
			});

			let $packTooltip = $element.find(`.package[data-module-name="${moduleIDs[0]}"] .package-title .${MODULE.ID}-conflict`);
			$packTooltip.data('tooltip-content', ($packTooltip.data('tooltip-content') ?? '') + `${htmlTitle}${htmlContent}`);
			
			if (moduleIDs.length > 1) {
				htmlTitle = `<h3>Conflict with ${game.modules.get(moduleIDs[0]).data.title}</h3>`;
				$packTooltip = $element.find(`.package[data-module-name="${moduleIDs[1]}"] .package-title .${MODULE.ID}-conflict`);
				$packTooltip.data('tooltip-content', ($packTooltip.data('tooltip-content') ?? '') + `${htmlTitle}${htmlContent}`);
			}
		}

		// HIDE TOOLTIPS WHEN USER SCROLLS IN MODULE LIST
		$("#module-management #module-list").on('scroll', (event) => {
			tippy.hideAll();
		 });
	}

	static renderSettingsConfig = (SettingsConfig, element, options) => {
		let $element = $(element);

		let $settings = $element.find(`[data-tab="modules"] h2.module-header:contains("${MODULE.TITLE}")`);

		// Add Button to Settings Window
		$settings.next('.form-group').before(`<div class="form-group submenu">
				<label>${MODULE.localize('settings.resetDialog.name')}</label>
				<button type="button" data-action="${MODULE.ID}-reset-tracked-changelogs">
					<i class="fas fa-eraser"></i>
					<label>${MODULE.localize('settings.resetDialog.button')}</label>
				</button>
				<p class="notes">${MODULE.localize('settings.resetDialog.hint')}</p>
			</div>`);
		
		$element.find(`button[data-action="${MODULE.ID}-reset-tracked-changelogs"]`).on('click', (event) => {
			Dialog.confirm({
				title: MODULE.localize('settings.resetDialog.name'), 
				content: MODULE.localize('settings.resetDialog.hint'), 
				yes: (event) => { 
					MODULE.setting('trackedChangelogs', {}).then(response => response).then((settingValue) => {
						MODULE.debug(this.getTrackedChangelogs());
					})
				}, 
				no: (event) => { return false; }
			})
		})
	}
}