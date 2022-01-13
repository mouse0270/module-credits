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
		console.log(typeof bugReporter.api)
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

	static init = () => {
		// Add Changelog Button to Help and Documentation
		$('#sidebar #settings #settings-documentation').append(`<button data-action="changelog">
				<i class="fas fa-exchange-alt"></i> Module Changelogs
			</button>`);

		$('#sidebar #settings #settings-documentation [data-action="changelog"]').off('click');
		$('#sidebar #settings #settings-documentation [data-action="changelog"]').on('click', event => {
			this.renderChangelog({ showAllModules: true })
		});

		// Enable Version Tracking
		this.versionTracker().then(response => response).then((trackedModules) => {
			// Update Setting
			MODULE.setting('trackedChangelogs', trackedModules);
			if (game.user.isGM && MODULE.setting('showNewChangelogsOnLoad'))
				this.renderChangelog({trackedModules: trackedModules});
		});

		this.registerLibThemer();
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

		// Check if Changelog has to be shown
		let showChangelog = false;
		let modulesToShow = [];
		Object.entries(trackedModules).forEach(([key, module]) => {
			// If Changelog has not been seen, show changelog
			let moduleData = MODULE.setting('useSourceInsteadofSchema') ? game.modules.get(key).data._source : game.modules.get(key).data;
			if (!module.hasSeen || showAllModules) {
				showChangelog = true;
				modulesToShow.push({
					title: moduleData?.title,
					name: moduleData?.name,
					type: 'changelog'
				})
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
		})
		//new ModuleCreditsChangelog({title: 'Changelog: Module Credits'}).render(true);

		let $tooltip = $(`<div id="${MODULE.name}-tooltip" role="tooltip">
				<ul>
					<li>This is a test</li>
				</ul>
				<div id="arrow" data-popper-arrow></div>
	  		</div>`)
			  

		//let popperInstance = null;	  
		/*$('.tag.author').on('click', (event) => {
			event.preventDefault();

			if (popperInstance != null) {
				popperInstance.destroy();
				$tooltip.remove();
			}

			let $self = $(event.currentTarget);

			// Get Package Details
			let packageDetails = game.modules.get($self.closest('li.package').data('module-name')).data;
			console.log(packageDetails);

			$self.before($tooltip);
			popperInstance = Popper.createPopper($self[0], $tooltip[0], {
				placement: 'auto',
				strategy: 'fixed',
				modifiers: [
					{
						name: 'offset',
						options: {
						offset: [0, 8],
						},
					},
				],
			});
		});*/

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