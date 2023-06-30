# Version 2.2.3 - Totally a Real Version
- Added an invisible feature that nobody will ever notice, but hey, at least it's something, right?
- Improved the speed by 0.0000000000000000000000000001%. Now you can watch progress slightly faster than before!
- Implemented a revolutionary feature that predicts the next word you're about to type, but we accidentally deleted it before release. Maybe next time?
- Removed the bug that was causing imaginary crashes in parallel universes. Our QA team worked really hard on this one.
- Updated the version number from 2.2.1.2 to 2.2.3 to make it look like something significant happened. We apologize for the confusion caused by this version mistake.

> Please note that the changes listed above may not have any tangible impact on your experience with the software, but we hope they bring a smile to your face as you update to Version 2.2.3!

# Version 2.2.1.2 - Wait I didn't push this a week ago?
- Fixed an issue where I used `game.i18n.translations.SETTINGS.Configure` instead of `game.i18n.localize('SETTINGS.Configure')`
- Fixed **Expanded Module Dependencies** dialog from not showing when only recommended modules are missing
- Fixed System name from being overwritten by system version

# Version 2.2.1.1 - Is it really a changelog with only one change?
- Attempted fix for Replacing Foundry VTTs v11 Info Tag since it appears my Website Tag already does this.

# Version 2.2.1 - Its Late and I am tired... Ship It now, fix it later
- Added Credit for @kristianserrano for pull request related to title in module management window
- Added check when syncing player setting that it only force reloads if the setting is has the `requiresReload` property set to `true`
- Added `event.preventDefault` to expand module details, should prevent the the Module Management window from trying to reload every time you expand a selection.
- Added Support for Foundry v11 `recommends` module relationships
- Added check when removing Foundry's Author tag to verify it exists to hopefully prevent an errors


# Version 2.2.0 - Foundry v11 Compatibility
- Increased `compatibility.maximum` to `11`
- Fixed package title selector to handle for v10 and v11 of foundry Module Management Window
  - Credit to @kristianserrano for making a pull request pointing this out.
- Replaced Foundry's `Info` and `Author` tags because, I disagree with their current implementation
  - Not saying either mine or theirs is the proper way, this is completely a personal opinion of mine
- Removed Safe Tag, because its useless information. (Once again, personal opinion)
- Added Version back to the Modules Tags
- Fixed **Expanded Module Dependencies** to not throw an error when Optional modules are not installed.
> I left `compatibility.verified` as I only did a quick test to make sure most features worked as expected.
> If I get reports that most features work as expected then I will update this to version 11

