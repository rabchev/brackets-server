/*jshint -W106 */

"use strict";

var fs = require("fs"),
    _replace = {
        // HACK: For in browser loading we need to replace file system implementation very early to avoid exceptions.
        //    "main": {
        //        match: "filesystem/impls/appshell/AppshellFileSystem",
        //        value: "filesystem/impls/socket-io-fs"
        //    },
        // HACK: 1. We have to mock shell app.
        // HACK: 2. Brackets inBrowser behaves very differently, that's why we have to fake it.
        // HACK: 3. We need the menus in the Browser.
        // HACK: 4/5. Brackets extension registry services don't allow CORS, that's why we have to proxy the requests.
        "utils/Global": {
            match: "global.brackets.app = {};",
            value: "global.brackets.app = require(\"hacks.app\"); global.brackets.inBrowser = false; global.brackets.nativeMenus = false; global.brackets.config.extension_registry = '/brackets/s3.amazonaws.com/extend.brackets/registry.json'; global.brackets.config.extension_url = '/brackets/s3.amazonaws.com/extend.brackets/{0}/{0}-{1}.zip';"
        },
        // HACK: Remove warning dialog about Brackets not been ready for browsers.
        "brackets": {
            match: /\/\/ Let the user know Brackets doesn't run in a web browser yet\s+if \(brackets.inBrowser\) {/,
            value: "if (false) {"
        }
    };

