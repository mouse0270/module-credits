![logo-rectangle](https://user-images.githubusercontent.com/564874/127776193-bbaecf18-9567-400c-a6c3-7bec66137645.png)

This module adds a tag to the **Manage Modules** window that list the authors of the module. If the author has a url, it will make the tag a clickable link to that url.

This Module also checks to see if the module has a link listed in the, if it does, it will make the version tag of the module a clickable element as well. Click on this element will open the `module.json > url` property in a new browser tab.

#### MORE TAGS
Now with more tags, module credits now provides tags for bugs/issues, wiki/readme and changelogs. If the `module.json > [readme, bugs, changelog]` url is setup the module will add colored tags for these options.

Module Credits now also includes an option to display a local `changelog.md` file within foundry as well. If both `module.json > changelog` and a local `changelog.md` file exists, it will load the local changelog in a window in foundry.

![image](https://user-images.githubusercontent.com/564874/127723920-7f135dea-4677-42a9-90d9-c273463e0735.png)

#### Credits
Libraries used in creating Module Credits
- [Marked.js](https://github.com/markedjs/marked) 
- [DOMPurify](https://github.com/cure53/DOMPurify) 
