# Module Credits Changelog

## Version 0.0.3 - All the Customization
Added Option to add font awesome icon to default tags such as Javascript, CSS and Compendium.
Added Option to condense tags. Condensing a tag will remove the text from the tag and only show the icon for that tag.
- Condensing Default Icons requires that you enable the option for default tags to have an icon
- Condensing Module Credits tags will exclude tags that reference outside sources and authors
- Condensing Compatibility Risk tag will add an icon and remove the text `Compatibility Risk` but keep the version text there
- Condensing Version tag will replace the text `Version` with the first character and remove the space between the text and number
Added the ability to load local `readme.md` files within foundry if they are provided
- Please note depending on how the module `readme.me` file references images, they may or may not load.
### Version Tracker
Module Credits will now track version and `changelog.md` files, so if a modules update and they include a `changelog.md` file, module credits will display a list of all updated mods including a `changelog.md` file. Please note that this feature requires module developers to soft opt in by providing a `changelog.md` file with there modules.

## Version 0.0.2 - MORE TAGS
In this update the module has added the option to add a tag for bugs/issues, wiki/readme and changelog. If the `module.json > [readme, bugs, changelog]` url is setup the module will add colored tags for these options.

This version also include an option to display a local `changelog.md` file within foundry as well. If both `module.json > changelog` and a local `changelog.md` file exists, it will load the local changelog in a window in foundry.

Module Credits now uses [Marked.js](https://github.com/markedjs/marked) and [DOMPurify](https://github.com/cure53/DOMPurify) to allow for local `changelog.md` parsing. This feature is also used to allow users to use markdown and html within their localization for module settings. This feature will most likely be moved into its own library in a future release.

- Added Setting to allow you to show Wiki/Readme tag
- Added Setting to allow you to show Bugs/Issues tag
- Added Setting to allow you to show Changelog tag
- Added Setting to read local `changelog.me` file
- Fixed the border color to `black` to match the default foundry style... Yes I hate it... but I really don't want to change default foundry styles.

## Version 0.0.1 - Initial Release
This module adds a tag to the **Manage Modules** window that list the authors of the module. If the author has a url, it will make the tag a clickable link to that url.

This Module also checks to see if the module has a link listed in the, if it does, it will make the version tag of the module a clickable element as well. Click on this element will open the `module.json > url` property in a new browser tab.
