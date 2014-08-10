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
        requirejs: {
            compile: {
                options: {
                    name: "main",
                    baseUrl: "./brackets-src/src/",
                    mainConfigFile: "./brackets-src/src/main.js",
                    out: "./brackets-dist/main-built.js",
                    preserveLicenseComments: false,
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
        replace: {
            dist: {
                options: {
                    patterns: [
                        {
                            match: "foo",
                            replacement: "bar"
                        }
                    ]
                },
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ["./brackets-src/src/index.html"],
                        dest: "./brackets-dist/"
                    }
                ]
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
                        src: ["brackets-dist/*.js"],
                        ext: ".js.gz"
                    },
                    {
                        expand: true,
                        src: ["brackets-dist/*.css"],
                        ext: ".css.gz"
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks("grunt-shell");
    grunt.loadNpmTasks("grunt-release");
    grunt.loadNpmTasks("grunt-concurrent");
    grunt.loadNpmTasks("grunt-node-inspector");
    grunt.loadNpmTasks("grunt-simple-mocha");
    grunt.loadNpmTasks("grunt-contrib-requirejs");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-replace");

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
