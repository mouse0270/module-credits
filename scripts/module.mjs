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
			game.modules.get('lib-themer').api.registerTheme(MODULE.name, theme);
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
							changelog: markdown, 
							status: warnLevel
						})
					},
					registerConflict: this.defineConflict
				};

				Hooks.callAll('libChangelogsReady');
			});
		}
	}

	//Queue Registration calls
	static queue = [];
	static queueIsRunning = false;

	static async registerChangelog({moduleID, changelog, status}) {
		// add call to queue
		if (moduleID != null) {
			ModuleCredits.queue.push({ moduleID: moduleID, changelog: changelog, status: status });
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
				content: ModuleCredits.queue[0]?.changelog ?? null,
				status: ModuleCredits.queue[0]?.status ?? 'minor'
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


	//Define variable to hold conflicts as they don't need to be stored
	static conflicts = [];
	static defineConflict = ({moduleID, conflictingModuleID, content, status}) => {
		ModuleCredits.conflicts.push({
			moduleID: moduleID,
			conflictingModuleID: conflictingModuleID,
			content: content,
			status: status ?? 'minor'
		});

		$('#sidebar #settings #settings-game button[data-action="modules"]').attr('data-conflicts', ModuleCredits.conflicts.length);
		return 'conflict registered';
	}

	static api = () => {
		game.modules.get(MODULE.name).api = {
			registerChangelog: this.registerChangelog,
			defineConflict: this.defineConflict
		}

		// Add Support for Changelogs & Conflicts
		this.polyfillLibChangelogs();
	}

	static init = () => {
		// Add Changelog Button to Help and Documentation
		Hooks.on("renderSidebarTab", (a,b,c,d) => {
			if ($('#sidebar #settings #settings-documentation').length >= 1) {
				if ($('#sidebar #settings #settings-documentation button[data-action="changelog"]').length <= 0) {
					$('#sidebar #settings #settings-documentation').append(`<button data-action="changelog">
							<i class="fas fa-exchange-alt"></i> Module Changelogs
						</button>`);

					$('#sidebar #settings #settings-documentation [data-action="changelog"]').off('click');
					$('#sidebar #settings #settings-documentation [data-action="changelog"]').on('click', event => {
						this.renderChangelog({ showAllModules: true })
					});
				}

				if (ModuleCredits.conflicts.length >= 1) {
					$('#sidebar #settings #settings-game button[data-action="modules"]').attr('data-conflicts', ModuleCredits.conflicts.length);
				}
			}
			//data-action="modules"
		});

		this.registerChangelog({moduleID: MODULE.name});
		this.defineConflict({
			moduleID: 'module-credits',
			conflictingModuleID: 'lib-changelogs',
			content: 'Provides similar functionality.',
			status: 'minor'
		})

		//if (this.queue.length == 0) this.procesStaticCahngelogs();

		this.registerLibThemer();
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
							hasSeen: false,
							status: 'minor'
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
						hasSeen: false,
						status: 'minor'
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
					type: 'changelog',
					status: module.status
				}
				if (module?.content ?? false) pushData.content = module.content;

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
				authors.push({ name: moduleData?.author, url: null })
			}

			// Add Author tag to Module Tags
			function buildTooltip(event, authors) {
				let showTooltip = false;
				let $self = $(event.currentTarget);
				let $tooltip = $(`<div id="${MODULE.name}-tooltip" role="tooltip">
						<div id="${MODULE.name}-arrow" data-popper-arrow></div>
					</div>`);

				function isURL(text) {
					return text.match(new RegExp(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi));
				}

				// Check if Authors is Array, if not, convert to array
				if (!Array.isArray(authors)) {
					authors = [authors];
				}

				authors.forEach(function (author, index) {
					$tooltip.find(`#${MODULE.name}-arrow`).before(`<div class="${MODULE.name}-list-group"></div>`)
					for (const [key, value] of Object.entries(author)) {
						let $group = $tooltip.find(`.${MODULE.name}-list-group`).last();

						// Handle if key is supported url
						if (value != undefined) {
							if (['twitter', 'patreon', 'github'].includes(key)) {
								if (isURL(value)) {
									$group.append(`<a href="${value}" class="${MODULE.name}-list-group-item mc-tooltip-social">
										<i class="fab fa-${key}"></i>
											${key}
										</a>`);
								}else{
									$group.append(`<a href="https://www.${key}.com/${value}" class="${MODULE.name}-list-group-item mc-tooltip-social">
										<i class="fab fa-${key}"></i>
											${value}
										</a>`);
								}
							}else if (['url'].includes(key) && isURL(value)) {
								$group.append(`<a href="${value}" target="_blank" class="${MODULE.name}-list-group-item mc-tooltip-url">
									<i class="fas fa-link"></i>
									Website
								</a>`);
							}else if (['discord'].includes(key)) {
								if (isURL(value)) {
									$group.append(`<a href="${value}" class="${MODULE.name}-list-group-item mc-tooltip-discord">
											<i class="fab fa-${key}"></i>
											${key}
										</a>`);
								}else{
									$group.append(`<div class="${MODULE.name}-list-group-item mc-tooltip-discord">
										<i class="fab fa-discord"></i>
										${value}
									</div>`)
								}
							}else if (['email'].includes(key)) {
								$group.append(`<div class="${MODULE.name}-list-group-item mc-tooltip-email">
									<i class="far fa-envelope"></i>
									${value}
								</div>`)
							}else if (key == 'name') { 
								$group.append(`<div class="${MODULE.name}-list-group-item mc-tooltip-name">
									<strong>${value}</strong>
								</div>`)				
							}else{
								if (isURL(value)) {
									$group.append(`<a href="${value}" class="${MODULE.name}-list-group-item mc-tooltip-other">
											<i class="fas fa-external-link-alt"></i>
											${key}
										</a>`);
								}else{
									$group.append(`<div class="${MODULE.name}-list-group-item mc-tooltip-other">
										<i class="fas fa-info-circle"></i>
										${key} - ${value}
									</div>`)
								}
							}
						}
					}
				});

				// If tag contains more then just authors name, show tooltip when clicked
				if ($tooltip.find(`.${MODULE.name}-list-group-item`).length > 1) showTooltip = true;

				// If a tooltip already exists, destroy it.
				if (popperInstance != null) {
					popperInstance.destroy();
					$(`#${MODULE.name}-tooltip`).remove();
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
				if ($(event.target).closest(`#${MODULE.name}-tooltip`).length == 0 && $(event.target).closest('.tag.author').length == 0) {
					popperInstance.destroy();
					$(`#${MODULE.name}-tooltip`).remove();
				}
			}
		})
	} 

	static renderSettingsConfig = (app, html) => {
		let $moduleSection = $(html).find('[data-tab="modules"] h2.module-header:contains("Module Credits")')
		
		// Add Support for Tidy UI - Game Settings
		if (!game.modules.get('tidy-ui-game-settings')) $moduleSection = $moduleSection.next();

		// Add Rest for Tracked Changelogs
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
		$(html).find(`[name="${MODULE.name}.defaultIcons"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $fetchLocalChangelog = $(html).find(`[name="${MODULE.name}.condenseDefaultTags"]`);

			if (!$element.is(':checked')) $fetchLocalChangelog.prop('checked', false);
		});
		$(html).find(`[name="${MODULE.name}.condenseDefaultTags"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $defaultIcons = $(html).find(`[name="${MODULE.name}.defaultIcons"]`);

			if ($element.is(':checked')) $defaultIcons.prop('checked', true);
		});

		// Handle Change Event for Fetch Local Readme
		$(html).find(`[name="${MODULE.name}.showReadme"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $fetchLocalChangelog = $(html).find(`[name="${MODULE.name}.fetchLocalReadme"]`);

			if (!$element.is(':checked')) $fetchLocalChangelog.prop('checked', false);
		});
		$(html).find(`[name="${MODULE.name}.fetchLocalReadme"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $showReadme = $(html).find(`[name="${MODULE.name}.showReadme"]`);

			if ($element.is(':checked')) $showReadme.prop('checked', true);
		});

		// Handle Change Event for Fetch Local Changelog
		$(html).find(`[name="${MODULE.name}.showChangelog"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $fetchLocalChangelog = $(html).find(`[name="${MODULE.name}.fetchLocalChangelogs"]`);

			if (!$element.is(':checked')) $fetchLocalChangelog.prop('checked', false);
		});
		$(html).find(`[name="${MODULE.name}.fetchLocalChangelogs"]`).on('change', (event) => {
			let $element = $(event.currentTarget);
			let $showChangelog = $(html).find(`[name="${MODULE.name}.showChangelog"]`);

			if ($element.is(':checked')) $showChangelog.prop('checked', true);
		});
	}
}