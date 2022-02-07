// GET MODULE CORE
import { MODULE } from './_module.mjs';

// IMPORT SETTINGS -> Settings Register on Hooks.Setup
import './_settings.mjs';


import { MIGRATE } from './_migrate.mjs';
import { MMP } from './module.mjs';

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// 🧙 DEVELOPER MODE HOOKS -> devModeReady
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MODULE.ID, 'level', {
		choiceLabelOverrides: {
			0: 'NONE',
			1: 'ERROR',
			2: 'WARN',
			3: 'DEBUG',
			4: 'INFO',
			5: 'ALL'
		}
	});
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// socketlib HOOKS -> socketlib.ready
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('socketlib.ready', () => {
	MODULE.debug('SOCKETLIB Ready - SOCKET'); // WONT REGISTER CAUSE CALL HAPPENS WAY TO EARLY
	MMP.registerSocketLib();
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// FOUNDRY HOOKS -> READY
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.once('ready', async () => {	
	MMP.addSupportStyles();
});
Hooks.once('ready', async () => {
	await MIGRATE.init();
	
	MMP.init();
});

/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
// FOUNDRY HOOKS -> MODULE FUNCTIONS
/* ─────────────── ⋆⋅☆⋅⋆ ─────────────── */
Hooks.on('renderSidebarTab', MMP.updateSettingsTab);
Hooks.on('renderModuleManagement', MMP.renderModuleManagement);
Hooks.on('renderSettingsConfig', MMP.renderSettingsConfig);