# Version 2.1.6 - Hey Listen! You have an update waiting
- Added Notification for when an Update for Core or System are waiting for you
- Fixed Missing Active Modules Count. By Default this is hidden, however there is a setting to display it either on the button or in its default location
- Fixed Locked Settings not being checked if the setting no longer exists after closing.
  - Fix provided by [@PepijnMC](https://github.com/mouse0270/module-credits/issues/89#issue-1530854149)
- Added Individual Expand Button for Module Details

# Version 2.1.5 - 99 Bugs in the Code, Take One Down, Patch it Around, 127 Bugs in the Code
- Fixed Big Picture Mode so that it properly fits if there are multiple rows of buttons.
- Fixed Expanded Module Dependencies trying to disable required/optional modules that are already disabled.
- Added Locked Modules will not show up in Expanded Module Dependencies when disabling modules
- Added custom localization text for Expanded Module Dependencies.
- Added a setting to allow you to choose between a `prompt` or `confirm` dialog for Expanded Module Dependencies
- Fixed Rollbacks not removing instances preventing you from rollback back more than once.
- Fixed issue if the reason for conflict is missing.
- MM+ Will Disable its Locked Settings feature in favor of Forced Client Settings features if it is installed and active.

# Version 2.1.4 - Smart Labels
- Auto Prefixing labels has been replaced with Smart Labels.
 - Instead of prefixing all required modules to the start of the module title, you will instead get a little arrow, showing you this module is being grouped together with the one(s) above it.
 - Hovering this arrow will show you all required modules.
- Fixed Restoring Module Default Name

# Version 2.1.3 - Dependencies Who?
- Added **Expanded Module Dependencies**. This expands Foundry's Module Dependency Dialog:
  - By allowing you to see the `title`, `id` and `reason` fields for a module.
  - Adding a checkbox to determine which modules you'd like to enable/disable
  - Supporting `relationships.flags.optional` and `relationships.optional` (If/When foundry adds this relationship)
  - Checking to see if a module is either active or if its already checked in the module management window to cut back on popups when a module is already checked but you haven't saved your module list yet.
- Added setting to create a button to the google spreadsheet used for Global Conflicts
- Updated Readme with a list of all of the new features.

# Version 2.1.2 - Being Clever is Hard...
- Added Support to theme Module Management Window using libThemer
- Updated `Smart Prefix` to batter handle catching UI modules. It now checks for a space before/after the word UI or if the would ends with UI.
- Added Global Conflicts Back. This new system handles for both core and system conflicts. Please keep in mind this system uses a publicly available google sheet. Using this feature will mean that Google will receive your IP address. If you are uncomfortable with this, turn off this feature.
- Fixed issue with rollbacks that would delete the rollback when the dialog opens instead of only when you hit yes.
- Fixed when creating a new preset, the input is focused so you can start typing.
- Presets were moved from a `world` to a `client` setting so that your presets will travel between worlds. I do apologize that this will remove all of your current presets. I'll do my best to avoid this mishap in future updates.
- Added the ability to report conflicts via [🐛 Bug Reporter](https://foundryvtt.com/packages/bug-reporter)

# Version 2.1.1 - Totalement localisable
- Went through all of the code and made sure to localize the entire project
> Please note, I just regoranized and made sure every string was localizable, I did not create any other localizations other than english, cause I only know english
- Fixed Context Menu (un)lock logic thanks to Mana
- By assigning your modules id as the id for a conflict, it will now only create one instance of this text. Good for displaying known issues.
- Added filter option to view Locked Modules

# Version 2.1.0 - Roads? Where we're going, we don't need roads.
- Added the ability to go to a previous Module Load Order
- Added setting to store X number of Previous Module Load Orders from 0 to 10 where 0 is infinite
- Added the ability to lock a module so it wont get deactivated when Deactivating All Modules
- Changed text on `Deactivate All Modules` to `Deactivate All Unlocked Modules`
- Added functionality to `Deactivate All Modules` that when holding down `ctrl` all Modules, locked or unlocked, will be deactivated
- Added a Setting to Disable Locked Modules checkbox. This setting is disabled by default, and is an opt-in feature

# Version 2.0.5 - Hey Are you Still there?!?!?
- Added Check to make sure migration can get `namespace` and `key`.

# Version 2.0.4 - Chains and Padlocks ;)
- Fixed issue with Locked Setting locking all Settings
- Added Option to Hide Locked Settings from Client
- Added Migration Control
- Locked Setting Should now update Live for Players as GM changes them
- Sync button is hidden on a locked setting as a locked setting has its setting automatically synced to all users
- Fixed type in `Smart Prefix` hint text to properly read `word`
- Known Issue: Because of the way I hide settings, there is a small flash for players when opening the settings window
- Known Issue: The setting counter does not update when settings are hidden from player.

# Version 2.0.3 - Wait required Modules can be missing?!?!?
- Added Check to verify that when trying to prefix modules, that the required module exists.

# Version 2.0.2 - I adore the things you do.
- Fixed `querySelector` for triggering changelogs
- Added the ability to rename modules text to allow you to better organize your modules.
- Added settings for auto prefix and smart prefix module titles
- remove `lib - ` when using smart prefix since smart prefix adds `Library - ` which is just the longer version of that.
- Remove marked.js and use showdown which is built into foundry

# Version 2.0.1 - The Things I forget About You.
- Fixed missing Localization for Settings
- Actually disabled `Global Conflicts` option for the time being
- Sync setting no longer by default prompts users. There is a setting to enable prompt

# Version 2.0.0 - Manifest and You
One of the major changes I've made in this update is that I've stopped trying to parse out the manifest module manually and instead use the data provided to me via the `game.modules` class. This does mean if your manifest is improperly formatted your module may not work with Module Management+ anymore. Take for example `authors` where we used to check for things like *twitter*, *patreon*, *github*, *reddit*, and *ko-fi* by placing those fields under the `authors` tag, now they will have to be under `authors.flags`.

- Added Settings Tag to Module Management to Open the settings for that specific Module
- Added Attributions for Modules
- Added Attributions, Readme, Changelog for Systems
- Added Scope Icon to settings to inform user if setting is a World/Client Setting
- Added Sync Setting button to push a setting to a specific player (right click) or all players (left click).
- Added the Ability to Lock Settings from Being Changed by Players.
- Updated Changelog/Readme Preview Dialog to use Foundry v10+ Journal Theme and look
- Disabled Global Conflicts (Some people were complaining about hangups, will look into re-enabling if requested, but I suspect many didn't use this feature.)
- Dropped Support for Using both Tidy UI - Game Settings and Module Management+ at the same time. You are still able to import Tidy UI Module Lists using MM+

# Version 1.1.11 - Forgot to disable code
- Fixed "This is not a registered game setting" error

# Version 1.1.10 - DAS but I've Never Heard of Her
- Fixed an issue with DAS 5th Edition, where the system disabled the default scrolling behavior on the Client Settings windows. simply Restored the default behavior when using MM+...
> Literally, this patch note is longer then the fix. lol

# Version 1.1.9 - Bugs Where?!?!
- Added the ability to save settings accordion state to remain open on refresh.
- Potentially Fixed changelogs breaking if the module is removed but changelog was tracked.
- Fixed issue with getting system file if it doesn't exist.

# Version 1.1.8 - Just a Little
- Potentially Fixed an issue when a module title is unable to be found
- Updated French Translation

# Version 1.1.7 - A little More Subtle
- Added French Localization (Thanks @Sasmira)
- Added Support for Warhammer Fantasy Roleplay 4th Edition's UI
- Added Option to get Global Conflicts file that is enabled by default. This will prevent MM+ from grabbing globally defined conflicts. Disabling this setting may result in less conflicts notifications.
- Fixed `.settings-list` class in Configure Settings to have a min/max height of 75vh. This should resolve double scrollbars from multiple modules.
- Fixed Socket Settings adding a global `.form-group` to the start of the Module Settings window. This setting will be be styled similar to a module header.
- Fixed Long settings names breaking settings page layout.
- Changed the notify conflicts logic on the Manage Modules button, to only show a conflict number related to active conflicts not all conflicts.

# Version 1.1.6 - Conflicting Module Must be installed
- Fixed an issue that wasn't checking if the conflicting module was installed cause MM+ to register the conflict as a known issue. Now if its a conflict both modules must be installed.

# Version 1.1.5 - Screw Your Emoji
- Added a semxy new settings screen that allows you to filter down to a setting via a search and made it so that settings are grouped into accordion-like elements. This design was HEAVILY influenced by the amazing [TidyUI Game Settings](https://foundryvtt.com/packages/tidy-ui_game-settings) module
- Added Screw Your Emoji which sorts modules and settings
- Added Setting for Full Height Module Management and Configuration Settings
- Added 🧙 Developer Mode Debug Options to make it easier to find issues users are experiencing with not seeing conflicts.
- Fixed an issue where issues were not registering in the tooltips.
- Fixed some UI designs and spacing

> **WARNING** Please be advised that TidyUI and MM+ provide almost the identical functionality. Though MM+ does its best to remain compatible with TidyUI, this is impossible to do so given how we both edit the settings page. MM+ has disabled its settings page in favor of TidyUI. This may not always be the case.

![image](https://user-images.githubusercontent.com/564874/152625472-04f4c4c6-852c-43c5-8b63-3aebfcf34cd7.png)

# Version 1.1.0 - Module Presets
- Added the ability to create, update and delete presets. A preset simply toggles a predefined list of modules as active and disabling all other modules.
- Added the ability to export and import module lists. Exporting will export the `client` and `world` settings for those modules. Importing will allow you to import those settings. Provided support to import `JSON` files created by TidyUI.
> **WARNING** The ability to import settings is considered experimental. Basically I am deleting/removing settings from foundry and replacing them with new ones. In theory this should work just fine, but I can't promise this will work perfectly. Please let me know of any issues you run into.
- Added the ability to toggle all modules (in)active.
- Added URL tag that if a module has the property `url`, clicking this tag will open that URL
- Added Socket tag if module has the property `socket` set to `true`
- Added a Library tag if module has the property `library` set to `true`
- Added `baseUrl` when rendering `README.md` or `CHANGELOG.md` files to better support relative path's for these files. This still requires the module developer to package these images with their module.
- Added the ability to toggle Package Description individually.
- Moved the setting to track Read Changelogs to a client variable so that if you read a changelog in one world, you don't have to re-read it in another world.
- Fixed Conflict(s) UI on manage button to be less invasive and improve compatibility with UI modules
- Fixed Authors property if module developer uses it as a string array instead of an object
- Fixed Internal Debugging methods using 🧙 Developer Mode 
- Removed `github` from issues tag as not everyone uses github/gitlab for issues

# Version 1.0.3 - Little Patches
- Add the ability to show both the 🐛 Bug Reporter tag and a tag linking to bugs url.
- Fixed global conflict url using `http`
- Fixed conflicts with modules not installed registering as a known conflict instead.
- Fixed issue with 🐛 Bug Reporter saying module does not support it.

# Version 1.0.2 - People using author property incorrectly
- Added a fix that will stop the module from crashing if people use the `author` property in an manner I am unware of.
- Added a 🧙 Developer Mode `error` to see the conflicting module.

# Version 1.0.1 - Conflicts with Foundry
## IMPORTANT UPDATE REGARDING PACKAGE MANIFEST+ SUPPORT
[Package Manifest+](https://foundryvtt.wiki/en/development/manifest-plus) is a wondeful set of guidelines that I am attempting to implement support for with this module. However as of January 30th 2022 their guidelines want you to add the properties directly into the root of your `module.json` file. This has been deprecated by foundry in favor of using the `flags` property. MM+ will be going forward assuming you are defining your conflicts and issue inside of the `flags` property. They are defined exactly the same, just within that property. Defining these values outside of the `flags` has been considered **DEPRECATED** by me and may stop working in future versions if MM+.

## Whats Changed/Added?
- Added the ability to list a conflict with foundry
- Added a flag under `"MMP": { "enableFoundryConfirm": true }`, using this flag will present the user with a dialog asking them to confirm enable the module if it conflicts with their version of foundry
- Fixed the tag when there is a conflict with foundry to instead of showing an Explantion Mark and Yellow Tag, it will now show a skull and the tag will be Red

To List a conflict with foundry you must define it under conflicts. Unlike other conflicts, this does not require you to define a name, however it does require that you define they type as foundry.
```json
"flags": {
  "conflicts": [
    {
      "type": "foundry",
      "description": "This module does not support founrdry version 9+. Enabling this module will have issues, due so at your own risk as this version is not supported at this time.",
      "versionMin": "9"
    }
  ]
}
```

# Version 1.0.0 - Module Management+
Module Credits has been rewritten from the ground up with all new features and what I'd like to think as better code and organization. This little project of mine has grown a lot since I started it and foundry even implemented its condensed tags as a core feature. But with its Growth I've decided, I'd just rebrand and release an official version 1 as I am pretty happy with the result. Instead of listing what has changed, I am going to list the all of the features packed into Module Management+
- Condensed the tags on the Module Management window to show just the icon instead of the text. This cleans up the interface and provides more space for longer names. As this is included in Foundry VTT 9.245+ this feature essentially backports it earlier versions of Foundry.
- Added New tags to the packages listed in the Module Management window, these tags are Changelog, Readme, Issues and Authors.
  - Changelog and Readme tags will only show if you are able to access to the `File Browser` permission. However if you have [socketlib](https://foundryvtt.com/packages/socketlib) it will attempt to execute these fuctions as the GM to provide this ability to players who do not have access.
  - The Issues tag provides built in support for 🐛 Bug Reporter, meaning if the module supports but reporter you will be presented with a dialog to file an issue directly in foundry, otherwise it will open a url to the `issues` link the the `module.json` file
  - Authors when clicked will bring up a dialog with a list of all authors in the `module.json` and display links or any information the authors have listed their.
- Cleaned up the interface for the Module Management window, by remove the text that basically said here is where you enable modules, and udpating the css for the filter search/buttons.
- When opening the Module Management window, the filter modules input will automatically be focus to allow you to quickly start typing.
- If a user is unable to manage modules, Ive reworked the interface, to only show active modules and removed the checkbox (which was disabled, but unnessary).
- Added Stripped rows to the packages to make the interface nicer on the eyes and provide seperation of content. Also updated the UI to allow a little more spacing for the same reason
- Added the ability to register and display Conflicts and Known Issues. If a conflict or known issue is defined in a modules `module.json` file or the [global file](https://github.com/mouse0270/module-credits/blob/master/conflicts.json) and the conflict is valid for the versions you have installed, it will be displayed with an ⚠️, hovering over this icon will show a list of all registered conflicts and known issues for that module related the packages installed in your instance of foundry.

# Version 0.0.4.0 - Plus more Options
- Updated to latest version of Foundry.
- Added support for Languages Tag
- Fixed `min-width` for condensed tags for Version and Compatibility Risk 
- Added Popper to allow author tags to support multiple items
- - Author tags will show a list of links or values the author of the module has included
- Fixed compatibility issue DF Chat Enhancements and Module Credits
- Added Option to Condense Author Tags if more then one Author

# Version 0.0.3.2 - Supporting Authors Again
- Fixed behavior when clicking on author. It will now take you the the authors url when clicked.

# Version 0.0.3.1 - Linux Case Sensitive File System
- Fixed an issue with Linux where the file system is case sensitive. Module Credits now uses `FilePicker` to get the correct path. Thank you LorduFreeman for helping me fix this issue

# Version 0.0.3 - All the Customization
Added Option to add font awesome icon to default tags such as Javascript, CSS and Compendium.
Added Option to condense tags. Condensing a tag will remove the text from the tag and only show the icon for that tag.
- Condensing Default Icons requires that you enable the option for default tags to have an icon
- Condensing Module Credits tags will exclude tags that reference outside sources and authors
- Condensing Compatibility Risk tag will add an icon and remove the text `Compatibility Risk` but keep the version text there
- Condensing Version tag will replace the text `Version` with the first character and remove the space between the text and number

Added the ability to load local `readme.md` files within foundry if they are provided
- Please note depending on how the module `readme.me` file references images, they may or may not load.

## Version Tracker
Module Credits will now track version and `changelog.md` files, so if a modules update and they include a `changelog.md` file, module credits will display a list of all updated mods including a `changelog.md` file. Please note that this feature requires module developers to soft opt in by providing a `changelog.md` file with there modules.
- Added Module Changelogs button to **Help and Documentation** section of the side bar, to see all changelogs for all supported modules.

# Version 0.0.2 - MORE TAGS
In this update the module has added the option to add a tag for bugs/issues, wiki/readme and changelog. If the `module.json > [readme, bugs, changelog]` url is setup the module will add colored tags for these options.

This version also include an option to display a local `changelog.md` file within foundry as well. If both `module.json > changelog` and a local `changelog.md` file exists, it will load the local changelog in a window in foundry.

Module Credits now uses [Marked.js](https://github.com/markedjs/marked) and [DOMPurify](https://github.com/cure53/DOMPurify) to allow for local `changelog.md` parsing. This feature is also used to allow users to use markdown and html within their localization for module settings. This feature will most likely be moved into its own library in a future release.

- Added Setting to allow you to show Wiki/Readme tag
- Added Setting to allow you to show Bugs/Issues tag
- Added Setting to allow you to show Changelog tag
- Added Setting to read local `changelog.me` file
- Fixed the border color to `black` to match the default foundry style... Yes I hate it... but I really don't want to change default foundry styles.

# Version 0.0.1 - Initial Release
This module adds a tag to the **Manage Modules** window that list the authors of the module. If the author has a url, it will make the tag a clickable link to that url.

This Module also checks to see if the module has a link listed in the, if it does, it will make the version tag of the module a clickable element as well. Click on this element will open the `module.json > url` property in a new browser tab.
