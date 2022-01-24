// GET REQUIRED LIBRARIES
import './lib/popper.min.js';

// GET MODULE CORE
import { MODULE } from './_module.mjs';

// IMPORT MODULE FUNCTIONALITY
import { ModuleCreditsDialog } from './moduleCreditsDialog.mjs';


export class ModuleCredits {
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

	// MODULE SUPPORT FOR || libThemer ||
	static registerLibThemer = () => {
		let theme = {
			"name": "Module Credits",
			
			"--module-credits-theme": {
				"type": "stylesheet",
				"default": false,
				"style": "./modules/module-credits/styles/lib-themer.css"
			}
		}

		if (game.modules?.get('lib-themer')?.active ?? false) {
			game.modules.get('lib-themer').api.registerTheme(MODULE.ID, theme);
		}
	}

	// MODULE SUPPORT FOR || Changelogs & Conflicts ||
	static polyfillLibChangelogs = () => {
		// Handle for lib-changelogs
		if (!game.modules?.get('lib-changelogs')?.active ?? true) {
			Hooks.once('ready', () => {
				globalThis.libChangelogs = {
					register: (moduleId, markdown, warnLevel = "minor") => {
						this.registerChangelog({
							moduleID: moduleId, 
							changelog: markdown
						})
					},
					registerConflict: (moduleId, conflictingModule, markdown, warnLevel) => {
						this.defineConflict({
							moduleID: moduleId, 
							conflictingModuleID: conflictingModule, 
							description: markdown
						});
					} 
				};

				Hooks.callAll('libChangelogsReady');
			});
		}
	}

	// SUPPORT FOR || manifest-plus ||
	static async maifestPlusSupport() {
		for await (let [key, module] of game.modules) {
			await FilePicker.browse('user', `./modules/${module?.data?.name}/module.json`).then(response => {
				let files = response.files.filter(file => file.toLowerCase().includes(`module.json`));
				if (files.length > 0) {
					return files[0];
				}
				throw TypeError(`${module?.data?.title} could not find module.json file`);
			}).then(file => {
				fetch(file)
				.then(response => response.json())
				.then(data => {
					if (data?.conflicts?.length > 0 ?? false) {
						for (let conflict of data.conflicts) {
							ModuleCredits.defineConflict({
								moduleID: module?.data?.name,
								conflictingModuleID: conflict.name,
								description: conflict?.description ?? null,
								versionMin: conflict?.versionMin ?? 0,
								versionMax: conflict?.versionMax ?? 0,
							})
						}
					}
					// Check if module is deprecated
					if ((data?.deprecated && data?.deprecated?.reason) ?? false) {
						ModuleCredits.defineDeprecatedModule(module?.data?.name, data?.deprecated);
					}
				}).catch(error => console.error(error))
			}).catch((error) => {
				console.log(error);
			});
		}

		//this.cleanUpConflicts();
	}

	//Queue Registration calls
	static queue = [];
	static queueIsRunning = false;

	static async registerChangelog({moduleID, changelog}) {
		// add call to queue
		if (moduleID != null) {
			ModuleCredits.queue.push({ moduleID: moduleID, changelog: changelog});
		}

		// Check if queue is not running
		if (!ModuleCredits.queueIsRunning) {
			// Set queue to running;
			ModuleCredits.queueIsRunning = true;

			// Get Tracked Modules
			let tracker = MODULE.setting('trackedChangelogs');

			// Add Tracked Module
			tracker[ModuleCredits.queue[0].moduleID] = {
				version: game.modules.get(ModuleCredits.queue[0].moduleID).data.version,
				hasSeen: tracker[ModuleCredits.queue[0].moduleID]?.hasSeen ?? false,
				description: ModuleCredits.queue[0]?.changelog ?? null
			}

			await MODULE.setting('trackedChangelogs', tracker);

			// Remove Module from Queue and Stop Queue;
			ModuleCredits.queue.shift();
			ModuleCredits.queueIsRunning = false;

			// If items are in queue
			if (ModuleCredits.queue.length > 0)  {
				ModuleCredits.registerChangelog({moduleID: null});
			}else{
				this.procesStaticChangelogs();
			}
		} 
	}

	static deprecated = {};
	static defineDeprecatedModule = (moduleID, deprecatedData) => {
		ModuleCredits.deprecated[moduleID] = deprecatedData;
	}


