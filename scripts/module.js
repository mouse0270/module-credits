class ModuleCredits extends MousesLib {
	constructor(module) {
		super(module)
	}

	async getModuleJSON(json) {
		return await FilePicker.browse('user', `./modules/${json.name}/changelog.md`, { extensions: ['.md'] })
	}

	init = () => {
		return false;
	}

	renderModuleManagement = (app, html) => {
		let $modulesTab = html.find('#module-list');

		$modulesTab.find('li.package').each((index, module) => {
			let $module = $(module);

			$.getJSON(`./modules/${$module.data('module-name')}/module.json`, (json) => {
				// If URL Exists, Change Version to Link to Project
				if (json?.url?.length > 0) {
					$module.find('.package-overview .tag.version').attr({
						'onclick': `window.open('${json.url}', '_blank')`
					}).addClass('url').prepend(`<i class="fas fa-external-link-alt"></i>`);
				}

				// Check if module has readme
				if (json?.readme?.length > 0 && moduleCredits.setting('showWiki')) {
					let $tag = $(`<span class="tag wiki")">wiki</span>`).attr({
						'onclick': `window.open('${json?.readme}', '_blank')`
					}).prepend(`<i class="fas fa-info-circle"></i>`);
					$module.find('.package-overview .tag').last().before($tag)
				}

				// Check if module has issue url 
				if (json?.bugs?.length > 0 && moduleCredits.setting('showIssues')) {
					let $tag = $(`<span class="tag issues")">issues</span>`).attr({
						'onclick': `window.open('${json?.bugs}', '_blank')`
					}).prepend(`<i class="fas fa-bug"></i>`);
					$module.find('.package-overview .tag').last().before($tag)
				}

				// Check if Changelog is Enabled
				if (moduleCredits.setting('showChangelog')) {
					// Check if Fetch Local Changelog is Enabled
					if (moduleCredits.setting('fetchLocalChangelogs')) {
						this.getModuleJSON(json)
							.then(response => {
								let $tag = $(`<span class="tag changelog")">changelog</span>`).attr({
									'onclick': `new ModuleCreditsChangelog({title: "${json.title}", name: "${json.name}"}).render(true);`
								}).prepend(`<i class="fas fa-exchange-alt"></i>`);
								$module.find('.package-overview .tag').last().before($tag);
							}).catch((error) => {
								if (json?.changelog?.length > 0) {
									let $tag = $(`<span class="tag changelog")">changelog</span>`).attr({
										'onclick': `window.open('${json?.changelog}', '_blank')`
									}).prepend(`<i class="fas fa-external-link-alt"></i>`);
									$module.find('.package-overview .tag').last().before($tag);
								}
							});
					}else if (json?.changelog?.length > 0) {
						// Check if Json has changelog url
						let $tag = $(`<span class="tag changelog")">changelog</span>`).attr({
							'onclick': `window.open('${json?.changelog}', '_blank')`
						}).prepend(`<i class="fas fa-external-link-alt"></i>`);
						$module.find('.package-overview .tag').last().before($tag);
					}
				}

				// Build Authors
				let authors = [];
				json?.authors?.forEach(author => {
					authors.push({
						name: author?.name,
						email: author?.email,
						url: author?.url
					});
				});
				// If not authors found, use author tag instead
				if (authors.length == 0 && json?.author?.length > 0)
					authors.push({ name: json?.author, url: null })

				// Add Author tag to Module Tags
				authors.forEach(author => {
					let $authorTag = $(`<span class="tag author">${author?.name}</span>`);
					// Check if Author has URL
					if (author?.url?.length > 0)
						$authorTag.attr({
							'onclick': `window.open('${author?.url}', '_blank')`
						}).addClass('url').prepend(`<i class="fas fa-external-link-alt"></i>`);
					
					// Add Author Tags
					$module.find('.package-overview .package-title').after($authorTag)
				});
			});
		})
		//new ModuleCreditsChangelog({title: 'Changelog: Module Credits'}).render(true);
	}

	renderSettingsConfig = (app, html) => {
		let $moduleSettings = $(html).find('[data-tab="modules"] h2.module-header:contains("Module Credits")').nextUntil('h2.module-header');
	
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

		// Handle Change Event
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

class ModuleCreditsChangelog extends FormApplication {
	constructor(data) {
		super();
		this.MODULE = {
			title: data.title,
			name: data.name
		}
	}

	static get defaultOptions() {
		let data = {
			...super.defaultOptions,
			title: 'Changelog: ',
			id: 'moduleCreditsChanglelogWindow',
			template: "modules/module-credits/templates/changelog.hbs",
			resizable: true,
			width: 660,
			height: $(window).height() > 600 ? 600 : $(window).height() - 100
		}

		return data;
	}

	getData() {
		return {};
	}
  	activateListeners(html) {
		super.activateListeners(html);
		
		$('#moduleCreditsChanglelogWindow').find('.window-title').html(`Changelog: ${this.MODULE.title}`);

		fetch(`./modules/${this.MODULE.name}/changelog.md`).then(response => {
			if (response.status >= 200 && response.status <= 299) {
				return response.text();
			}
		}).then(data => {
			let changelog = DOMPurify.sanitize(marked(data), {USE_PROFILES: {html: true}})
			$(html).append(changelog);
		}).catch(error => {
		})
	}
}