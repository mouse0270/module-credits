// GET MODULE CORE
import { MODULE } from './_module.mjs';

// DEFINE MODULE CLASS
export class MIGRATE {
	static needsMigration = "1.1.0";

	static async init() {
		let installedModuleVersion = game.modules.get(MODULE.ID)?.data?.version ?? "0.0.0";
		let clientMigratedVersion = MODULE.setting('clientMigratedVersion') ?? "0.0.0";
		let worldMigratedVersion = MODULE.setting('worldMigratedVersion') ?? "0.0.0";

		// Check if Client Settings need 
		if (isNewerVersion(installedModuleVersion, clientMigratedVersion) || isNewerVersion(this.needsMigration, clientMigratedVersion)) {
			// Handle Migration to 1.1.0
			if (isNewerVersion("1.1.0", clientMigratedVersion)) {
				MODULE.log('Migrating Client to version 1.1.0');
				// Clean Up Old Client Settings
				game.settings.storage.get('client').removeItem('module-credits.useSourceInsteadofSchema');
				game.settings.storage.get('client').removeItem('module-credits.defaultIcons');
				game.settings.storage.get('client').removeItem('module-credits.condenseDefaultTags');
				game.settings.storage.get('client').removeItem('module-credits.condenseTags');
				game.settings.storage.get('client').removeItem('module-credits.condenseCompatibilityRisk');
				game.settings.storage.get('client').removeItem('module-credits.condenseVersion');
				game.settings.storage.get('client').removeItem('module-credits.condenseAuthors');
				game.settings.storage.get('client').removeItem('module-credits.showReadme');
				game.settings.storage.get('client').removeItem('module-credits.fetchLocalReadme');
				game.settings.storage.get('client').removeItem('module-credits.showIssues');
				game.settings.storage.get('client').removeItem('module-credits.showChangelog');
				game.settings.storage.get('client').removeItem('module-credits.fetchLocalChangelogs');

				// Move Tracked Changelogs to Client Setting so you don't have to see them per world.
				if (game.settings.storage.get("world").getItem('module-credits.trackedChangelogs') ?? false) {
					await MODULE.setting('trackedChangelogs', JSON.parse(game.settings.storage.get("world").getItem('module-credits.trackedChangelogs'))).then(response => {
						game.settings.storage.get("world").getSetting('module-credits.trackedChangelogs')?.delete() ?? false;
					});
				}
			}
			// Update Migrated Client Settings
			MODULE.setting('clientMigratedVersion', installedModuleVersion);
		}

		// Check if Client Settings need 
		if (isNewerVersion(installedModuleVersion, worldMigratedVersion) || isNewerVersion(this.needsMigration, worldMigratedVersion)) {
			// Handle Migration to 1.1.0
			if (isNewerVersion("1.1.0", worldMigratedVersion)) {
				MODULE.log('Migrating World to version 1.1.0');
				// Delete Setting if it Exists, should have been migrated to client settings
				game.settings.storage.get("world").getSetting('module-credits.trackedChangelogs')?.delete() ?? false;

				// Update Migrated Client Settings
				await MODULE.setting('worldMigratedVersion', installedModuleVersion);
			}
		}
	}
}