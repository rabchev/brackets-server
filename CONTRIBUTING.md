Contributing
============

Steps to build Brackets Server
------------------------------

Grunt CLI is a prerequisite.

```shell
    $ git clone https://github.com/rabchev/brackets-server.git
    $ cd brackets-server
    $ git submodule update --recursive --init
    $ npm install
    $ grunt build
```

To start Brackets Server:

```shell
    $ node bin/run -d
```

To run all tests:

```shell
    $ grunt test
```

To debug client scripts, open Gruntfile.js and uncomment all occurrences of:

```javascript
    //   generateSourceMaps: true,
    //   useSourceUrl: true,
```

Steps to update Adobe Brackets source code
------------------------------------------

NOTE: Usually, updating Brackets source requires fixing conflicts and compatibility issues with Brackets Server.

```shell

$ git clone https://github.com/rabchev/brackets-server.git
$ git submodule update --init
$ cd brackets-src
$ git fetch --tags
$ git checkout tags/[release_tag_name]
$ cd ..
$ git commit -am "Updated Brackets source to verion ..."
$ git submodule update --init --recursive
$ npm install
$ grunt build

```

Directory Structure
-------------------

- **brackets-src** - This is Git submodule to https://github.com/adobe/brackets.git
- **embedded-ext** - Contains embedded Brackets extensions. All extensions located in this folder are optimized and copied to `/brackets-dist/extensions/default` folder at build time.
- **brackets-dist** - This is the output folder of the build process. All client script and CSS files are minified, combined and then copied to this folder. Some scripts are modified or replaced with hacked versions during optimization phase.
- **brackets-srv** - Contains default Node.js domains, e.g. `StaticServerDomain` and `ExtensionMangerDomain`. These are separated from brackets-dist folder as brackets-dist is meant to contain only client side scripts.
- **haks** - Contains scripts that replace their original counterparts entirely. For more details, please see the comments in the files. These files may require extra care when upgrading newer Brackets source.

**NOTE:** `brackets-dist` and `brackets-src` are deleted and recreated entirely on every build. That’s why they are excluded from Git. The following folders are not necessary at run time and therefore they are excluded from the NPM package: `brackets-src`, `embedded-ext`, `hacks`, `examples`, `test`.

Hacks List
----------

1. **Shell app** - TODO: needs explanation
2. **Low level file system** i.e. the global object `brackets.fs` - TODO: needs explanation
3. **NodeConnection** - TODO: needs explanation
4. **File system implementation** i.e. `remote-fs` extension - TODO: needs explanation
5. **Menu Changes** - TODO: needs explanation
6. **Browser warning** - TODO: needs explanation
7. **CORS problems** - TODO: needs explanation