	//Define variable to hold conflicts as they don't need to be stored
	static conflicts = [];
	static defineConflict = ({moduleID, conflictingModuleID, description, versionMin, versionMax}) => {
		// Check if modules are exists
		if (game.modules.get(moduleID) ?? false) {
			// Check if conflicting module exists or is null
			if ((typeof conflictingModuleID === 'undefined' || game.modules.get(conflictingModuleID)) ?? false) {
				// get module version
				let moduleVersion = game.modules.get(conflictingModuleID ?? moduleID).data.version;
				// Check version
				if ((isNewerVersion(moduleVersion, versionMin) || moduleVersion == versionMin) && 
					(!isNewerVersion(moduleVersion, versionMax) || versionMax == 0)) {
					ModuleCredits.conflicts.push({
						moduleID: moduleID,
						conflictingModuleID: conflictingModuleID ?? null,
						description: description ?? '*No Details Provided*',
						versionMin: versionMin ?? null,
						versionMax: versionMin ?? null
					});

					
					this.cleanUpConflicts();
				}
			}
		}
	}

	static cleanUpConflicts() {
		let conflictIDS = {}
		let numberOfConflicts = ModuleCredits.conflicts.length;

		while(numberOfConflicts--) {
			let conflict = ModuleCredits.conflicts[numberOfConflicts];
			let keys = [
				`${conflict.moduleID}-${conflict.conflictingModuleID}`,
				`${conflict.conflictingModuleID}-${conflict.moduleID}`
			];

			// Key Exists
			if ((typeof conflictIDS[keys[0]] !== 'undefined' || typeof conflictIDS[keys[1]] !== 'undefined') ?? false) {
				// Add content to existing conflict
				ModuleCredits.conflicts[conflictIDS[keys[0]]].description += `<br /> ${conflict.description}`;

				// Remove Duplicate
				ModuleCredits.conflicts.splice(numberOfConflicts, 1);
			}else{
				conflictIDS[keys[0]] = numberOfConflicts;
			}
		}
	}

	static async fetchGlobalConflicts() {
		fetch('http://foundryvtt.mouse0270.com/module-credits/conflicts.json?time=5')
			.then(response => response.json())
			.then(data => {
				for (let conflict of data) {
					this.defineConflict(conflict);
				}

				//this.cleanUpConflicts();
				$('#sidebar #settings #settings-game button[data-action="modules"]').attr('data-conflicts', ModuleCredits.conflicts.length);
			}).catch(error => console.error(error))
	}

	static api = () => {
		game.modules.get(MODULE.ID).api = {
			registerChangelog: this.registerChangelog,
			defineConflict: this.defineConflict
		}

		// Add Support for Changelogs & Conflicts
		this.polyfillLibChangelogs();
	}

	static updateSettingsTab = ($element) => {
		if ($element.find('#settings #settings-documentation').length >= 1) {
			if ($element.find('#settings #settings-documentation button[data-action="changelog"]').length <= 0) {
				$element.find('#settings #settings-documentation').append(`<button data-action="changelog">
						<i class="fas fa-exchange-alt"></i> Module Changelogs
					</button>`);

				$element.find('#settings #settings-documentation [data-action="changelog"]').off('click');
				$element.find('#settings #settings-documentation [data-action="changelog"]').on('click', event => {
					this.renderChangelog({ showAllModules: true })
				});
			}

			$element.find('#settings #settings-game button[data-action="modules"]').attr('data-conflicts', ModuleCredits.conflicts.length);
		}
	} 

	static init = () => {
		// Add Changelog Button to Help and Documentation
		Hooks.on("renderSidebarTab", (settings, element) => {
			this.updateSettingsTab($(element));
		});
		this.updateSettingsTab($('#ui-right #sidebar'));

		this.registerChangelog({moduleID: MODULE.ID});
			
		this.fetchGlobalConflicts();
		this.maifestPlusSupport();

		this.registerLibThemer();

		// dumb feature
		$('body').on('mouseenter', 'a[href]', (event) => {
			$('body').append(`<div class="url-link-display">${$(event.target).attr('href')}</div>`);
		}).on('mouseleave', 'a[href]', () => {
			$('.url-link-display').remove();
		})
	}

	static procesStaticChangelogs = () => {
		// Enable Version Tracking
		this.versionTracker().then(response => response).then((trackedModules) => {
			// Update Setting
			MODULE.setting('trackedChangelogs', trackedModules);
			if (game.user.isGM && MODULE.setting('showNewChangelogsOnLoad'))
				this.renderChangelog({trackedModules: trackedModules});
		});
	}

