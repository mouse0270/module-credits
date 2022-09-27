# Module Management+
Module Management+ improves upon foundry's vtt Manage Module and Configure Settings windows by adding additional features and functionalities to both managing modules and their settings.

The Features Included in MM+ Are
- View modules/system Readme's, Changelogs and Attributions Files
- View authors of modules and any of the links they provide for themselves
- View any conflicts that a module may have listed with another module in your load order
- View if a setting is a `world` or `client` setting
- Open the settings for just a specific module
- Open the website of the module for quick access to any additional help that site might provide
- Open the Issues link of the module to report or find an issue you may have.
- Create Module Presets to toggle between different lists of active modules quickly and easily
- Export Module List with Settings
- Import Module List (with support for import Tidy UI - Game Settings Export)
- Sync a setting to all players (left clicking) or specfic player (right clicking)
- Lock a setting, preventing players from adjusting it.
- Converted Module Filter to Dropdown for Simplier look and feel.
- Rename Modules to allow you to better organize your modules.
- Auto Prefixing that will prefix module titles with their required modules for better sorting.
 - Please keep in mind that modules like `Levels` will be names `Wall Height - Levels` as `Levels` requires `Wall Height`
- Smart Prefixing that will attempt to prefix modules with their type of group them together. For example, Library Modules will be prefixed with `Library - `, UI modules will be prefixed with `UI - ` and Map modules will be prefixed with `Maps - `
- Added the ability to rollback to previous module load list. If you're like me and changing your module list alot, this lets you quickly enable a previous module list.
- Global Conflicts using a google spreadsheet. This is an opt in feature. This new system handles for both core and system conflicts. Please keep in mind this system uses a publicly available google sheet. Using this feature will mean that Google will receive your IP address. If you are uncomfortable with this, turn off this feature. 
 - Please do not harass developers if the information in the Global Conflicts is outdated.
- Expanded Module Dependencies

