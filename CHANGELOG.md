# Module Credits Changelog

## Version 0.0.2 - MORE TAGS
In this update the module has added the option to add a tag for bugs/issues, wiki/readme and changelog. If the `module.json > [readme, bugs, changelog]` url is setup the module will add colored tags for these options.

This version also include an option to display a local `changelog.md` file within foundry as well. If both `module.json > changelog` and a local `changelog.md` file exists, it will load the local changelog in a window in foundry.

*Testing out a feature that allows you to use markdown/html within localization for settings. This may be moved into its own library*

- Added Setting to allow you to show Wiki/Readme tag
- Added Setting to allow you to show Bugs/Issues tag
- Added Setting to allow you to show Changelog tag
- Added Setting to read local `changelog.me` file
- Fixed the border color to `black` to match the default foundry style... Yes I hate it... but I really don't want to change default foundry styles.

## Version 0.0.1 - Initial Release
This module adds a tag to the **Manage Modules** window that list the authors of the module. If the author has a url, it will make the tag a clickable link to that url.

This Module also checks to see if the module has a link listed in the, if it does, it will make the version tag of the module a clickable element as well. Click on this element will open the `module.json > url` property in a new browser tab.