	static async versionTracker() {
		const compareVersion = (version1, version2) => {
			const levels1 = version1.split('.');
			const levels2 = version2.split('.');
			const length = Math.max(levels1.length, levels2.length);
		
			for (let i = 0; i < length; i++) {
				const v1 = i < levels1.length ? parseInt(levels1[i]) : 0;
				const v2 = i < levels2.length ? parseInt(levels2[i]) : 0;
		
				if (v1 > v2) return true;
				if (v2 > v1) return false;
			}
		
			return 0;
		};

		let tracker = MODULE.setting('trackedChangelogs');
		
		// Remove Modules that Don't Exists
		Object.entries(tracker).forEach(([key, module]) => {
			if (typeof game.modules.get(key) == 'undefined') {
				delete tracker[key];
			}
		})
		
		// Check if Mods have udpated
		for await (let [key, module] of game.modules) {
			// Check If Module Exists
			if (typeof tracker[module?.data?.name] != 'undefined') {
				// Check if Module has Updated
				if (compareVersion(module?.data?.version, tracker[module?.data?.name].version)) {
					await FilePicker.browse('user', `./modules/${module?.data?.name}/`, { extensions: ['.md'] }).then(response => {
						let files = response.files.filter(file => file.toLowerCase().includes(`changelog.md`))
						if (files.length > 0) {
							return files[0];
						}
						throw TypeError(`${module?.data?.title} did not provide a changelog.md file`);
					}).then(file => {
						tracker[module?.data?.name] = {
							version: module?.data?.version,
							hasSeen: false
						}
					}).catch((error) => {
						//this.LOG(error);
					});
				}
			}else{
				await FilePicker.browse('user', `./modules/${module?.data?.name}/`, { extensions: ['.md'] }).then(response => {
					let files = response.files.filter(file => file.toLowerCase().includes(`changelog.md`))
					if (files.length > 0) {
						return files[0];
					}
					throw TypeError(`${module?.data?.title} did not provide a changelog.md file`);
				}).then(file => {
					tracker[module?.data?.name] = {
						version: module?.data?.version,
						hasSeen: false
					}
				}).catch((error) => {
					//this.LOG(error);
				});
			}
		};

		return await tracker;
	}

	static renderChangelog = ({trackedModules, showAllModules}) => {
		if (typeof trackedModules == 'undefined') trackedModules = MODULE.setting('trackedChangelogs');
		if (typeof showAllModules == 'undefined') showAllModules = false;

		// Sort Modules by ModuleID
		let sortedModules = Object.keys(trackedModules).sort().reduce((obj, key) => { 
				obj[key] = trackedModules[key]; 
			  	return obj;
			}, {});

		// Check if Changelog has to be shown
		let showChangelog = false;
		let modulesToShow = [];
		Object.entries(sortedModules).forEach(([key, module]) => {
			// If Changelog has not been seen, show changelog
			let moduleData = MODULE.setting('useSourceInsteadofSchema') ? game.modules.get(key).data._source : game.modules.get(key).data;
			if (!module.hasSeen || showAllModules) {
				showChangelog = true;

				let pushData = {
					title: moduleData?.title,
					name: moduleData?.name,
					type: 'changelog'
				}
				if (module?.description ?? false) pushData.description = module.description;

				modulesToShow.push(pushData)
			}
		});

		if (showChangelog || showAllModules) {
			new ModuleCreditsDialog(modulesToShow).render(true);
		}
	}