## Manage Modules
MM+ expands the Manage Module window by adding additional tags and functionality. Some of the new tags are: 
- Authors which allows you to view the authors of the module along with any links or information they may provide.
- Readme which will allow you to view the readme in foundry if provided. With custom support to get the Readme from GitHub as well.
- Changelog which will allow you to view the changelog in foundry if provided. With custom support to get the Changelog from GitHub as well.
- Attributions which will allow you to view the attributions in foundry if provided. With custom support to get the Attributions from GitHub as well.
- Tags to indicate if the module is a listed as a `library` or has `socket` functionality.
- A link to the modules website or issues pages.
- If the module has any settings options, there will be a tag that will open up those specific settings.
- Support for [🐛 Bug Reporter](https://foundryvtt.com/packages/bug-reporter), so if a module supports [🐛 Bug Reporter](https://foundryvtt.com/packages/bug-reporter) instead of opening the issues paage, you'll be presented with [🐛 Bug Reporter](https://foundryvtt.com/packages/bug-reporter) Dialog to submit a bug within foundry.
- Adds the ability for you to view conflicts that may be listed by a module developer or via the Global Conflicts system, so you can quickly and see any issues that may be known.
- You can report a conflict when using [🐛 Bug Reporter](https://foundryvtt.com/packages/bug-reporter) by right Clicking on the module in the module management window and selecting `Report Conflict`

![image](https://user-images.githubusercontent.com/564874/192642397-50d2fbff-3382-4666-ac30-bd52369d7a4d.png)


Not only has MM+ added all of these new tags, it has take steps to help managing your modules easier by providing the ability to Define Module Presets, Export and Import Module lists with settings. Module Presets are custom lists of active modules you can quickly toggle between. So if you run multiple worlds with different active modules you can toggle between them in just a few clicks. When exporting a module list, it will export all active modules and settings it can export. When importing a MM+ Export file, you will be prompted to choose which modules and settings you would like to import. MM+ Does provide support for [Tidy UI - Game Settings](https://github.com/sdenec/tidy-ui_game-settings) exported modules file.

Lastly, MM+ changes a few designs on the Module Management window to make it a little more clean. To do this it removes the text at the top that tells you about this screen. MM+ also removes the individual filter options in favor of a dropdown to choose what you want to filter to.

### Expanded Module Dependencies
This expands Foundry's Module Dependency Dialog:
- By allowing you to see the `title`, `id` and `reason` fields for a module.
- Adding a checkbox to determine which modules you'd like to enable/disable
- Supporting `relationships.flags.optional` and `relationships.optional` (If/When foundry adds this relationship)
- Checking to see if a module is either active or if its already checked in the module management window to cut back on popups when a module is already checked but you haven't saved your module list yet.

![image](https://user-images.githubusercontent.com/564874/192641796-c8366087-4c1c-4321-9eb3-c6ed5835087a.png)


# Configure Settings
MM+ adds icons to show if a setting is a `client` or `world` setting to make it easier for Game Masters to know which settings are which. It also adds the ability to lock a setting so that only Game Masters can change this setting. If you have [socketlib](https://github.com/manuelVo/foundryvtt-socketlib) active you will be able to sync a setting to all players by left clicking on the `Sync Setting` icon or to a specific player by right clicking on the `Sync Setting` icon and choosing an active player from the list, if not other players are logged in, right clicking will do nothing.

> Please note that the setting that gets synced is the **SAVED** setting. For example, if you enable an option by clicking the checkbox for that setting, but don't hit `Save Changes` it will send the **SAVED** value and not the currently displayed value of `true`. Please make sure to hit `Save Changes` before syncing settings. This feature may be adjusted in the future based on user feedback.

## Readme, Changelogs and Attributions
MM+ provides a custom window inside foundry that will display these files content if provided. Making it easy to see what a modules does, what has changed, or any additional attributions the module author would like to include. MM+ provides support from grabbing remote content from GitHub if the user links to a file using that service.

## Registering a Conflict
With the release of MM+ v2+, conflicts have been moved from `flags.conflicts` to `relationships.conflicts` as this is the offical location for conflicts in FoundryVTT v10+. Registering a conflict now fits this scheme
```
	{
		"id": "tidy-ui_game-settings",
		"type": "module",
		"manifest": "https://raw.githubusercontent.com/sdenec/tidy-ui_game-settings/master/module.json",
		"reason": "Tidy UI and MM+ perform many of the same functions. MM+ will not be fixing compatibility issues between the two modules.",
		"compatibility": {
			"minimum": "0.0.0"
			"maximum": undefined
			"verified": undefined
		}
	}
```

> Please not that if not values in `compatibility` are defined than MM+ will always show the conflict. However if you define a `minimum` or `maximum` value MM+ will alow show the conflict if the conflicting module falls between those versions. `minimum` version is defaulted to `0.0.0`. If `maximum` is `undefined` then it will assume the module is conflicted if conflicting module version is greater than `minimum`.

## Supported Modules
### [🐛 Bug Reporter](https://foundryvtt.com/packages/bug-reporter)
Module Management+ adds support for [🐛 Bug Reporter](https://foundryvtt.com/packages/bug-reporter). If Bug Reporter is enabled and the module has opt'ed into the system, you can click that icon to quickly report an issue with that module using `Bug Reporter`. If you don't have bug reporter, don't worry the issues link will still appear in the modules tags. You can also report a conflict with 🐛 Bug Reporter by right clicking on the module name and selecting `Report Conflict`

### [socketlib](https://github.com/manuelVo/foundryvtt-socketlib)
Module Management+ adds support for [socketlib](https://github.com/manuelVo/foundryvtt-socketlib). If socketlib is enabled then MM+ will allow users who don't have access to the `FilePicker` to be able to view Readme, changelogs and attribution files. Also if you have socklib installed you will be able to sync settings to all players or specific players.

### [libThemer](https://foundryvtt.com/packages/lib-themer)
Module Management+ adds support for [libThemer](https://foundryvtt.com/packages/lib-themer). If libThemer is Enabled then MM+ will register custom themes to allow you to clean up your Module Management Window. Take a look at the theme below:

![image](https://user-images.githubusercontent.com/564874/192642576-72d1b3d9-232d-42ac-876a-24055d725034.png)

### [Tidy UI - Game Settings](https://github.com/sdenec/tidy-ui_game-settings)
Module Management+ supports importing module lists that were exported from [Tidy UI - Game Settings](https://github.com/sdenec/tidy-ui_game-settings). Please keep in mind that Tidy UI - Game Settings and MM+ do very similar things and both should not be active at the same time. I will not fix issues related to Tidy UI - Game Settings with the exception of importing module lists.

## Credits
Libraries used in creating Module Management+
- [Tippy.js](https://atomiks.github.io/tippyjs/) 
- [Popper.js](https://popper.js.org/) 
- [Public Google Sheets Parser](https://github.com/fureweb-com/public-google-sheets-parser)
