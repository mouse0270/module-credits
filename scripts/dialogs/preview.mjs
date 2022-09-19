// GET REQUIRED LIBRARIES

// GET MODULE CORE
import { MODULE } from '../_module.mjs';

export class PreviewDialog extends FormApplication {
	constructor(data) {
		super();

		this.items = data;
		this.IsSystem = Object.values(data)[0]?.isSystem ?? false;
	}
  
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			title: MODULE.TITLE,
			id: `${MODULE.ID}-dialog`,
			classes: ['sheet', 'journal-sheet', 'journal-entry'],
			popOut: true,
			resizable: true,
			template: `./modules/${MODULE.ID}/templates/preview.hbs`,
			width: $(window).width() > 960 ? 960 : $(window).width() - 100,
			height: $(window).height() > 800 ? 800 : $(window).height() - 100
		});
	}
  
	getData() {
		// Send data to the template
		return {
			DIALOG: {
				ID: MODULE.ID,
				TITLE: MODULE.TITLE
			}, 
			items: this.items,
			IsMultipleItems: Object.keys(this.items).length > 1,
			IsGM: game.user.isGM
		};
	}
  
	activateListeners(html) {
		super.activateListeners(html);

		// Get Changelogs and Bind Events
		const navElements = html[0].querySelectorAll('aside.sidebar nav ol.directory-list li.directory-item');
		navElements.forEach((navElem) => {
			navElem.querySelectorAll('span').forEach(spanElem => {
				spanElem.addEventListener('click', (event) => {
					const elem = event.target.closest('li');

					// Uncheck active changelog
					navElements.forEach(activeElem => activeElem.classList.remove('active'));
					// Check new changelog as active
					elem.classList.add('active');
					// Set changelog content
					game.modules.get(MODULE.ID).API.getContent(this.IsSystem ? game.system : game.modules.get(elem.dataset.moduleId), elem.dataset.fileType, { dir: this.IsSystem ? 'systems' : 'modules'}).then(response => {
						let content = new showdown.Converter().makeHtml(response)
						html[0].querySelector('section.journal-entry-content .journal-header input.title').value = (this.IsSystem ? game.system : game.modules.get(elem.dataset.moduleId)).title;
						html[0].querySelector('section.journal-entry-content .journal-entry-page').innerHTML = content;

						// Update Module as Seen
						elem.querySelector('.page-ownership i.fa-regular').classList.remove('fa-eye-slash');
						elem.querySelector('.page-ownership i.fa-regular').classList.add('fa-eye');
						elem.querySelector('.page-ownership').classList.add('observer');
						if (game.user.isGM && (MODULE.setting('trackedChangelogs')[elem.dataset.moduleId] ?? false)) {
							MODULE.setting('trackedChangelogs', foundry.utils.mergeObject(MODULE.setting('trackedChangelogs'), { [elem.dataset.moduleId]: { hasSeen: true } }));
						}
					}).catch(result => {
						MODULE.error(result);
					});

					// Disable Buttons
					html[0].querySelectorAll('aside.sidebar .action-buttons button').forEach(btn => btn.disabled = false);
					if (navElements[0].classList.contains('active')) html[0].querySelector('aside.sidebar .action-buttons button[data-action="previous"]').disabled = true;
					if (navElements[navElements.length - 1].classList.contains('active')) html[0].querySelector('aside.sidebar .action-buttons button[data-action="next"]').disabled = true;
				});
			});
		});

		// Bind Collapse Toggle
		const collapseElem = html[0].querySelector('aside.sidebar .directory-header a.action-button.collapse-toggle');
		collapseElem.addEventListener('click', (event) => {
			const app = html[0].closest('.app');
			const sidebar = app.querySelector(".sidebar");
			const button = sidebar.querySelector(".collapse-toggle");
			const sidebarCollapsed = !sidebar.classList.contains('collapsed');
		
			// Disable application interaction temporarily
			app.style.pointerEvents = "none";
		
			// Configure CSS transitions for the application window
			app.classList.add("collapsing");
			app.addEventListener("transitionend", () => {
				app.style.pointerEvents = "";
				app.classList.remove("collapsing");
			}, {once: true});
		
			// Learn the configure sidebar widths
			const style = getComputedStyle(sidebar);
			const expandedWidth = Number(style.getPropertyValue("--sidebar-width-expanded").trim().replace("px", ""));
			const collapsedWidth = Number(style.getPropertyValue("--sidebar-width-collapsed").trim().replace("px", ""));
		
			// Change application position
			const delta = expandedWidth - collapsedWidth;
			this.setPosition({
			  left: this.position.left + (sidebarCollapsed ? delta : -delta),
			  width: this.position.width + (sidebarCollapsed ? -delta : delta)
			});
		
			// Toggle display of the sidebar
			sidebar.classList.toggle("collapsed", sidebarCollapsed);
		
			// Update icons and labels
			button.dataset.tooltip = sidebarCollapsed ? "JOURNAL.ViewExpand" : "JOURNAL.ViewCollapse";
			const i = button.children[0];
			i.setAttribute("class", `fa-solid ${sidebarCollapsed ? "fa-caret-left" : "fa-caret-right"}`);
			game.tooltip.deactivate();
		})

		// Bind Search Input
		const searchInput = html[0].querySelector('aside.sidebar .directory-header input[type="text"]');
		searchInput.addEventListener('keyup', (event) => {
			const searchFor = event.target.value.toLowerCase();

			navElements.forEach(navElem => {
				navElem.classList.remove('hidden');

				if (searchFor == "") {
					navElem.classList.remove('hidden');
				}else if (navElem.querySelector('.page-title').textContent.toLowerCase().indexOf(searchFor) == -1 && !navElem.classList.contains('active')) {
					navElem.classList.add('hidden');
				}
			})
		})

		// Bind Next/Prev Buttons
		const nextButton = html[0].querySelector('aside.sidebar .action-buttons button[data-action="next"]');
		const previousButton = html[0].querySelector('aside.sidebar .action-buttons button[data-action="previous"]');

		nextButton.addEventListener('click', (event) => {
			html[0].querySelector('aside.sidebar nav ol.directory-list li.directory-item.active').nextElementSibling.querySelector('.page-title').click();
		});
		previousButton.addEventListener('click', (event) => {
			html[0].querySelector('aside.sidebar nav ol.directory-list li.directory-item.active').previousElementSibling.querySelector('.page-title').click();
		});

		// Mark as Seen
		const markAsSeen = html[0].querySelector('aside.sidebar .action-buttons button[data-action="markAsSeen"]');

		markAsSeen.addEventListener('click', event => {
			let trackedChangelogs = MODULE.setting('trackedChangelogs');
			for (let key in trackedChangelogs) {
				trackedChangelogs[key].hasSeen = true;

				if (html[0].querySelector(`aside.sidebar nav ol.directory-list li[data-module-id="${key}"]`) ?? false) {
					html[0].querySelector(`aside.sidebar nav ol.directory-list li[data-module-id="${key}"] span.page-ownership`).classList.add('observer');
					html[0].querySelector(`aside.sidebar nav ol.directory-list li[data-module-id="${key}"] span.page-ownership i`).classList.remove('fa-eye-slash');
					html[0].querySelector(`aside.sidebar nav ol.directory-list li[data-module-id="${key}"] span.page-ownership i`).classList.add('fa-eye');
				}
			}

			MODULE.setting('trackedChangelogs', trackedChangelogs);
		})


		navElements[0].querySelector('.page-title').click();
	}
  
	async _updateObject(event, formData) {
		console.log(formData.exampleInput);
	}
  }