	static renderModuleManagement = (app, html) => {
		let $modulesTab = html.find('#module-list');
		let popperInstance = null;
		
		$modulesTab.find('li.package').each((index, module) => {
			let $module = $(module);
			let moduleData = MODULE.setting('useSourceInsteadofSchema') ? game.modules.get($module.data('module-name')).data._source : game.modules.get($module.data('module-name')).data;

			$module.toggleClass('condense-tags', MODULE.setting('condenseTags'));
			$module.toggleClass('default-icons', MODULE.setting('defaultIcons'));
			$module.toggleClass('condense-default-tags', MODULE.setting('condenseDefaultTags'));
			$module.toggleClass('condense-compatibility-risk', MODULE.setting('condenseCompatibilityRisk'));
			$module.toggleClass('condense-version', MODULE.setting('condenseVersion'));
			$module.toggleClass('condense-version', MODULE.setting('condenseAuthors'));

			// Define Tag Template
			const tag = ({$tag, text, onclick, isLocal}) => {
				if (typeof $tag == 'undefined') $tag = $(`<span class="tag ${text.split('.')[1]}">${MODULE.localize(text)}</span>`);
				if (typeof onclick == 'function') $tag.addClass('action').on('click', onclick);
				if (typeof isLocal == 'undefined' || isLocal == false) $tag.addClass('url');

				return $tag;
			}

			if (MODULE.setting('condenseCompatibilityRisk')) {
				let $compatibilityRisk = $module.find(`.package-overview .tag.unknown:contains('Compatibility Risk')`);
				if ($compatibilityRisk.length > 0) {
					$compatibilityRisk.html($compatibilityRisk.text().replace(/Compatibility Risk/gi, '').replace(/\(/gi, '').replace(/\)/gi, ''));
				}
			}

			// reused $tag variable
			let $tag = null;

			// Update Version Tag with URL on click
			if (moduleData?.url?.length > 0) {
				$tag = tag({
					$tag: $module.find('.package-overview .tag.version'),
					onclick: (event) => window.open(moduleData?.url, '_blank')
				});
				if (MODULE.setting('condenseVersion')) {
					let textParts = $tag.text().split(' ');
					$tag.html(`${textParts[0][0]}${textParts[1]}`.toLowerCase());
				}
			}
			
			// check if module has readme URL
			if (MODULE.setting('showReadme')) {
				$tag = tag({
					text: 'text.readme.name',
					onclick: () =>  window.open(moduleData?.readme, '_blank')
				});
				if (MODULE.setting('fetchLocalReadme')) {
					FilePicker.browse('user', `./modules/${moduleData?.name}/`, { extensions: ['.md'] }).then(response => {
						let files = response.files.filter(file => file.toLowerCase().includes(`readme.md`))
						if (files.length > 0) {
							return files[0];
						}
						throw TypeError(`${moduleData?.title} did not provide a readme.md file`);
					}).then(file => {
						$tag = tag({
							text: 'text.readme.name',
							isLocal: true,
							onclick: () => {
								new ModuleCreditsDialog([{title: moduleData.title, name: moduleData.name, type: 'readme'}]).render(true);
							}
						});
						$module.find('.package-overview .tag').last().before($tag);
					}).catch((error) => {
						if (moduleData?.readme?.length > 0) $module.find('.package-overview .tag').last().before($tag);
					});
				}else{
					if (moduleData?.readme?.length > 0) $module.find('.package-overview .tag').last().before($tag);
				}
			}
			
			// check if module has issues URL
			if (moduleData?.bugs?.length > 0 && MODULE.setting('showIssues')) {
				$tag = tag({
					text: 'text.issues.name',
					isLocal: this.bugReporterSupport(moduleData),
					onclick: () =>  {
						// Handle For Bug Reporter Support
						if (this.bugReporterSupport(moduleData)) {
							game.modules.get("bug-reporter").api.bugWorkflow(moduleData?.name);
						}else{
							window.open(moduleData?.bugs, '_blank')
						}

					}
				})
				$module.find('.package-overview .tag').last().before($tag)
			}
			
			// check if module has changelog URL
			if (MODULE.setting('showChangelog')) {
				$tag = tag({
					text: 'text.changelog.name',
					onclick: () =>  window.open(moduleData?.changelog, '_blank')
				});
				if (MODULE.setting('fetchLocalChangelogs')) {
					FilePicker.browse('user', `./modules/${moduleData?.name}/`, { extensions: ['.md'] }).then(response => {
						let files = response.files.filter(file => file.toLowerCase().includes(`changelog.md`))
						if (files.length > 0) {
							return files[0];
						}
						throw TypeError(`${moduleData?.title} did not provide a changelog.md file`);
					}).then(file => {
						$tag = tag({
							text: 'text.changelog.name',
							isLocal: true,
							onclick: () => {
								new ModuleCreditsDialog([{title: moduleData.title, name: moduleData.name, type: 'changelog'}]).render(true);
							}
						});
						$module.find('.package-overview .tag').last().before($tag);
					}).catch((error) => {
						if (moduleData?.changelog?.length > 0) $module.find('.package-overview .tag').last().before($tag);
					});
				}else{
					if (moduleData?.changelog?.length > 0) $module.find('.package-overview .tag').last().before($tag);
				}
			}

			// Build Authors
			let authors = [];
			moduleData?.authors?.forEach(author => {
				authors.push({...author});
			});

			// If not authors found, use author tag instead
			if (authors.length == 0 && moduleData?.author?.length > 0) {
				moduleData?.author.split(',').forEach((author, index) => {
					authors.push({ name: author, url: null })
				})
			}

			// Add Author tag to Module Tags
			function buildTooltip(event, authors) {
				let showTooltip = false;
				let $self = $(event.currentTarget);
				let $tooltip = $(`<div id="${MODULE.ID}-tooltip" role="tooltip">
						<div id="${MODULE.ID}-arrow" data-popper-arrow></div>
					</div>`);

				function isURL(text) {
					return text.match(new RegExp(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi));
				}

				// Check if Authors is Array, if not, convert to array
				if (!Array.isArray(authors)) {
					authors = [authors];
				}

				authors.forEach(function (author, index) {
					$tooltip.find(`#${MODULE.ID}-arrow`).before(`<div class="${MODULE.ID}-list-group"></div>`)
					for (const [key, value] of Object.entries(author)) {
						let $group = $tooltip.find(`.${MODULE.ID}-list-group`).last();

						// Handle if key is supported url
						if (value != undefined) {
							if (['twitter', 'patreon', 'github', 'reddit'].includes(key)) {
								if (isURL(value)) {
									$group.append(`<a href="${value}" class="${MODULE.ID}-list-group-item mc-tooltip-social">
										<i class="fab fa-${key}"></i>
											${key}
										</a>`);
								}else{
									$group.append(`<a href="https://www.${key}.com/${value}" class="${MODULE.ID}-list-group-item mc-tooltip-social">
										<i class="fab fa-${key}"></i>
											${value}
										</a>`);
								}
							}else if (['ko-fi'].includes(key)) {
								if (isURL(value)) {
									$group.append(`<a href="${value}" class="${MODULE.ID}-list-group-item mc-tooltip-social">
										<i class="fas fa-coffee"></i>
											${key}
										</a>`);
								}else{
									$group.append(`<a href="https://www.${key}.com/${value}" class="${MODULE.ID}-list-group-item mc-tooltip-social">
										<i class="fas fa-coffee"></i>
											${value}
										</a>`);
								}
							}else if (['url'].includes(key) && isURL(value)) {
								$group.append(`<a href="${value}" target="_blank" class="${MODULE.ID}-list-group-item mc-tooltip-url">
									<i class="fas fa-link"></i>
									Website
								</a>`);
							}else if (['discord'].includes(key)) {
								if (isURL(value)) {
									$group.append(`<a href="${value}" class="${MODULE.ID}-list-group-item mc-tooltip-discord">
											<i class="fab fa-${key}"></i>
											${key}
										</a>`);
								}else{
									$group.append(`<div class="${MODULE.ID}-list-group-item mc-tooltip-discord">
										<i class="fab fa-discord"></i>
										${value}
									</div>`)
								}
							}else if (['email'].includes(key)) {
								$group.append(`<div class="${MODULE.ID}-list-group-item mc-tooltip-email">
									<i class="far fa-envelope"></i>
									${value}
								</div>`)
							}else if (key == 'name') { 
								$group.append(`<div class="${MODULE.ID}-list-group-item mc-tooltip-name">
									<strong>${value}</strong>
								</div>`)				
							}else{
								if (isURL(value)) {
									$group.append(`<a href="${value}" class="${MODULE.ID}-list-group-item mc-tooltip-other">
											<i class="fas fa-external-link-alt"></i>
											${key}
										</a>`);
								}else{
									$group.append(`<div class="${MODULE.ID}-list-group-item mc-tooltip-other">
										<i class="fas fa-info-circle"></i>
										${key} - ${value}
									</div>`)
								}
							}
						}
					}
				});

				// If tag contains more then just authors name, show tooltip when clicked
				if ($tooltip.find(`.${MODULE.ID}-list-group-item`).length > 1) showTooltip = true;

				// If a tooltip already exists, destroy it.
				if (popperInstance != null) {
					popperInstance.destroy();
					$(`#${MODULE.ID}-tooltip`).remove();
				}

				if (showTooltip) {
					// Add Tooltip to DOM
					$self.before($tooltip);

					// Setup Tooltip
					popperInstance = Popper.createPopper($self[0], $tooltip[0], {
						placement: 'auto',
						strategy: 'absolute',
						modifiers: [
							{
								name: 'offset',
								options: {
								offset: [0, 8],
								},
							},
						],
					});
				}
			}

			// Condense Authors if there is more then one.
			if (MODULE.setting('condenseAuthors') && authors.length > 1) {
				$tag = tag({
					text: 'text.author.name',
					isLocal: true,
					onclick: (event) => {
						buildTooltip(event, authors);
					}
				});
				$tag.html('<i class="fas fa-users"></i>');
						
				// Add Author Tags
				$module.find('.package-overview .package-title').after($tag)
			}else{
				authors.forEach(author => {
					$tag = tag({
						text: 'text.author.name',
						isLocal: true,
						onclick: (event) => {
							buildTooltip(event, author);
						}
					});

					$tag.html(author?.name);
						
					// Add Author Tags
					$module.find('.package-overview .package-title').after($tag)
				});
			}
		});

		$('body').on('click', (event) => {
			if (popperInstance != null) {
				if ($(event.target).closest(`#${MODULE.ID}-tooltip`).length == 0 && $(event.target).closest('.tag.author').length == 0) {
					popperInstance.destroy();
					$(`#${MODULE.ID}-tooltip`).remove();
				}
			}
		})
	} 

