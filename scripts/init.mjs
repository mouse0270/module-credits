// GET MODULE CORE
import { MODULE } from './_module.mjs';

// IMPORT SETTINGS -> Settings Register on Hooks.Setup
import './_settings.mjs';

//import * as packages from '/common/packages.mjs';
import { MMP } from './module.mjs';

Hooks.once('socketlib.ready', () => {
	MODULE.debug('SOCKETLIB Ready - SOCKET'); // WONT REGISTER CAUSE CALL HAPPENS WAY TO EARLY
	MMP.registerSocketLib();
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// 🧙 DEVELOPER MODE HOOKS -> devModeReady
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MODULE.ID, 'level', {
		choiceLabelOverrides: {
			NONE: 0,
			ERROR: 1,
			WARN: 2,
			DEBUG: 3,
			INFO: 4,
			ALL: 5,
		}
	});
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// FOUNDRY HOOKS -> READY
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('ready', async () => {
	MMP.init();
});

Hooks.on('renderSidebarTab', MMP.updateSettingsTab)
Hooks.on('renderModuleManagement', MMP.renderModuleManagement);
Hooks.on('renderSettingsConfig', MMP.renderSettingsConfig);