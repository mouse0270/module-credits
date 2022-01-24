# Module Credits
This module adds a tag to the **Manage Modules** window that list the authors of the module. If the author has a url, it will make the tag a clickable link to that url.

This Module also checks to see if the module has a link listed in the, if it does, it will make the version tag of the module a clickable element as well. Click on this element will open the `module.json > url` property in a new browser tab.

#### MORE TAGS
Now with more tags, module credits now provides tags for bugs/issues, wiki/readme and changelogs. If the `module.json > [readme, bugs, changelog]` url is setup the module will add colored tags for these options.

Module Credits now also includes an option to display a local `changelog.md` file within foundry as well. If both `module.json > changelog` and a local `changelog.md` file exists, it will load the local changelog in a window in foundry.

![image](https://user-images.githubusercontent.com/564874/127723920-7f135dea-4677-42a9-90d9-c273463e0735.png)

### All the Customization
Module Credits now tries to clean up the module management tags section by adding default icons for Javascript, CSS and compendium. It then favors hiding the text and showing just the icons added, to allow for a cleaner look. All of this is configurable for you to find the perfect balance. Module credits will condense its own tags if they remain within foundery, for example, a changelog tag that opens up locally, will just show the changelog icon, however an external icon will leave the text visible. This is to help indicate that you will be open a browser window by click on that tag.

![image](https://user-images.githubusercontent.com/564874/127776582-ce214ae9-0c41-42ae-9cee-85e04fae5792.png)

### Plus more Options
This version of Module credits mostly just fixes a few issues and expands on some other options. It fixes missing support for the languages tab, the `min-width` property on the version and compatibility risk tags, Fixed compatibility with other modules that happen to use the same libraries as Module Credits. The main update to the module is the new Condensed Author tags. Now if a module has more then one author, they can be condensed down to one tag. Click on an author tag will now list the email, url and discord (If provided by the author) in a small tooltip. You can click on copy these elements with your mouse.

![image](https://user-images.githubusercontent.com/564874/149253619-f33409fb-4812-4ab9-8a36-aa1c721988ef.png)

### The Story of Conflicts and More.
Version 0.0.4.5 has added the ability to show conflicts on the module management screen to allow the user to see any known conflicts between modules and decide how they want to proceed. There are a few ways for a developer to define a conflict, You can do so in your module by using the api provided by module-credits, an example is provided below. **I HIGHLY SUGGEST AGAINST THIS METHOD** because it requires your module to be loaded before Module Credits can determine if there is a conflict.

I **HIGHLY RECOMMEND ONE OF THE FOLLOWING INSTEAD**. The next method of registering a conflict is making a pull request on github on the `conflicts.json` file, this file will get updated and pulled by module credits when foundry loads. This means that even if your module isn't loaded the conflict will show for both modules to allow the user to see the conflict before the module is loaded. Lastly you can define a conflict in your modules `module.json` file using the [Package Manifest+](https://foundryvtt.wiki/en/development/manifest-plus). Module Credits will process this data and display it for all installed modules 

**WARNING** Package Manifest+ does not currently provide a way to provide a message about the conflict and will display as a minor conflict with the description being *No Details Provided*. If the league updates their specifications, I will update mine to include that.

Lastly if your a developer and already using [Changelogs & Conflicts](https://foundryvtt.com/packages/lib-changelogs) by theripper93, then you really don't have to do anything to add support for Module Credits as Module Credits provides a polyfill for Changelogs & Conflicts so that his api calls are registered into Module Credits if his module is not enabled. However his system does require that the conflict be registered in code, meaning his conflicts will only show if your module is enabled. Switching to using either the pull request method on this github or defining your conflict using [Package Manifest+](https://foundryvtt.wiki/en/development/manifest-plus) is **HIGHLY** recommended.

#### How to define a conflict in code
```
game.modules.get('module-credits`).api.defineConflict({
	moduleID: 'YOUR MODULE NAME',
	conflictingModuleID: 'THE MODULE NAME THAT CONFLICTS WITH YOURS',
	description: 'MARKDOWN DESCRIPTION OF THE CONFLICT BETWEEN YOUR TWO MODULES',
	status: 'minor || major || breaking || critical'
})
```
![image](https://user-images.githubusercontent.com/564874/149989069-022cac3e-5381-40a9-8a86-8264546e0bd9.png)


#### Bug Reporter Support
Those of you with keen eyes, will have noticed that the issues tag for Bug Reporter shows a bug icon. Module Credits now adds suppoer for [🐛 Bug Reporter](https://foundryvtt.com/packages/bug-reporter). If Bug Reporter is enabled and the module has opt'ed into the system, you can click that icon to quickly report an issue with that module using `Bug Reporter`. If you don't have bug reporter, don't worry the issues link will still appear as it does in the example image for `About Time` and `Alternative Rotation`

#### Local Readme.md Support
Clicking on the wiki icon or the purple tag with an circle information will open the `readme.md` file within foundry now.
**WARNING** Depending on how module authors added images to their `readme.md` file the images may or may not appear

![image](https://user-images.githubusercontent.com/564874/127776803-4fa3f278-7a3a-4f9f-9fa5-e4f64147b0ad.png)

#### Version Tracker Support
Have you updated a module recently but no idea what actually changed between versions. Module Credits will now show you a changlelog window of all modules you have that have recently updated. *Please note this feature requires the module to soft opt in by providiing a `changelog.md` file with their module. If the module does not include this file, it will not be tracked*

![image](https://user-images.githubusercontent.com/564874/127776931-968120f0-469a-4135-908e-2b25f18a692e.png)



#### Credits
Libraries used in creating Module Credits
- [Marked.js](https://github.com/markedjs/marked) 
- [DOMPurify](https://github.com/cure53/DOMPurify) 
- [Popper](https://popper.js.org/) 
