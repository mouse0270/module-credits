// GET MODULE CORE
import { MODULE } from './_module.mjs';

Hooks.once('ready', () => {
	const moduleDetails = game.modules.get(MODULE.id)

	if (foundry.utils.isNewerVersion('2.0.4', MODULE.setting('clientMigratedVersion')) || foundry.utils.isNewerVersion('2.0.4', MODULE.setting('worldMigratedVersion'))) {
		// Migrate Locked Settings.
		ui.notifications.info(`<div class="${MODULE.ID}-migration-tooltip-203"><strong>${MODULE.TITLE}:</strong> ${MODULE.localize('migration.v203.starting')}</div>`, { permanent: true});

		let newLockedSettings = {};
		for (const [key, value] of Object.entries(MODULE.setting('lockedSettings'))) {
			const settingDetails = game.settings.settings.get(key.replace('_', '.'))
			
			if (game.settings.get(settingDetails.namespace, settingDetails.key) ?? false) {
				newLockedSettings[`${settingDetails.namespace}.${settingDetails.key}`] = game.settings.get(settingDetails.namespace, settingDetails.key);
			}
		}
		
		MODULE.setting('lockedSettings', newLockedSettings).then(response => {
			Dialog.prompt({
				id: `${MODULE.ID}-migration-complete`,
				title: MODULE.TITLE,
				content: `<p>${MODULE.localize('migration.v203.complete')}</p>`,
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
});