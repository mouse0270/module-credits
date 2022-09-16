// GET REQUIRED LIBRARIES
import './libraries/popper.min.js';
import './libraries/tippy.umd.min.js';

// GET MODULE CORE
import { MODULE } from './_module.mjs';
import { PreviewDialog } from './dialogs/preview.mjs';
import { ExportDialog } from './dialogs/export.mjs';
import { ImportDialog } from './dialogs/import.mjs';
import { PresetDialog } from './dialogs/presets.mjs';

// IMPORT SETTINGS -> Settings Register on Hooks.Setup
import './_settings.mjs';

// DEFINE MODULE CLASS
export class MMP {
	static socket = false;

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
			&& moduleData?.flags?.allowBugReporter
		);
	}

	// MODULE SUPPORT FOR || socketlib ||
	static registerSocketLib = () => {
		this.socket = socketlib.registerModule(MODULE.ID);
		this.socket.register("useFilePicker", this.useFilePicker);
		this.socket.register("setUserSetting", this.setUserSetting);
		this.socket.register("getGMSetting", this.getGMSetting)
	}
	
	static async getGMSetting({moduleId, settingName}) {
		return await game.settings.get(moduleId, settingName);
	}

	static async setUserSetting({moduleId, settingName, settingValue}) {
		MODULE.log('RECIEVED SETTING', moduleId, settingName, settingValue, game.settings.settings.get(`${moduleId}.${settingName}`).name);
		const setSetting = (moduleId, settingName, settingValue) => {
			game.settings.set(moduleId, settingName, settingValue).then(response => {
				location.reload();
				return response;
			})
		}

		if (MODULE.setting('disableSyncPrompt')) {
			return await setSetting(moduleId, settingName, settingValue); 
		}else{
			return await Dialog.confirm({
				title: MODULE.localize('title'),
				content: `<p style="margin-top:0px;">Allow Your Game master to set the following setting for you</p> 
					<p>${game.i18n.localize(game.settings.settings.get(moduleId +'.' + settingName).name)}<br/>
					${game.i18n.localize(game.settings.settings.get(moduleId +'.' + settingName).hint)}</p>`,
				yes: () => {
					return setSetting(moduleId, settingName, settingValue);
				},
				no: () => {
					return 'Player Rejected Setting'
				}
			});
		}
	}

	// DEFINE API
	static installAPI = () => {
		game.modules.get(MODULE.ID).API = {
			getContent: async (module, fileType, options = {dir: 'modules'}) => {
				let getFiles = await this.checkIfFilesExists(`./${options.dir}/${module.id}/`, { extensions: ['.md'] });
				let selectedFile = getFiles ? getFiles.filter(file => file.toLowerCase().endsWith(`${fileType}.md`.toLowerCase()))[0] : false;

				if (selectedFile == false || selectedFile == undefined) {
					return await this.getGithubMarkdown(module[fileType.toLowerCase()])
				}

				return await this.getFile(selectedFile);
			}
		}
	}

	static init = () => {
		this.installAPI();

		this.getChangelogs();
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
		}).catch(error => {
			MODULE.debug(error);
			return false;
		})
	}

	static async getGithubMarkdown(url) {// Supported Remote APIs
		const APIs = {
			github: /https?:\/\/github.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/blob\/[^/]+\/(?<path>.*)/,
			rawGithub: /https?:\/\/raw.githubusercontent.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/master\/(?<path>.*)/
		}
		if (url.match(APIs.github) || url.match(APIs.rawGithub)) {
			const { user, repo, path } = (url.match(APIs.github) ?? url.match(APIs.rawGithub)).groups;
			return await fetch(`https://api.github.com/repos/${user}/${repo}/contents/${path}`).then(response => {
				if (response.status >= 200 && response.status <= 299) {
					try {
						return response.json();
					}catch (error) {
						throw TypeError("unable to fetch file content");
					}
				}
				throw TypeError("unable to fetch file content");
			}).then(response => {
				return atob(response.content)
			}).catch(error => {
				MODULE.debug(error);
				return false;
			})
		}
	}

	static getModuleProperty(moduleID, property) {
		if (property.lastIndexOf('.') == -1) property = '.' + property;
		const indexOfProperty = property.lastIndexOf('.') >= 0 ? property.lastIndexOf('.') : 0;
		let flagsPath = (property.slice(0, indexOfProperty) + '.flags.' + property.slice(indexOfProperty + 1)).substring(1);

		return foundry.utils.getProperty(game.modules.get(moduleID), property.substring(1)) ?? foundry.utils.getProperty(game.modules.get(moduleID), flagsPath) ?? false;
	}

	static async cleanUpRemovedChangelogs() {
		let trackedChangelogs = MODULE.setting('trackedChangelogs');

		for (const [key, module] of Object.entries(trackedChangelogs)) {
			if (!game.modules.has(key) ?? false) {
				MODULE.debug(`${module.title} is no longer installed, remove from tracked changelogs`);
				delete trackedChangelogs[key];
			}
		}

		return await MODULE.setting('trackedChangelogs', trackedChangelogs);
	}

	static async getChangelogs() {
		for await (const [key, module] of game.modules.entries()) {
			//let module = game.modules.get(key);
			// Get Files From Server
			let getFiles = await MMP.checkIfFilesExists(`./modules/${key}/`, { extensions: ['.md'] });
			let changelog = getFiles ? getFiles.filter(file => file.toLowerCase().endsWith('CHANGELOG.md'.toLowerCase()))[0] : false;

			// Track Changelogs
			// Check if version is newer then saved.
			if (changelog && game.user.isGM) {
				let version = module?.version != 'This is auto replaced' ? module?.version : '0.0.0' ?? '0.0.0'
				let hasSeen = MODULE.setting('trackedChangelogs')?.[key]?.hasSeen ?? false;
				if (isNewerVersion(version ?? '0.0.0', MODULE.setting('trackedChangelogs')?.[key]?.version ?? '0.0.0')) {
					MODULE.debug(`${module.title} is newer then last seen, set hasSeen to false`);
					hasSeen = false;
				}
				await MODULE.setting('trackedChangelogs', foundry.utils.mergeObject(MODULE.setting('trackedChangelogs'), {
					[key]: {
						title: module?.title,
						version: version ?? '0.0.0',
						hasSeen: hasSeen,
						type: 'CHANGELOG'
					}
				}));
			}
		};

		// Clean Up changelogs
		await this.cleanUpRemovedChangelogs();
		
		// If the user is the GM and has show New Changelogs on Load
		if (MODULE.setting('showNewChangelogsOnLoad') && game.user.isGM) {
			let unSeenChangelogs = Object.keys(MODULE.setting('trackedChangelogs')).reduce((result, key) => {    
				if (!MODULE.setting('trackedChangelogs')[key].hasSeen) result[key] = MODULE.setting('trackedChangelogs')[key];
				return result;
			}, {});
			if (Object.keys(unSeenChangelogs).length >= 1) new PreviewDialog(unSeenChangelogs).render(true);
		}
	}

	/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
	// F### Your Emoji (Better Title Sorting)
	// ? Needs to be rewritten to use plain JS
	/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
	static screwYourEmoji(elements, titleSelector) {
		$(elements).each((index, element) => {
			$(element).attr('data-sort-title', $(element).find(titleSelector).text().toUpperCase().replace(/[^\w]/gi, ''));
		});

		// Sort Elements and Append To parent to Replace Order
		$(elements).sort((firstEl, secondEl) => {
			return $(secondEl).attr('data-sort-title') < $(firstEl).attr('data-sort-title') ? 1 : -1
		}).appendTo($(elements).parent())
	}

	static async renderModuleManagement(ModuleManagement, elem, options) {
		// Supported Remote APIs
		const APIs = {
			github: /https?:\/\/github.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/blob\/[^/]+\/(?<path>.*)/,
			rawGithub: /https?:\/\/raw.githubusercontent.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/master\/(?<path>.*)/
		}

		// Set elem to first element
		elem = elem[0];

		// Check for Big Picture Mode
		if (MODULE.setting('bigPictureMode')) elem.classList.add(`${MODULE.ID}-big-picture-mode`);

		/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
		// F### Your Emoji (Better Title Sorting)
		// ? Needs to be rewritten to use plain JS
		/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
		MMP.screwYourEmoji($(elem).find('#module-list .package'), '.package-title');

		// Focus on Filter
		elem.querySelector('nav.list-filters input[type="search"]').focus();

		if (game.user.isGM) {
			// Add Presets Button
			elem.querySelector('nav.list-filters').insertAdjacentHTML('afterbegin', `<button type="button" class="" data-action="presets" data-tooltip="${MODULE.localize('tooltips.managePresets')}">
				<i class="fa-solid fa-list-check"></i>
			</button>`);
			elem.querySelector('nav.list-filters button[data-action="presets"]').addEventListener('click', (event) => {
				new PresetDialog().render(true);
			});

			// Add Export Button
			elem.querySelector('nav.list-filters button.expand').insertAdjacentHTML('beforebegin', `<button type="button" class="" data-action="export" data-tooltip="${MODULE.localize('tooltips.exportModules')}">
				<i class="fa-solid fa-download"></i>
			</button>`);
			elem.querySelector('nav.list-filters button[data-action="export"]').addEventListener('click', (event) => {
				new ExportDialog(elem.querySelectorAll('#module-list li.package')).render(true);
			})

			// Add Import Button
			// ? Update import logic to be pure javascript
			elem.querySelector('nav.list-filters button.expand').insertAdjacentHTML('beforebegin', `<button type="button" class="" data-action="import" data-tooltip="${MODULE.localize('tooltips.importModules')}">
				<i class="fa-solid fa-upload"></i>
			</button>`);
			elem.querySelector('nav.list-filters button[data-action="import"]').addEventListener('click', (event) => {
				$('<input type="file">').on('change', (event) => {
					const fileData = event.target.files[0];
					// Check if User Selected a File.
					if (!fileData) return false; 
					// Check if User Selected JSON File
					if (fileData.type != 'application/json') {
						ui.notifications.error(`<strong>${MODULE.TITLE}</strong> Please select a JSON file.`);
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
								ui.notifications.error(`<strong>${MODULE.TITLE}</strong> Unable to determine how to load file.`);
								return false;
							}

							// Show Import Dialog
							new ImportDialog(moduleData, importType).render(true);
						} catch (error) {
							MODULE.error('Failed to read selected file', error);
							ui.notifications.error(`<strong>${MODULE.TITLE}</strong> Failed to read selected file.`);
							return false;
						}
					})
				}).trigger('click');
				//new ImportDialog({}).render(true);
			});

			// Convert Filters To Dropdown
			if (elem.querySelectorAll(`nav.list-filters a.filter`)?.length > 0 ?? false) {
				elem.querySelector('nav.list-filters input[type="search"]').insertAdjacentHTML('afterend', `<select data-action="filter"></select>`);
				elem.querySelectorAll('nav.list-filters a.filter').forEach(filterOpt => {
					elem.querySelector('nav.list-filters select[data-action="filter"]').insertAdjacentHTML('beforeend', `<option value="${filterOpt.dataset.filter}">${filterOpt.innerHTML}</option>`)
				});
				elem.querySelector(`nav.list-filters select[data-action="filter"]`).value = elem.querySelector('nav.list-filters a.filter.active').dataset.filter;
				elem.querySelector(`nav.list-filters select[data-action="filter"]`).addEventListener('change', event => {
					elem.querySelector(`nav.list-filters a.filter[data-filter="${event.target.value}"]`).click();
				})
			}
		}

		// Get Modules with Settings
		let hasSettings = {};
		let settings = game.settings.settings.values();
		for (let setting of settings) {
			if (setting.namespace != 'core' && setting.namespace != game.system.id && setting.config)
			hasSettings[setting.namespace] = true;
		}

		// Loop Through Modules
		const isURL = (url) => { try { new URL(url); return true; } catch { return false; }};
		const getContent = (key, value) => {
			if (isURL(value)) {
				const domain = value.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)\./i)[1]?.toLowerCase() ?? value;
				const tagType = supportedAuthorTags.hasOwnProperty(domain) ? domain : key;
				const urlDisplay = value.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)\./i)[1] ?? key;
				return `<li><a href="${value}" target="_blank">${supportedAuthorTags[tagType]?.icon ?? ''}${tagType == 'url' ? urlDisplay : tagType}</a></li>`;
			}else if (['twitter', 'patreon', 'github', 'reddit', 'ko-fi'].includes(key)) {
				return `<li><a href="https://www.${key}.com/${value}" target="_blank">${supportedAuthorTags[key]?.icon ?? ''}${key}</a></li>`;
			}else{
				return `<li><div>${supportedAuthorTags[key]?.icon ?? ''}${value}</div></li>`;
			}
		}
		const supportedAuthorTags = {
			email: {
				icon: '<i class="fa-solid fa-envelope"></i>'
			},
			url: {
				icon: '<i class="fa-solid fa-link"></i>'
			},
			discord: {
				icon: '<i class="fa-brands fa-discord"></i>'
			},
			twitter: {
				icon: '<i class="fa-brands fa-twitter"></i>'
			},
			patreon: {
				icon: '<i class="fa-brands fa-patreon"></i>'
			},
			github: {
				icon: '<i class="fa-brands fa-github"></i>'
			},
			'ko-fi': {
				icon: '<i class="fa-solid fa-mug-hot"></i>'
			},
			reddit: {
				icon: '<i class="fa-brands fa-reddit"></i>'
			}
		}
		for await (const elemPackage of elem.querySelectorAll('#module-list > li.package')) {
		//elem.querySelectorAll('#module-list > li.package').forEach((elemPackage) => {
			let moduleKey = elemPackage.dataset.moduleId;
			let moduleData = game.modules.get(moduleKey);

			// Get Files From Server
			let getFiles = await MMP.checkIfFilesExists(`./modules/${moduleData.id}/`, { extensions: ['.md'] });
			// Assign Files to Variables
			let readme = getFiles ? getFiles.filter(file => file.toLowerCase().endsWith('README.md'.toLowerCase()))[0] : false;
			let changelog = getFiles ? getFiles.filter(file => file.toLowerCase().endsWith('CHANGELOG.md'.toLowerCase()))[0] : false;
			let attributions = getFiles ? getFiles.filter(file => file.toLowerCase().endsWith('ATTRIBUTIONS.md'.toLowerCase()))[0] : false;
			// Get License File
			let license = false; // Foundry File Picker Does not Display this File

			// Add Setting Tag if Module has Editable Tags
			if (hasSettings?.[moduleKey] ?? false) {
				elemPackage.querySelector('.package-overview').insertAdjacentHTML('beforeend', `<span class="tag settings" data-tooltip="${game.i18n.translations.SETTINGS.Configure}" aria-describedby="tooltip">
					<i class="fa-solid fa-gear"></i>
				</span>`);
			}
			// Add Authors Tag
			if (moduleData?.authors.size >= 1 ?? false) {
				elemPackage.querySelector('.package-overview').insertAdjacentHTML('beforeend', `<span class="tag authors" data-tooltip="${MODULE.localize("tags.authors")}" aria-describedby="tooltip">
					<i class="fa-solid ${moduleData?.authors.size == 1 ? 'fa-user' : 'fa-users'}"></i>
				</span>`);
				let elements = [];
				let outputList = "";
				moduleData?.authors.forEach(author => {
					outputList += `<li class="author">${author?.name ?? 'UNKNOWN'}</li>`;
					Object.keys(author).forEach((key) => {
						if (key != "name" && key != 'flags' && typeof author[key] != "undefined") {
							outputList += getContent(key, author[key]);
						}else if (key == 'flags') {
							Object.keys(author[key]).forEach((flagKey) => {
								outputList += getContent(flagKey, author[key][flagKey]);
							});
						}
					})
				});
				tippy(elemPackage.querySelector('.package-overview span.tag.authors'), {
					content: `<ul class="${MODULE.ID}-tippy-authors">${outputList}</ul>`,
					allowHTML: true,
					interactive: true,
					trigger: 'click',
				});
			}

			// Add ReadMe Tag
			if (readme || ((MMP.getModuleProperty(moduleData.id, 'readme') || "").match(APIs.github) ?? false) || ((MMP.getModuleProperty(moduleData.id, 'readme') || "").match(APIs.rawGithub) ?? false)) {
				elemPackage.querySelector('.package-overview').insertAdjacentHTML('beforeend', `<span class="tag readme" data-tooltip="${MODULE.localize("tags.readme")}" aria-describedby="tooltip">
					<i class="fa-solid fa-circle-info"></i>
				</span>`);
				elemPackage.querySelector('.package-overview span.tag.readme').addEventListener('click', (event) => {
					new PreviewDialog({
						[moduleKey]: {
							hasSeen: false,
							title: moduleData.title ?? '',
							version: moduleData.version ?? '0.0.0',
							type: 'README'
						}
					}).render(true);
				})
			}
			// Add Changelog Tag
			if (changelog || ((MMP.getModuleProperty(moduleData.id, 'changelog') || "").match(APIs.github) ?? false) || ((MMP.getModuleProperty(moduleData.id, 'changelog') || "").match(APIs.rawGithub) ?? false)) {
				elemPackage.querySelector('.package-overview').insertAdjacentHTML('beforeend', `<span class="tag changelog" data-tooltip="${MODULE.localize("tags.changelog")}" aria-describedby="tooltip">
					<i class="fa-solid fa-list"></i>
				</span>`);
				elemPackage.querySelector('.package-overview span.tag.changelog').addEventListener('click', (event) => {
					new PreviewDialog({
						[moduleKey]: {
							hasSeen: false,
							title: moduleData.title ?? '',
							version: moduleData.version ?? '0.0.0',
							type: 'CHANGELOG'
						}
					}).render(true);
				})
			}
			// Add Attributions Tag
			if (attributions || ((MMP.getModuleProperty(moduleData.id, 'attributions') || "").match(APIs.github) ?? false) || ((MMP.getModuleProperty(moduleData.id, 'attributions') || "").match(APIs.rawGithub) ?? false)) {
				elemPackage.querySelector('.package-overview').insertAdjacentHTML('beforeend', `<span class="tag attributions" data-tooltip="${MODULE.localize("tags.attributions")}" aria-describedby="tooltip">
					<i class="fa-brands fa-creative-commons-by"></i>
				</span>`);
				elemPackage.querySelector('.package-overview span.tag.attributions').addEventListener('click', (event) => {
					new PreviewDialog({
						[moduleKey]: {
							hasSeen: false,
							title: moduleData.title ?? '',
							version: moduleData.version ?? '0.0.0',
							type: 'ATTRIBUTIONS'
						}
					}).render(true);
				})
			}
			// Add Website Tag
			if (MMP.getModuleProperty(moduleData.id, 'url') ?? false) {
				elemPackage.querySelector('.package-overview').insertAdjacentHTML('beforeend', `<a href="${MMP.getModuleProperty(moduleData.id, 'url')}" class="tag website" data-tooltip="${MODULE.localize("tags.url")}" aria-describedby="tooltip" target="_blank">
					<i class="fa-solid fa-link"></i>
				</a>`);
			}
			// Add Issues Link | Support for 🐛 Bug Reporter Support
			if (MMP.bugReporterSupport(moduleData)) {
				elemPackage.querySelector('.package-overview').insertAdjacentHTML('beforeend', `<span class="tag issues bug-reporter" data-tooltip="${MODULE.localize("tags.bugReporter")}" aria-describedby="tooltip" target="_blank">
					<i class="fa-solid fa-bug"></i>
				</span>`);
			}else if (MMP.getModuleProperty(moduleData.id, 'bugs') ?? false) {
				elemPackage.querySelector('.package-overview').insertAdjacentHTML('beforeend', `<a href="${MMP.getModuleProperty(moduleData.id, 'bugs')}" class="tag issues" data-tooltip="${MODULE.localize("tags.issues")}" aria-describedby="tooltip" target="_blank">
					<i class="fa-brands fa-github"></i>
				</a>`);
			}
			// Add Socket Tag
			if (moduleData?.socket ?? false) {
				elemPackage.querySelector('.package-overview').insertAdjacentHTML('beforeend', `<span class="tag socket" data-tooltip="${MODULE.localize("tags.socket")}" aria-describedby="tooltip" >
					<i class="fa-solid fa-plug"></i>
				</span>`);
			}
			// Add Library Tag
			if (moduleData?.library ?? false) {
				elemPackage.querySelector('.package-overview').insertAdjacentHTML('beforeend', `<span class="tag library" data-tooltip="${MODULE.localize("tags.library")}" aria-describedby="tooltip">
					<i class="fa-solid fa-book"></i>
				</span>`);
			}

			const addConflict = (module, conflict) => {
				let conflictElem = elem.querySelector(`#module-list > li.package[data-module-id="${conflict.id}"]`) ?? false;
				if (conflictElem) {
					let content = new DOMParser().parseFromString(conflictElem.querySelector('.conflicts')?.dataset?.tooltip ?? `<ul class='${MODULE.ID}-tooltip-list'></ul>`, "text/html");
					content.querySelector('ul').insertAdjacentHTML('beforeend', `<li><strong>${game.modules.get(module.id).title}</strong><br/>${conflict.reason.replaceAll(`"`, `'`)}</li>`);

					if (conflictElem.querySelectorAll('.package-overview .package-title input[type="checkbox"] + span.conflicts')?.length > 0) {
						conflictElem.querySelector('.package-overview .package-title input[type="checkbox"] + span.conflicts').dataset.tooltip = content.querySelector('ul').outerHTML.replaceAll(`"`, `'`);
					}else{
						conflictElem.querySelector('.package-overview .package-title input[type="checkbox"]').insertAdjacentHTML('afterend', `<span class="conflicts" data-tooltip="${content.querySelector('ul').outerHTML.replaceAll(`"`, `'`)}" aria-describedby="tooltip">
							<i class="fa-solid fa-triangle-exclamation"></i>
						</span>`);
					}
				}
			}

			
			if (moduleData?.relationships?.conflicts?.size > 0) {
				moduleData?.relationships?.conflicts.forEach(conflict => {
					if (game.modules.get(conflict.id) ?? false) {
						// Version Checking
						if ((foundry.utils.isNewerVersion(game.modules.get(conflict.id).version, conflict.compatibility.minimum ?? '0.0.0') || game.modules.get(conflict.id).version == conflict.compatibility.minimum) 
							&& foundry.utils.isNewerVersion(conflict.compatibility.maximum, game.modules.get(conflict.id).version)) {
							addConflict(game.modules.get(conflict.id), foundry.utils.mergeObject(conflict, { id: moduleData.id}, { inplace: false }));
							addConflict(moduleData, conflict);
						}
					}
				});
			}
		}
		
		// Handle if Settings Tag is Clicked
		elem.querySelectorAll('#module-list > li.package .package-overview .tag.settings').forEach((elemPackage) => {
			elemPackage.addEventListener('click', async (pointerEventData) => {
				await game.settings.sheet._render(true);
				let moduleId = elemPackage.closest('li.package').dataset.moduleId;
				let settingSheet = Object.values(ui.windows).find((window) => window.id === "client-settings")?.element[0];
				let filters = settingSheet.querySelector(`aside.sidebar nav.tabs a.category-tab[data-tab="${moduleId}"]`);

				settingSheet.classList.add(`${MODULE.ID}-hide-filter-options`);
				filters.click();
			});
		});
		// Handle if 🐛 Bug Reporter Tags is Clicked
		elem.querySelectorAll('#module-list > li.package .package-overview .tag.issues.bug-reporter').forEach((elemPackage) => {
			elemPackage.addEventListener('click', async (pointerEventData) => {
				let moduleId = elemPackage.closest('li.package').dataset.moduleId;
				game.modules.get("bug-reporter").api.bugWorkflow(moduleId);
			});
		});

		// HIDE TOOLTIPS WHEN USER SCROLLS IN MODULE LIST
		$("#module-management #module-list").on('scroll', (event) => {
			tippy.hideAll();
		 });
	}

	static renderSettingsConfig = (app, elem, options) => {
		// Set elem to first element
		elem = elem[0];

		// Check for Big Picture Mode
		if (MODULE.setting('bigPictureMode')) elem.closest('.app').classList.add(`${MODULE.ID}-big-picture-mode`);

		elem.querySelectorAll('.categories .category .form-group').forEach(settingElem => {
			let settingDetails = null;
			let settingValue = "UNKNOWN"
			if (settingElem.querySelectorAll('input[name],select[name]').length > 0) {
				settingValue = settingElem.querySelectorAll('input[name],select[name]')[0].getAttribute("name");
				settingDetails = game.settings.settings.get(settingElem.querySelectorAll('input[name],select[name]')[0].getAttribute("name"));
			}else if (settingElem.querySelectorAll('button[data-key]').length > 0) {
				settingValue = settingElem.querySelectorAll('button[data-key]')[0].dataset.key;
				settingDetails = game.settings.settings.get(settingElem.querySelectorAll('button[data-key]')[0].dataset.key);
			}

			if (settingDetails ?? false) {
				let settingLabel = settingElem.querySelector('label');
				const settingID = settingLabel.closest('div[data-settings-key]')?.dataset?.settingsKey ?? '';
				// Lock Settings
				const isLocked = (settingID) => {
					return MODULE.setting('lockedSettings').hasOwnProperty(`${(settingID ?? '').replace('.', '_')}`) ?? false;
				}

				if (settingDetails.scope == "client" && game.user.isGM) {
					settingLabel.insertAdjacentHTML('afterbegin', `<i class="fa-solid fa-user" data-tooltip="${MODULE.localize('tooltips.clientSetting')}" data-tooltip-direction="UP"></i>`);
					if (this.socket) {
						settingLabel.insertAdjacentHTML('afterbegin', `<i class="fa-solid fa-arrows-rotate" data-tooltip="${MODULE.localize('tooltips.syncSetting')}" data-tooltip-direction="UP" data-action="sync"></i>`);

						settingLabel.querySelector('[data-action="sync"]').addEventListener('click', (event) => {
							Dialog.confirm({
								title: MODULE.localize('title'),
								content: `<p style="margin-top:0px;">Send this setting to all other users?</p>`,
								yes: () => {
									this.socket.executeForOthers("setUserSetting", {
										moduleId: settingDetails.namespace,
										settingName: settingDetails.key,
										settingValue: game.settings.get(settingDetails.namespace, settingDetails.key)
									});
								},
								no: () => {
									return 'Player Rejected Setting'
								}
							});
						})

						const getActiveUser = () => {
							let syncUsers = [];
							game.users.forEach(user => {
								if (user.active && user.name != game.users.current.name) {
									syncUsers.push({
										name: user.name,
										icon: '',
										condition: game.user.isGM,
										callback: (elem => {
											MODULE.log('Setting Client Setting', this.socket.executeAsUser("setUserSetting", user.id, {
												moduleId: settingDetails.namespace,
												settingName: settingDetails.key,
												settingValue: game.settings.get(settingDetails.namespace, settingDetails.key)
											}));
										})
									})
								}
							});

							return syncUsers;
						}

						new ContextMenu($(settingLabel), '[data-action="sync"]', getActiveUser());
					}
					settingLabel.insertAdjacentHTML('afterbegin', `<i class="fa-solid fa-${isLocked(settingID) ? 'lock' : 'unlock'}" data-tooltip="${isLocked(settingID) ? MODULE.localize('tooltips.unlockSetting') : MODULE.localize('tooltips.lockSetting')}" data-tooltip-direction="UP" data-action="lock"></i>`);
					settingLabel.querySelector('[data-action="lock"]').addEventListener('click', (event) => {
						if (isLocked(settingID)) {
							let lockedSettings = MODULE.setting('lockedSettings');
							delete lockedSettings[`${settingID.replace('.', '_')}`];
							MODULE.setting('lockedSettings', lockedSettings).then(response => {
								MODULE.log('UNLOCKING', response);
								settingLabel.querySelector('[data-action="lock"]').classList.remove('fa-lock');
								settingLabel.querySelector('[data-action="lock"]').classList.add('fa-unlock');
								settingLabel.querySelector('[data-action="lock"]').dataset.tooltip = MODULE.localize('tooltips.lockSetting');
							});
						}else{
							MODULE.setting('lockedSettings', foundry.utils.mergeObject(MODULE.setting('lockedSettings'), {
								[`${settingID.replace('.', '_')}`]: true
							}, { inplace: false })).then(response => {
								MODULE.log('LOCKING', response);
								settingLabel.querySelector('[data-action="lock"]').classList.remove('fa-unlock');
								settingLabel.querySelector('[data-action="lock"]').classList.add('fa-lock');
								settingLabel.querySelector('[data-action="lock"]').dataset.tooltip = MODULE.localize('tooltips.unlockSetting');
							})
						}
					});
				}else if (settingDetails.scope == "client" && !game.user.isGM) {
					if (isLocked(settingID)) {
						settingLabel.closest('.form-group').querySelectorAll('input, select, button').forEach(input => {
							input.disabled = true;
						});
						settingLabel.insertAdjacentHTML('afterbegin', `<i class="fa-solid fa-lock" data-tooltip="${MODULE.localize('tooltips.lockSetting')}" data-tooltip-direction="UP" data-action="lock"></i>`);
					}
				}
				
				if (settingDetails.scope == "world") {
					settingLabel.insertAdjacentHTML('afterbegin', `<i class="fa-regular fa-earth-americas" data-tooltip="${MODULE.localize('tooltips.worldSetting')}" data-tooltip-direction="UP"></i>`);
				}
			}
		})
	}

	static async renderSidebarTab (app, elem, options) {
		if (app.options.id == "settings") {
			// Supported Remote APIs
			const APIs = {
				github: /https?:\/\/github.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/blob\/[^/]+\/(?<path>.*)/,
				rawGithub: /https?:\/\/raw.githubusercontent.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/master\/(?<path>.*)/
			}

			if (MMP.hasPermission && MMP.isGMOnline) {
				elem[0].querySelector('#settings-documentation button:last-child').insertAdjacentHTML('afterend', `<button data-action="changelogs">
					<i class="fa-solid fa-list"></i> Changelogs
				</button>`);

				elem[0].querySelector('#settings-documentation button[data-action="changelogs"]').addEventListener('click', async (event) => {
					let changelogs = await (!game.user.isGM ?  MMP.socket.executeAsGM('getGMSetting', {moduleId: MODULE.ID, settingName: 'trackedChangelogs'}) : MODULE.setting('trackedChangelogs'));
					new PreviewDialog(changelogs).render(true);
				})
			}

			// Get Files From Server
			let getFiles = await MMP.checkIfFilesExists(`./systems/${game.system.id}/`, { extensions: ['.md'] });
			// Assign Files to Variables
			let readme = getFiles ? getFiles.filter(file => file.toLowerCase().endsWith('README.md'.toLowerCase()))[0] : false;
			let changelog = getFiles ? getFiles.filter(file => file.toLowerCase().endsWith('CHANGELOG.md'.toLowerCase()))[0] : false;
			let attributions = getFiles ? getFiles.filter(file => file.toLowerCase().endsWith('ATTRIBUTIONS.md'.toLowerCase()))[0] : false;
			// Get License File
			let license = false; // Foundry File Picker Does not Display this File

			// Cleanup General Information
			elem[0].querySelector('#game-details li.build').classList.add('hidden');
			elem[0].querySelector('#game-details li.version span').innerHTML = `v${game.version}`;

			elem[0].querySelector('#game-details li.system span').innerHTML = `v${game.system.version}`;
			if (readme || changelog || attributions || license) {
				elem[0].querySelector('#game-details li.system').insertAdjacentHTML('afterend', '<li class="system-buttons"></li>');
				if (readme  || ((game.system.readme || "").match(APIs.github) ?? false) || ((game.system.readme || "").match(APIs.rawGithub) ?? false)) {
					elem[0].querySelector('#game-details li.system-buttons').insertAdjacentHTML('beforeend', `<button data-action="readme" data-tooltip="${MODULE.localize('tags.readme')}">
						<i class="fa-solid fa-circle-info"></i> Read Me
					</button>`);
					
					elem[0].querySelector('#game-details li.system-buttons button[data-action="readme"]').addEventListener('click', (event) => {
						new PreviewDialog({
							[game.system.id]: {
								hasSeen: false,
								title: game.system.title ?? 'System',
								version: game.system.version ?? '0.0.0',
								type: 'README',
								isSystem: true
							}
						}).render(true);
					});
				}

				if (changelog  || ((game.system.changelog || "").match(APIs.github) ?? false) || ((game.system.changelog || "").match(APIs.rawGithub) ?? false)) {
					elem[0].querySelector('#game-details li.system-buttons').insertAdjacentHTML('beforeend', `<button data-action="changelog" data-tooltip="${MODULE.localize('tags.changelog')}">
						<i class="fa-solid fa-list"></i> Changelogs
					</button>`);
					
					elem[0].querySelector('#game-details li.system-buttons button[data-action="changelog"]').addEventListener('click', (event) => {
						new PreviewDialog({
							[game.system.id]: {
								hasSeen: false,
								title: game.system.title ?? 'System',
								version: game.system.version ?? '0.0.0',
								type: 'CHANGELOG',
								isSystem: true
							}
						}).render(true);
					});
				}

				if (attributions  || ((game.system.flags.attributions || "").match(APIs.github) ?? false) || ((game.system.flags.attributions || "").match(APIs.rawGithub) ?? false)) {
					elem[0].querySelector('#game-details li.system-buttons').insertAdjacentHTML('beforeend', `<button data-action="attributions" data-tooltip="${MODULE.localize('tags.attributions')}">
						<i class="fa-brands fa-creative-commons-by"></i> Attributions
					</button>`);
					
					elem[0].querySelector('#game-details li.system-buttons button[data-action="attributions"]').addEventListener('click', (event) => {
						new PreviewDialog({
							[game.system.id]: {
								hasSeen: false,
								title: game.system.title ?? 'System',
								version: game.system.version ?? '0.0.0',
								type: 'ATTRIBUTIONS',
								isSystem: true
							}
						}).render(true);
					});
				}
			}

			// Hide Active Modules
			elem[0].querySelector('#game-details li.modules').classList.add('hidden');
		}
	}
}