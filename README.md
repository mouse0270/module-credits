# Module Management+
Module Management+ the module management screen and so much more. This module includes the following features

- View `README.md` and `CHANGELOG.md` files right within foundry.
- Displays a list of all unread changelogs to the user (this feature can be disabled in the settings). It tracks the changelogs, to show you when there is a new one for you to view.
- Add more useful tags to the module managment window, such as the bugs/issues tag and displayes the author(s) in the tags.
- Author Tags when clicked on will show you an additional information about the author such as their email, discord, or website. Module Management+ Supports Manifest+ additional author tags via a setting and can also display: twitter, ko-fi, patreon and reddit.
- Will show defined conflicts to the user on the module managment screen to let you know when there is known issue with another mod
- Will show when a module has listed itself ad deprecated

## How do I add Support for MMP fin my module?
The first step is to provide a `README.md` and `CHANGELOG.md` file with your package. You do not need to include both, MMP will only display the ones you include, I suggest both though. 

If you'd like to use the other features of MMP such as Conflicts, Known Issues or Deprecated Modules, you just have to use the Scheme provided by [Package Manifest+](https://foundryvtt.wiki/en/development/manifest-plus) when creating your `module.json` file and Module Management+ when read those values and display them to the user in foundry.

### Define Conflicts and Known Issues
To Define a conflict or known issue for your module, you can do so in one of two ways. The first is to define the conflict/known issue using a schema similar to the one provided in [Package Manifest+](https://foundryvtt.wiki/en/development/manifest-plus) in your `module.json` file using the details below. The `conflicts` field provides a mapping of modules which are used to define a conflict or known issue. If you are aware of a conflict or known issue, I highly suggest use this method.

| Field | Required | Description |
|-------|----------|-------------|
| name  | false    | If you do not provide a conflicting module name, MMP will register the conflict as a known issue |
| description | false | This is the text that will be displayed to the user about the conflict/known issue. If not description is defined, the module will list **No Details Provided** |
| versionMin | true | The conflict/known issue will only be shown if the version number is greater or equal to the version listed here |
| versionMax | false | The conflict/known issue will only be shown if the version number is less than the number listed here |

```json
"conflicts": [
	{
		"name": "module-name",
		"description": "A description detailing the conflict between the two modules.",
		"versionMin": "a.b.c",
		"versionMax": "a.b.c"
	}
]
```
However, you may not always be aware of a known issue or conflict when you publish your module, and pushing a whole update just to define a conflict seems a little excessive. This is why I have provided the `conflicts.json` file in my github at [Module Management+](https://github.com/mouse0270/module-credits). Simply make a pull request (or create an issue and I will do my best to manually udpate it too) defining your module's conflict/known issue and as soon as I can accept it, it will be available to everyone using Module Management+.
| Field | Required | Description |
|-------|----------|-------------|
| moduleID | true | This is your modules name |
| conflictingModuleID | false | Leaving this field empty will define your conflict as a known issue. Its great for when you find out there is a major bug in your module, but you may not be able to fix it ASAP |
| description | false | This is the text that will be displayed to the user about the conflict/known issue. If not description is defined, the module will list **No Details Provided** |
| versionMin | true | The conflict/known issue will only be shown if the version number is greater or equal to the version listed here |
| versionMax | false | The conflict/known issue will only be shown if the version number is less than the number listed here |

An example of defining aconflict would look like this:
```json
[
	{
		"moduleID": "module-name",
		"conflictingModuleID": "conflicting-module-name",
		"description": "A description detailing the conflict between the two modules.",
		"versionMin": "a.b.c",
		"versionMax": "a.b.c"
	}
]
```
An example of defining a know issue would look like this:
```json
[
	{
		"moduleID": "module-name",
		"description": "A description detailing the conflict between the two modules.",
		"versionMin": "a.b.c"
	}
]
```

## Supported Modules
### Package Manifest+
Module Management+ uses the [Package Manifest+](https://foundryvtt.wiki/en/development/manifest-plus) Schema as a guideline for defining conflicts, deprecated modules, and additional author information. I did my best to match support and the intended usecase of the Package Manifest+ Schema, if you notice something is missing or conflicting, plese let me know.

### Bug Reporter
Module Management+ adds support for [🐛 Bug Reporter](https://foundryvtt.com/packages/bug-reporter). If Bug Reporter is enabled and the module has opt'ed into the system, you can click that icon to quickly report an issue with that module using `Bug Reporter`. If you don't have bug reporter, don't worry the issues link will still appear in the modules tags.

### Changelogs & Conflicts
Module Management+ adds support for [Changelogs & Conflicts](https://foundryvtt.com/packages/lib-changelogs). If a developer uses the API provided for Changelogs & Conflicts, but you don't have it enabled, don't worry, Module Management+ polyfills its API and will display that information as if they were using Module Management+.

> I HIGHLY suggest that developers do not declare changelogs/conflicts via an API. Defining these values in your modules code requires the user to enable your module to see the conflict. Check out How to add support for Module Management+ for suggested ways to implement support.

## Credits
Libraries used in creating Module Credits
- [Marked.js](https://github.com/markedjs/marked) 
- [DOMPurify](https://github.com/cure53/DOMPurify) 
- [Popper](https://popper.js.org/) 
