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
- Adds the ability for you to view conflicts that may be listed by a module developer, so you can quickly and see any issues that may be known.

Not only has MM+ added all of these new tags, it has take steps to help managing your modules easier by providing the ability to Define Module Presets, Export and Import Module lists with settings. Module Presets are custom lists of active modules you can quickly toggle between. So if you run multiple worlds with different active modules you can toggle between them in just a few clicks. When exporting a module list, it will export all active modules and settings it can export. When importing a MM+ Export file, you will be prompted to choose which modules and settings you would like to import. MM+ Does provide support for [Tidy UI - Game Settings](https://github.com/sdenec/tidy-ui_game-settings) exported modules file.

Lastly, MM+ changes a few designs on the Module Management window to make it a little more clean. To do this it removes the text at the top that tells you about this screen. MM+ also removes the individual filter options in favor of a dropdown to choose what you want to filter to.

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
Module Management+ adds support for [🐛 Bug Reporter](https://foundryvtt.com/packages/bug-reporter). If Bug Reporter is enabled and the module has opt'ed into the system, you can click that icon to quickly report an issue with that module using `Bug Reporter`. If you don't have bug reporter, don't worry the issues link will still appear in the modules tags.

### [socketlib](https://github.com/manuelVo/foundryvtt-socketlib)
Module Management+ adds support for [socketlib](https://github.com/manuelVo/foundryvtt-socketlib). If socketlib is enabled then MM+ will allow users who don't have access to the `FilePicker` to be able to view Readme, changelogs and attribution files. Also if you have socklib installed you will be able to sync settings to all players or specific players.

### [Tidy UI - Game Settings](https://github.com/sdenec/tidy-ui_game-settings)
Module Management+ supports importing module lists that were exported from [Tidy UI - Game Settings](https://github.com/sdenec/tidy-ui_game-settings). Please keep in mind that Tidy UI - Game Settings and MM+ do very similar things and both should not be active at the same time. I will not fix issues related to Tidy UI - Game Settings with the exception of importing module lists.

## Credits
Libraries used in creating Module Management+
- [Marked.js](https://github.com/markedjs/marked) 
- [DOMPurify](https://github.com/cure53/DOMPurify) 
- [Tippy.js](https://atomiks.github.io/tippyjs/) 
- [Popper.js](https://popper.js.org/) 