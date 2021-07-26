class ModuleCredits {
	constructor(module) {
		this.lib = new MousesLib({...module});

		this.LOG = this.lib.LOG;
	}


	init = () => {
		return false;
	}
}

let moduleCredits = null;

Hooks.once('init', async function() {
	moduleCredits = new ModuleCredits({
			name: 'module-credits',
			title: 'Module Credits'
		});

	window.moduleCredits = moduleCredits || {};
});

Hooks.on("renderModuleManagement", (app, html) => {
	let $modulesTab = html.find('#module-list');

	$modulesTab.find('li.package').each((index, module) => {
		let $module = $(module);

		$.getJSON(`./modules/${$module.data('module-name')}/module.json`, (json) => {

			// If URL Exists, Change Version to Link to Project
			if (json?.url?.length > 0) 
				$module.find('.package-overview .tag.version').attr({
					'onclick': `window.open('${json.url}', '_blank')`
				}).addClass('url').prepend(`<i class="fas fa-external-link-alt"></i>`);

			// Build Authors
			let authors = [];

			json?.authors?.forEach(author => {
				authors.push({
					name: author?.name,
					email: author?.email,
					url: author?.url
				});
			});

			if (authors.length == 0 && json?.author?.length > 0)
				authors.push({ name: json?.author, url: null })

			authors.forEach(author => {
				let $authorTag = $(`<span class="tag author">${author?.name}</span>`);
				if (author?.url?.length > 0)
					$authorTag.attr({
						'onclick': `window.open('${author?.url}', '_blank')`
					}).addClass('url').prepend(`<i class="fas fa-external-link-alt"></i>`);

				$module.find('.package-overview .package-title').after($authorTag)
			});
		});
	})
});