	static renderSettingsConfig = (app, html) => {
		let $moduleSection = $(html).find('[data-tab="modules"] h2.module-header:contains("Module Credits")')
		
		// Add Support for Tidy UI - Game Settings
		if (!game.modules.get('tidy-ui-game-settings')) $moduleSection = $moduleSection.next();

		// Add Reset for Tracked Changelogs
		$moduleSection.after(`<div class="form-group submenu">
				<label>${MODULE.localize('resetDialog.name')}</label>
				<button type="button" data-action="module-credits-reset-tracked-changelogs">
					<i class="fas fa-eraser"></i>
					<label>${MODULE.localize('resetDialog.button')}</label>
				</button>
				<p class="notes">${MODULE.localize('resetDialog.hint')}</p>
			</div>`);
		
		$moduleSection.next('.form-group').find('button[data-action="module-credits-reset-tracked-changelogs"]').on('click', event => {
			Dialog.confirm({
				title: MODULE.localize('resetDialog.name'), 
				content: MODULE.localize('resetDialog.hint'), 
				yes: (event) => { 
					MODULE.setting('trackedChangelogs', {}).then(response => response).then((settingValue) => {
						this.versionTracker().then(response => response).then((trackedModules) => {
							// Update Setting
							MODULE.setting('trackedChangelogs', trackedModules);
						});
					})
				}, 
				no: (event) => { return false; }
			})
		});

		// Handle Change Event for Condense Default Tags
		$(html).find(`[name="${MODULE.ID}.defaultIcons"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $fetchLocalChangelog = $(html).find(`[name="${MODULE.ID}.condenseDefaultTags"]`);

			if (!$element.is(':checked')) $fetchLocalChangelog.prop('checked', false);
		});
		$(html).find(`[name="${MODULE.ID}.condenseDefaultTags"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $defaultIcons = $(html).find(`[name="${MODULE.ID}.defaultIcons"]`);

			if ($element.is(':checked')) $defaultIcons.prop('checked', true);
		});

		// Handle Change Event for Fetch Local Readme
		$(html).find(`[name="${MODULE.ID}.showReadme"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $fetchLocalChangelog = $(html).find(`[name="${MODULE.ID}.fetchLocalReadme"]`);

			if (!$element.is(':checked')) $fetchLocalChangelog.prop('checked', false);
		});
		$(html).find(`[name="${MODULE.ID}.fetchLocalReadme"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $showReadme = $(html).find(`[name="${MODULE.ID}.showReadme"]`);

			if ($element.is(':checked')) $showReadme.prop('checked', true);
		});

		// Handle Change Event for Fetch Local Changelog
		$(html).find(`[name="${MODULE.ID}.showChangelog"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $fetchLocalChangelog = $(html).find(`[name="${MODULE.ID}.fetchLocalChangelogs"]`);

			if (!$element.is(':checked')) $fetchLocalChangelog.prop('checked', false);
		});
		$(html).find(`[name="${MODULE.ID}.fetchLocalChangelogs"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $showChangelog = $(html).find(`[name="${MODULE.ID}.showChangelog"]`);

			if ($element.is(':checked')) $showChangelog.prop('checked', true);
		});
	}
}