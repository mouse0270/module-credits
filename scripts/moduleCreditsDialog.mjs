// GET MODULE CORE
import { MODULE } from './_module.mjs';

export class ModuleCreditsDialog extends FormApplication {
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
				if (typeof MODULE.setting('trackedChangelogs')[module?.name]?.hasSeen) hasSeen = MODULE.setting('trackedChangelogs')[module?.name]?.hasSeen

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
			let module = this.modules.filter(module => module.name == $element.data('load'))[0];

			// Only do something if clicking on inactive item.
			if (!$listElement.hasClass('active') && typeof module != 'undefined') {
				// Deactivate current Item
				$element.closest('ul').find('li.active').removeClass('active');

				if (module?.content ?? false) {
					let changelog = MODULE.markup(module.content);
					let toggle = `<div class="module-credits-dialog-toggle"><i class="fas fa-chevron-circle-down"></i></div>`
					$(html).find('main > .module-credits-dialog-title').html(`${toggle} ${module.title}`);
					$(html).find('main .module-credits-dialog-content').html(changelog);
					$listElement.addClass('active module-credits-dialog-has-seen-true').removeClass('module-credits-dialog-has-seen-false');
					
					// Updated Tracked Modules!!
					if (module.type == 'changelog') {
						let trackedModules = MODULE.setting('trackedChangelogs');
						trackedModules[module.name].hasSeen = true;
						MODULE.setting('trackedChangelogs', trackedModules);
					}
				}else{
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
							let changelog = MODULE.markup(data);
							let toggle = `<div class="module-credits-dialog-toggle"><i class="fas fa-chevron-circle-down"></i></div>`
							$(html).find('main > .module-credits-dialog-title').html(`${toggle} ${module.title}`);
							$(html).find('main .module-credits-dialog-content').html(changelog);
							$listElement.addClass('active module-credits-dialog-has-seen-true').removeClass('module-credits-dialog-has-seen-false');
							
							// Updated Tracked Modules!!
							if (module.type == 'changelog') {
								let trackedModules = MODULE.setting('trackedChangelogs');
								trackedModules[module.name].hasSeen = true;
								MODULE.setting('trackedChangelogs', trackedModules);
							}
						}).catch(error => {
							//moduleCredits.LOG('ERROR', error);
						})
					}).catch(error => {
						//moduleCredits.LOG('ERROR', error);
					});
				}
			}
		});
		// Activate first item in list
		$(html).find('nav li:first-child a').trigger('click');
	}
}