module.exports = function (grunt) {

    // load dependencies
    require("load-grunt-tasks")(grunt, {pattern: ["grunt-*"]});
    //grunt.loadTasks("tasks");

    grunt.initConfig({
        jsdoc: {
            dist: {
                src: ["./server", "README.md"],
                options: {
                    destination: "./cache/docs",
                    tutorials: "./cache/docs/tutorials",
                    template: "./node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
                    configure: "./jsdoc.json"
                }
            }
        },
        "gh-pages": {
            options: {
                base: "./cache/docs"
            },
            src: ["**"]
        },
        simplemocha: {
            options: {
                timeout: 3000,
                ignoreLeaks: false,
                reporter: "spec"
            },
            all: {
                src: ["./test/*_test.js"]
            },
            server: {
                src: ["./test/server_test.js"]
            }
        },
        shell: {
            debug: {
                options: {
                    stdout: true
                },
                command: function (target) {
                    if (process.platform === "win32") {
                        return "grunt-debug test:" + target;
                    }

                    return "node --debug-brk $(which grunt) test:" + target;
                }
            }
        },
        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            debug_all: ["node-inspector", "shell:debug:all"],
            debug_server: ["node-inspector", "shell:debug:server"]
        },
        "node-inspector": {
            "default": {}
        },
        release: {
            options: {
                npm: false
            }
        },
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        "brackets-dist",
                        "brackets-src/src/.index.html",
                        "brackets-src/src/styles/brackets.css"
                    ]
                }]
            }
        },
        copy: {
            dist: {
                files: [
                    {
                        "brackets-dist/index.html": "brackets-src/src/.index.html"
                    },
                    /* static files */
                    {
                        expand: true,
                        dest: "brackets-dist/",
                        cwd: "brackets-src/src/",
                        src: [
                            "nls/{,*/}*.js",
                            "xorigin.js",
                            "dependencies.js",
                            "thirdparty/requirejs/require.js",
                            "LiveDevelopment/launch.html"
                        ]
                    },
                    /* node domains are not minified and must be copied to dist */
                    {
                        expand: true,
                        dest: "brackets-dist/",
                        cwd: "brackets-src/src/",
                        src: [
                            "extensibility/node/**",
                            "!extensibility/node/spec/**",
                            "filesystem/impls/appshell/node/**",
                            "!filesystem/impls/appshell/node/spec/**"
                        ]
                    },
                    /* extensions and CodeMirror modes */
                    {
                        expand: true,
                        dest: "brackets-dist/",
                        cwd: "brackets-src/src/",
                        src: [
                            "!extensions/default/*/unittest-files/**/*",
                            "!extensions/default/*/unittests.js",
                            "extensions/default/*/**/*",
                            "extensions/dev/*",
                            "extensions/samples/**/*",
                            "thirdparty/CodeMirror2/addon/{,*/}*",
                            "thirdparty/CodeMirror2/keymap/{,*/}*",
                            "thirdparty/CodeMirror2/lib/{,*/}*",
                            "thirdparty/CodeMirror2/mode/{,*/}*",
                            "thirdparty/CodeMirror2/theme/{,*/}*",
                            "thirdparty/i18n/*.js",
                            "thirdparty/text/*.js"
                        ]
                    },
                    /* styles, fonts and images */
                    {
                        expand: true,
                        dest: "brackets-dist/styles",
                        cwd: "brackets-src/src/styles",
                        src: ["jsTreeTheme.css", "fonts/{,*/}*.*", "images/*", "brackets.min.css*"]
                    }
                ]
            }
        },
        less: {
            dist: {
                files: {
                    "brackets-src/src/styles/brackets.min.css": "brackets-src/src/styles/brackets.less"
                },
                options: {
                    compress: true,
                    sourceMap: true,
                    sourceMapFilename: "brackets-src/src/styles/brackets.min.css.map",
                    outputSourceFiles: true,
                    sourceMapRootpath: "",
                    sourceMapBasepath: "brackets-src/src/styles"
                }
            }
        },
        requirejs: {
            dist: {
                // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
                options: {
                    // `name` and `out` is set by grunt-usemin
                    baseUrl: "brackets-src/src",
                    optimize: "uglify2",
                    // brackets.js should not be loaded until after polyfills defined in "utils/Compatibility"
                    // so explicitly include it in main.js
                    include: ["utils/Compatibility", "brackets"],
                    // TODO: Figure out how to make sourcemaps work with grunt-usemin
                    // https://github.com/yeoman/grunt-usemin/issues/30
                    generateSourceMaps: true,
                    useSourceUrl: true,
                    // required to support SourceMaps
                    // http://requirejs.org/docs/errors.html#sourcemapcomments
                    preserveLicenseComments: false,
                    useStrict: true,
                    // Disable closure, we want define/require to be globals
                    wrap: false,
                    exclude: ["text!config.json"],
                    uglify2: {}, // https://github.com/mishoo/UglifyJS2
                    paths: {
                        "hacks.app": "../../hacks/app",
                        "socket.io": "../../node_modules/socket.io/node_modules/socket.io-client/socket.io"
                    },
                    onBuildRead: function (moduleName, path, contents) {
                        var rpl = _replace[moduleName];
                        if (rpl) {
                            return contents.replace(rpl.match, rpl.value);
                        } else if (moduleName === "fileSystemImpl") {
                            // HACK: For in browser loading we need to replace file system implementation very early to avoid exceptions.
                            return fs.readFileSync(__dirname + "/client-fs/file-system.js", {
                                encoding: "utf8"
                            });
                        }
                        return contents;
                    }
                }
            }
        },
        targethtml: {
            dist: {
                files: {
                    "brackets-src/src/.index.html": "brackets-src/src/index.html"
                }
            }
        },
        useminPrepare: {
            options: {
                dest: "brackets-dist"
            },
            html: "brackets-src/src/.index.html"
        },
        usemin: {
            options: {
                dirs: ["brackets-dist"]
            },
            html: ["brackets-dist/{,*/}*.html"]
        },
        htmlmin: {
            dist: {
                options: {
                    /*removeCommentsFromCDATA: true,
                    // https://github.com/yeoman/grunt-usemin/issues/44
                    //collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    removeAttributeQuotes: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeOptionalTags: true*/
                },
                files: [{
                    expand: true,
                    cwd: "brackets-src/src",
                    src: "*.html",
                    dest: "brackets-dist"
                }]
            }
        },
        compress: {
            main: {
                options: {
                    mode: "gzip"
                },
                files: [
                    {
                        expand: true,
                        cwd: "brackets-dist/",
                        src: ["**/*.js"],
                        ext: ".js.gz"
                    },
                    {
                        expand: true,
                        cwd: "brackets-dist/",
                        src: ["**/*.css"],
                        ext: ".css.gz"
                    }
                ]
            }
        }
    });

    // task: build
    grunt.registerTask("build", [
        "clean",
        "less",
        "targethtml",
        "useminPrepare",
        "htmlmin",
        "requirejs",
        "concat",
        "copy",
        "usemin",
        "compress"
    ]);

    grunt.registerTask("test", function () {
        var arg = "all";
        if (this.args && this.args.length > 0) {
            arg = this.args[0];
        }

        grunt.task.run(["simplemocha:" + arg]);
    });

    grunt.registerTask("test-debug", function () {
        var arg = "all";
        if (this.args && this.args.length > 0) {
            arg = this.args[0];
        }

        grunt.task.run(["concurrent:debug_" + arg]);
    });

    grunt.registerTask("docs", ["jsdoc", "gh-pages"]);
};
