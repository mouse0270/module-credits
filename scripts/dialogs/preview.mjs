// GET MODULE CORE
import { MODULE } from '../_module.mjs';

export class PreviewDialog extends FormApplication {
	constructor(data, type = 'changelog') {
		super();

		// Sort Items by User Friendly Title
		const sortedItems = Object.entries(data).sort((a, b) => {
			return (a[1]?.title.toUpperCase() ?? "UNKNOWN MODULE TITLE") > (b[1]?.title.toUpperCase() ?? "UNKNOWN MODULE TITLE") ? 1 : -1
		}).reduce((obj, value) => {
			obj[value[0]] = value[1]
			return obj;
		}, {});

		this.items = sortedItems;
		this.type = type;
	}

	static get defaultOptions() {
		return {
			...super.defaultOptions,
			title: MODULE.TITLE,
			id: `${MODULE.ID}-dialog`,
			template: `./modules/${MODULE.ID}/templates/preview.hbs`,
			resizable: true,
			width: $(window).width() > 720 ? 720 : $(window).width() - 100,
			height: $(window).height() > 600 ? 600 : $(window).height() - 100
		}
	}

	getData() {
		return {
			DIALOG: {
				ID: MODULE.ID,
				TITLE: MODULE.TITLE
			}, 
			items: this.items,
			IsMultipleItems: Object.keys(this.items).length > 1,
			IsGM: game.user.isGM
		}
	}

	activateListeners(html) {
		super.activateListeners(html);
		
		$(html).on('click', `nav ul li a.${MODULE.ID}-dialog-link`, (event) => {
			let $element = $(event.target);
			const moduleID = $element.data('load');

			// Set as active
			$(html).find('nav ul li.active').removeClass('active');
			$(event.target).closest('li').addClass('active');

			game.modules.get(MODULE.ID).API.getContent(moduleID, this.type).then(response => {
				$(html).find(`.${MODULE.ID}-dialog-title span`).html($element.html());
				$(html).find(`.${MODULE.ID}-dialog-content`).html(MODULE.markup(response.replaceAll('](/', ']('), { baseUrl: 'modules/monks-tokenbar/' }));

				// Update Has Seen Status
				if (game.user.isGM && this.type == 'changelog') {
					$(event.target).closest('li').removeClass(`${MODULE.ID}-has-seen-false`);
					$(event.target).closest('li').addClass(`${MODULE.ID}-has-seen-true`);
					MODULE.setting('trackedChangelogs', mergeObject(MODULE.setting('trackedChangelogs'), { [moduleID]: { hasSeen: true } }));
				}
			})
		});

		$(html).find(`nav ul li:first-child a.${MODULE.ID}-dialog-link`).trigger('click');


		$(html).find(`.${MODULE.ID}-dialog-toggle`).on('click', (event) => {
			$(html).find(`.${MODULE.ID}-window`).toggleClass('full-width')
		})
	}
}