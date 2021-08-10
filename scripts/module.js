let moduleCredits = null;
Hooks.once('module-creditsIsLoaded', async () => {
	class ModuleCredits extends MousesLib {
		constructor(module) {
			super(module)
		}

		init = () => {
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
				this.setting('trackedChangelogs', trackedModules);
				if (game.user.isGM && this.setting('showNewChangelogsOnLoad'))
					this.renderChangelog({trackedModules: trackedModules});
			})
		}

		async versionTracker() {
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

			let tracker = this.setting('trackedChangelogs');

			// Remove Modules that Don't Exists
			Object.entries(tracker).forEach(([key, module]) => {
				if (typeof game.modules.get(key) == 'undefined') {
					this.LOG(`Removed ${key} from being tracked as it has been uninstalled.`)
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

		bugReporterSupport = (moduleData) => {
			// 🐛 Bug Reporter Support
			let bugReporter = game.modules.get('bug-reporter');
			// Check if Bug Reporter is Exists and Enabled
			return (
				typeof bugReporter.api != 'undefined'
				&& (
					// Check if Module has Opted into Bug Reporter Support
					moduleData?.data?.allowBugReporter
					|| moduleData?.data?.flags?.allowBugReporter
				)
			);
		}

		renderChangelog = ({trackedModules, showAllModules}) => {
			if (typeof trackedModules == 'undefined') trackedModules = this.setting('trackedChangelogs');
			if (typeof showAllModules == 'undefined') showAllModules = false;

			// Check if Changelog has to be shown
			let showChangelog = false;
			let modulesToShow = [];
			Object.entries(trackedModules).forEach(([key, module]) => {
				// If Changelog has not been seen, show changelog
				let moduleData = game.modules.get(key);
				if (!module.hasSeen || showAllModules) {
					showChangelog = true;
					modulesToShow.push({
						title: moduleData?.data?.title,
						name: moduleData?.data?.name,
						type: 'changelog'
					})
				}
			});

			if (showChangelog || showAllModules) {
				new ModuleCreditsDialog(modulesToShow).render(true);
			}
		}

		renderModuleManagement = (app, html) => {
			let $modulesTab = html.find('#module-list');

			$modulesTab.find('li.package').each((index, module) => {
				let $module = $(module);
				let moduleData = game.modules.get($module.data('module-name'));

				$module.toggleClass('condense-tags', this.setting('condenseTags'));
				$module.toggleClass('default-icons', this.setting('defaultIcons'));
				$module.toggleClass('condense-default-tags', this.setting('condenseDefaultTags'));
				$module.toggleClass('condense-compatibility-risk', this.setting('condenseCompatibilityRisk'));

				// Define Tag Template
				const tag = ({$tag, text, onclick, isLocal}) => {
					if (typeof $tag == 'undefined') $tag = $(`<span class="tag ${text.split('.')[1]}">${this.localize(text)}</span>`);
					if (typeof onclick == 'function') $tag.addClass('action').on('click', onclick);
					if (typeof isLocal == 'undefined' || isLocal == false) $tag.addClass('url');

					return $tag;
				}

				if (this.setting('condenseCompatibilityRisk')) {
					let $compatibilityRisk = $module.find(`.package-overview .tag.unknown:contains('Compatibility Risk')`);
					if ($compatibilityRisk.length > 0) {
						$compatibilityRisk.html($compatibilityRisk.text().replace(/Compatibility Risk/gi, '').replace(/\(/gi, '').replace(/\)/gi, ''));
					}
				}

				// reused $tag variable
				let $tag = null;

				// Update Version Tag with URL on click
				if (moduleData?.data?.url?.length > 0) {
					$tag = tag({
						$tag: $module.find('.package-overview .tag.version'),
						onclick: (event) => window.open(moduleData?.data?.url, '_blank')
					});
					if (this.setting('condenseVersion')) {
						let textParts = $tag.text().split(' ');
						$tag.html(`${textParts[0][0]}${textParts[1]}`.toLowerCase());
					}
				}
				
				// check if module has readme URL
				if (moduleCredits.setting('showReadme')) {
					$tag = tag({
						text: 'text.readme.name',
						onclick: () =>  window.open(moduleData?.data?.readme, '_blank')
					});
					if (moduleCredits.setting('fetchLocalReadme')) {
						FilePicker.browse('user', `./modules/${moduleData?.data?.name}/`, { extensions: ['.md'] }).then(response => {
							let files = response.files.filter(file => file.toLowerCase().includes(`readme.md`))
							if (files.length > 0) {
								return files[0];
							}
							throw TypeError(`${moduleData?.data?.title} did not provide a readme.md file`);
						}).then(file => {
							$tag = tag({
								text: 'text.readme.name',
								isLocal: true,
								onclick: () => {
									new ModuleCreditsDialog([{title: moduleData.data.title, name: moduleData.data.name, type: 'readme'}]).render(true);
								}
							});
							$module.find('.package-overview .tag').last().before($tag);
						}).catch((error) => {
							if (moduleData?.data?.readme?.length > 0) $module.find('.package-overview .tag').last().before($tag);
						});
					}else{
						if (moduleData?.data?.readme?.length > 0) $module.find('.package-overview .tag').last().before($tag);
					}
				}
				
				// check if module has issues URL
				if (moduleData?.data?.bugs?.length > 0 && moduleCredits.setting('showIssues')) {
					$tag = tag({
						text: 'text.issues.name',
						isLocal: this.bugReporterSupport(moduleData),
						onclick: () =>  {
							// Handle For Bug Reporter Support
							if (this.bugReporterSupport(moduleData)) {
								game.modules.get("bug-reporter").api.bugWorkflow(moduleData?.data?.name);
							}else{
								window.open(moduleData?.data?.bugs, '_blank')
							}

						}
					})
					$module.find('.package-overview .tag').last().before($tag)
				}
				
				// check if module has changelog URL
				if (moduleCredits.setting('showChangelog')) {
					$tag = tag({
						text: 'text.changelog.name',
						onclick: () =>  window.open(moduleData?.data?.changelog, '_blank')
					});
					if (moduleCredits.setting('fetchLocalChangelogs')) {
						FilePicker.browse('user', `./modules/${moduleData?.data?.name}/`, { extensions: ['.md'] }).then(response => {
							let files = response.files.filter(file => file.toLowerCase().includes(`changelog.md`))
							if (files.length > 0) {
								return files[0];
							}
							throw TypeError(`${moduleData?.data?.title} did not provide a changelog.md file`);
						}).then(file => {
							$tag = tag({
								text: 'text.changelog.name',
								isLocal: true,
								onclick: () => {
									new ModuleCreditsDialog([{title: moduleData.data.title, name: moduleData.data.name, type: 'changelog'}]).render(true);
								}
							});
							$module.find('.package-overview .tag').last().before($tag);
						}).catch((error) => {
							if (moduleData?.data?.changelog?.length > 0) $module.find('.package-overview .tag').last().before($tag);
						});
					}else{
						if (moduleData?.data?.changelog?.length > 0) $module.find('.package-overview .tag').last().before($tag);
					}
				}

				// Build Authors
				let authors = [];
				moduleData?.data?.authors?.forEach(author => {
					authors.push({
						name: author?.name,
						email: author?.email,
						url: author?.url
					});
				});

				// If not authors found, use author tag instead
				if (authors.length == 0 && moduleData?.data?.author?.length > 0) {
					authors.push({ name: moduleData?.data?.author, url: null })
				}

				// Add Author tag to Module Tags
				authors.forEach(author => {
					$tag = tag({
						text: 'text.author.name',
						isLocal: typeof author?.url?.length == 'undefined',
						onclick: () =>  {
							this.LOG()
							if (author?.url?.length > 0) {
								window.open(author?.url, '_blank')
							}
						}
					});
					$tag.html(author?.name);
						
					// Add Author Tags
					$module.find('.package-overview .package-title').after($tag)
				});
			})
			//new ModuleCreditsChangelog({title: 'Changelog: Module Credits'}).render(true);
		} 

		renderSettingsConfig = (app, html) => {
			let $moduleSection = $(html).find('[data-tab="modules"] h2.module-header:contains("Module Credits")')
			let $moduleSettings = $(html).find('[data-tab="modules"] h2.module-header:contains("Module Credits")').nextUntil('h2.module-header');
			
			// Add Support for Tidy UI - Game Settings
			if (!game.modules.get('tidy-ui-game-settings')) $moduleSection = $moduleSection.next();

			// Add Rest for Tracked Changelogs
			$moduleSection.after(`<div class="form-group submenu">
					<label>${this.localize('resetDialog.name')}</label>
					<button type="button" data-action="module-credits-reset-tracked-changelogs">
						<i class="fas fa-eraser"></i>
						<label>${this.localize('resetDialog.button')}</label>
					</button>
					<p class="notes">${this.localize('resetDialog.hint')}</p>
				</div>`);
			
			$moduleSection.next('.form-group').find('button[data-action="module-credits-reset-tracked-changelogs"]').on('click', event => {
				Dialog.confirm({
					title: this.localize('resetDialog.name'), 
					content: this.localize('resetDialog.hint'), 
					yes: (event) => { 
						this.setting('trackedChangelogs', {}).then(response => response).then((settingValue) => {
							this.versionTracker().then(response => response).then((trackedModules) => {
								// Update Setting
								this.setting('trackedChangelogs', trackedModules);
							});
						})
					}, 
					no: (event) => { return false; }
				})
			});
		
			if (moduleCredits.setting('allowHTMLforAllSettings')) {
				$moduleSettings = $(html).find('[data-tab="modules"] .settings-list .form-group');
			}
			$moduleSettings.each((index, setting) => {
				let $title = $(setting).find('label');
				let $hint = $(setting).find('p.notes');
				// Add setting to parsed settings to let CSS be styled correctly
				$(setting).addClass('module-credits-parsed');
		
				$hint.html(DOMPurify.sanitize(marked($hint.text()), {USE_PROFILES: {html: true}}))
			});

			// Handle Change Event for Condense Default Tags
			$(html).find(`[name="${this.MODULE.name}.defaultIcons"]`).on('change', (event) => {
				let $element = $(event.currentTarget);
				let $fetchLocalChangelog = $(html).find(`[name="${this.MODULE.name}.condenseDefaultTags"]`);

				if (!$element.is(':checked')) $fetchLocalChangelog.prop('checked', false);
			});
			$(html).find(`[name="${this.MODULE.name}.condenseDefaultTags"]`).on('change', (event) => {
				let $element = $(event.currentTarget);
				let $defaultIcons = $(html).find(`[name="${this.MODULE.name}.defaultIcons"]`);

				if ($element.is(':checked')) $defaultIcons.prop('checked', true);
			});

			// Handle Change Event for Fetch Local Readme
			$(html).find(`[name="${this.MODULE.name}.showReadme"]`).on('change', (event) => {
				let $element = $(event.currentTarget);
				let $fetchLocalChangelog = $(html).find(`[name="${this.MODULE.name}.fetchLocalReadme"]`);

				if (!$element.is(':checked')) $fetchLocalChangelog.prop('checked', false);
			});
			$(html).find(`[name="${this.MODULE.name}.fetchLocalReadme"]`).on('change', (event) => {
				let $element = $(event.currentTarget);
				let $showReadme = $(html).find(`[name="${this.MODULE.name}.showReadme"]`);

				if ($element.is(':checked')) $showReadme.prop('checked', true);
			});

			// Handle Change Event for Fetch Local Changelog
			$(html).find(`[name="${this.MODULE.name}.showChangelog"]`).on('change', (event) => {
				let $element = $(event.currentTarget);
				let $fetchLocalChangelog = $(html).find(`[name="${this.MODULE.name}.fetchLocalChangelogs"]`);

				if (!$element.is(':checked')) $fetchLocalChangelog.prop('checked', false);
			});
			$(html).find(`[name="${this.MODULE.name}.fetchLocalChangelogs"]`).on('change', (event) => {
				let $element = $(event.currentTarget);
				let $showChangelog = $(html).find(`[name="${this.MODULE.name}.showChangelog"]`);

				if ($element.is(':checked')) $showChangelog.prop('checked', true);
			});
		}
	}

	class ModuleCreditsDialog extends FormApplication {
		constructor(data) {
			super();
			this.modules = data;
		}

		static get defaultOptions() {
			return {
				...super.defaultOptions,
				title: 'Module Credits',
				id: 'moduleCreditsDialog',
				template: "modules/module-credits/templates/changelog.hbs",
				resizable: true,
				width: $(window).width() > 720 ? 720 : $(window).width() - 100,
				height: $(window).height() > 600 ? 600 : $(window).height() - 100,

				modules: this.modules
			}
		}

		getData() {
			return {
				modules: this.modules.map(module => {
					let hasSeen = false;
					if (typeof moduleCredits.setting('trackedChangelogs')[module?.name]?.hasSeen) hasSeen = moduleCredits.setting('trackedChangelogs')[module?.name]?.hasSeen

					return {
						...module, 
						hasSeen: hasSeen || false
					}
				})
			};
		}
		activateListeners(html) {
			super.activateListeners(html);

			$(html).addClass(`module-credits-hide-sidebar-${this.modules.length <= 1}`);

			$(html).find('main .module-credits-dialog-content').on('scroll', (event) => {
				$(html).find('main > .module-credits-dialog-title').toggleClass('has-shadow', $(event.currentTarget).scrollTop() > 5);
			});

			$(html).on('click', '.module-credits-dialog-toggle', (event) => {
				$(html).toggleClass('module-credits-collapse-sidebar')
			})

			$(html).find('nav li a').on('click', (event) => {
				let $element = $(event.currentTarget);
				let $listElement = $element.closest('li');
				let module = this.modules.filter(module => module.name == $element.data('load'))[0]

				// Only do something if clicking on inactive item.
				if (!$listElement.hasClass('active') && typeof module != 'undefined') {
					// Deactivate current Item
					$element.closest('ul').find('li.active').removeClass('active');

					FilePicker.browse('user', `./modules/${module.name}/`, { extensions: ['.md'] }).then(response => {
						let files = response.files.filter(file => file.toLowerCase().includes(`${module.type}.md`));
						if (files.length > 0) {
							return files[0];
						}
						throw TypeError(`no file matching ${module.type}.md`);
					}).then(file => {
						fetch(`./${file}`).then(response => {
							if (response.status >= 200 && response.status <= 299) {
								return response.text();
							}
							throw TypeError("did not provide a changelog.md file");
						}).then(data => {
							let changelog = DOMPurify.sanitize(marked(data), {USE_PROFILES: {html: true}});
							let toggle = `<div class="module-credits-dialog-toggle"><i class="fas fa-chevron-circle-down"></i></div>`
							$(html).find('main > .module-credits-dialog-title').html(`${toggle} ${module.title}`);
							$(html).find('main .module-credits-dialog-content').html(changelog);
							$listElement.addClass('active module-credits-dialog-has-seen-true').removeClass('module-credits-dialog-has-seen-false');
							
							// Updated Tracked Modules!!
							if (module.type == 'changelog') {
								let trackedModules = moduleCredits.setting('trackedChangelogs');
								trackedModules[module.name].hasSeen = true;
								moduleCredits.setting('trackedChangelogs', trackedModules);
							}
						}).catch(error => {
							//moduleCredits.LOG('ERROR', error);
						})
					}).catch(error => {
						//moduleCredits.LOG('ERROR', error);
					});
				}
			});
			// Activate first item in list
			$(html).find('nav li:first-child a').trigger('click');
		}
	}

	// Register Module	
	moduleCredits = new ModuleCredits({
		name: 'module-credits',
		title: 'Module Credits',
	});
	Hooks.callAll(`${moduleCredits.MODULE.name}Init`);
});