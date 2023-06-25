=== UNDER CONSTRUCTION - NO USABLE FUNCTIONALITY (yet) ===

=== take a peek if you like at the UI.  The main .JS file is not tested ===

The Rainbow-Maker is a tool for producing "sculpted" gradients.  Typically, when you use graphics creation software, you can create a shape and fill it with a gradient, but the gradient itself is not in the shape of the shape; it is simply linear, radial or conic and then your shape "cuts" it like a "cookie-cutter".  The Rainbow-Maker creates gradients that are themselves shaped (sculpted) like your shape.

The Rainbow-Maker was originally written in PHP 5.3 and required a server to produce the graphics.  It used an HTML "form" for a user-interface front-end, which sent the data to the server to be processed.  The PHP software itself was not well organized for one simple reason: it needed to be a single "PHP Class" to be hosed on <a href='https://www.phpclasses.org/package/7363-PHP-Create-transparent-gradient-images.html'>PHPClasses.org</a>.  That was before JavaScript supported graphics, and the MS Internet Exploder was king.  It was unfriendly to use, but it worked.  You can download the original pakage from <a href='https://softmoon-webware.com/OpenSource.php'>SoftMoon-WebWare</a>.  It is not compatable with later (current) versions of PHP, and will not be updated.

This repository will host the port of the original PHP Rainbow-Maker to JavaScript.  It will have an HTML User-Interface that is more friendly and allows the composition of complete graphics images; whereas the original PHP-based software only created a single gradient per "call" and you had to compose complex graphics in steps and feed the output of one step to the input (background-image) of the next step, and if you screwed up a step, you had to start over.

The RainbowMaker will be cross-platform compatible and should work in any modern browser (FireFox, Chrome, Edge, Safari, Opera, etc.) on any operating system (MS-Windows, Apple-OS, Linux, etc.), with no executable software to install on your computer.

A simple example of what this package can produce:
<img src='RainbowGallery/mystar.png'>
<img src='RainbowGallery/myotherstar.png'>
<img src='RainbowGallery/mythirdstar.png'>

Compare that with what most graphics development software can produce:
<img src='RainbowGallery/oldstar1.png'>

The Rainbow-Maker can work with all kinds of standard geometrical shapes, shapes you define geometrically, as well as "random" shapes in a bitmap filter.  It can also do so much more with your sculpted gradient. All these sculpted gradient images were created with just a couple of simple steps in just a minute or two each....
<img src='RainbowGallery/7-13.png'>
with no copying, cutting, or pasting
<img src='RainbowGallery/16of20.png'>
<img src='RainbowGallery/bi-spiral star-flower.png'>
<img src='RainbowGallery/candy mints.png'>
<img src='RainbowGallery/rainbow starlet.png'>
<img src='RainbowGallery/TheBigIsland.png'>

This RainbowMaker package relies on the MasterColorPicker package for dependent support files.  The MasterColorPicker also gives this package a superb color-management system, that can also be used for all your other projects.

To use this package, you will need to also download the <a href='https://github.com/softmoonwebware/mastercolorpicker'>MasterColorPicker</a> project from GitHub and merge their root folders; any subfolders of the root folders with matching paths should be combined also.  Note that GitHub and/or your unzipping software may add a wrapper folder around the root folders of these projects, so you will have to use your knoodle to figure out which folder is the root of each project.  These root folders will be named “MasterColorPicker” and “Rainbow-Maker”, but so may their wrappers!  More confusingly, the “Rainbow-Maker” (with the dash) root folder contains yet another folder named “RainbowMaker” (without the dash).  The root folders of both projects contain the “images” folder and the “JS_toolbucket” folder.  The “RainbowMaker” folder that contains the “index.html” file is NOT the root folder.  These two root folders' contents will be combined and the new combined folder can be named what ever you like (e.g. “SMWW”) or you may place the combined contents into an exsiting folder (e.g. “htdocs” on an Apache server for example) with other unrelated content.

You don't need a server to use the RainbowMaker or MasterColorPicker packages, but that can give them more options to make your workflow easier.  You can use a local (“localhost”) server on your computer, or a server in the cloud.  Or you can simply place the files in any folder in any location in your system and access the project directly from there without a server or any internet access.

You will also have to extract the MasterColorPicker HTML from the “MasterColorPicker_desktop.html” file; instructions for doing so are in the “MasterColorPicker_instructions.html” file.  The MasterColorPicker project comes packaged in a stand-alone form for desktop usage; this makes it easy to download and use immediately.  You will need to incorporate it into the RainbowMaker project in one of two ways.  It was designed to do this, so it's not too hard.

(1) If you don't want to use a server, open the “RainbowMaker/index.html” file in your favorite text editor.  Search for and find the line that says “&lt;?php include '../color-pickers/SoftMoon-WebWare/MasterColorPicker2.htm' ?&gt;” (under the line that says “INSERT MasterColorPicker HERE”).  Remove the entire PHP line and replace it with the entire MasterColorPicker HTML (many lines) that you extracted from the “desktop” file.  Then save the index.html file.

(2) If you want to use a server, simply save the extracted MasterColorPicker HTML as a new file: “color-pickers/SoftMoon-WebWare/MasterColorPicker2.htm” noting that the folder path already exists.  If your server runs PHP, you need to either (a) rename the “RainbowMaker/index.html” file to “RainbowMaker/index.php” or (b) configure your server to let PHP parse .html files.  If your server does not run PHP, you need to replace the “&lt;?php include '../color-pickers/SoftMoon-WebWare/MasterColorPicker2.htm' ?&gt;” line in the “RainbowMaker/index.html” file with one that is suitable to the programming language you use, or to SHTML for server-side-includes.  If your server does not support these technologies, you can still serve the RainbowMaker from there, but you will have to manually include the MasterColorPicker HTML in the “RainbowMaker/index.html” file as described in option (1) above.  Also, without PHP (or another programming language support) you will not be able to reap the benefits added to both these packages when hosted on a server; you might as well just keep your files local.

Using a server to “include” the MasterColorPicker HTML will also give you the easiest time when either of these packages have their HTML updated. You simply need to replace the one file that is updated, and not worry about recombining the new HTML.

More coming.....
