// GET MODULE CORE
import { MODULE } from './_module.mjs';

Hooks.once('ready', async () => {
	const moduleDetails = game.modules.get(MODULE.ID)

	if (foundry.utils.isNewerVersion('2.0.4', MODULE.setting('clientMigratedVersion')) || foundry.utils.isNewerVersion('2.0.4', MODULE.setting('worldMigratedVersion'))) {
		// Migrate Locked Settings.
		ui.notifications.info(`<div class="${MODULE.ID}-migration-tooltip-203"><strong>${MODULE.TITLE}:</strong> ${MODULE.localize('migration.v204.starting')}</div>`, { permanent: true});

		let newLockedSettings = {};
		for (const [key, value] of Object.entries(MODULE.setting('lockedSettings'))) {
			const settingDetails = game.settings.settings.get(key.replace('_', '.'))
			
			if ((settingDetails?.namespace ?? false) && (settingDetails?.namespace ?? false) && (game.settings.get(settingDetails.namespace, settingDetails.key) ?? false)) {
				newLockedSettings[`${settingDetails.namespace}.${settingDetails.key}`] = game.settings.get(settingDetails.namespace, settingDetails.key);
			}
		}
		
		MODULE.setting('lockedSettings', newLockedSettings).then(response => {
			Dialog.prompt({
				id: `${MODULE.ID}-migration-complete`,
				title: MODULE.TITLE,
				content: `<p>${MODULE.localize('migration.v204.complete')}</p>`,
				callback: () => {
					MODULE.setting('clientMigratedVersion', '2.0.4').then(response => {
						MODULE.setting('worldMigratedVersion', '2.0.4').then(response => {
							location.reload();
						})
					})
				},
			});
		})
	}
	if (foundry.utils.isNewerVersion('2.1.2', MODULE.setting('worldMigratedVersion'))) {
		Dialog.confirm({
			title: MODULE.localize('title'),
			content: `<p style="margin-top:0px;">${MODULE.localize('migration.v212.enableGlobalConflicts')}</p> 
				<div class="notification warning">${MODULE.localize('migration.v212.googleIPWarning')}</div>
				<div class="notification info">${MODULE.localize('migration.v212.developersAreFriends')}</div>`,
			render: (elem) => elem[0].closest('.app.dialog').querySelector('a.header-button.close').remove(),
			yes: () => true,
			no: () => false
		}).then(async response => {
			await MODULE.setting('enableGlobalConflicts', response ?? false);
			await MODULE.setting('clientMigratedVersion', '2.1.2');
			await MODULE.setting('worldMigratedVersion', '2.1.2');
		});
	}
	if (foundry.utils.isNewerVersion('2.1.4', MODULE.setting('clientMigratedVersion'))) {
		ui.notifications.info(`<strong>${MODULE.TITLE}:</strong> ${MODULE.localize('migration.v214.smartLabels')}`);
		await MODULE.setting('smartLabels', MODULE.setting('autoPrefixModules') ?? true);
		await MODULE.setting('clientMigratedVersion', '2.1.4');
		await MODULE.setting('worldMigratedVersion', '2.1.4');
	}
});