/*jshint -W106 */

"use strict";

var fs = require("fs"),
    path = require("path"),
    glob = require("glob"),
    shell = require("shelljs"),
    _replace = {
        // HACK: 1. We have to mock shell app.
        // HACK: 2. Brackets inBrowser behaves very differently, that's why we have to fake it.
        // HACK: 3. We need the menus in the Browser.
        // HACK: 4/5. Brackets extension registry services don't allow CORS, that's why we have to proxy the requests.
        "utils/Global": {
            match: "global.brackets.app = {};",
            value: "global.brackets.app=require(\"hacks.app\");global.brackets.inBrowser=false; global.brackets.nativeMenus=false;global.brackets.fs=require(\"hacks.lowFs\");"
        },
        // HACK: Remove warning dialog about Brackets not been ready for browsers.
        "brackets": [{
            match: /\/\/ Let the user know Brackets doesn't run in a web browser yet\s+if \(brackets.inBrowser\) {/,
            value: "if (false) {"
        }, {
            match: "!url.match(/^file:\\/\\//) && url !== \"about:blank\" && url.indexOf(\":\") !== -1",
            varlue: "false"
        }],
        //  TODO:HACK: For some reason this line causes languageDropdown to be populated before it is initialized. Needs more investigaton.
        "editor/EditorStatusBar": {
            match: "$(LanguageManager).on(\"languageAdded languageModified\", _populateLanguageDropdown);",
            value: "// $(LanguageManager).on(\"languageAdded languageModified\", _populateLanguageDropdown);"
        },
        "command/DefaultMenus": [{
            // Browser window cannot be closed from script.
            match: "if (brackets.platform !== \"mac\" || !brackets.nativeMenus) {",
            value: "if (false) {"
        }, {
            match: /menu\.addMenuDivider\(\);\s*menu\.addMenuItem\(Commands.HELP_SHOW_EXT_FOLDER\);/,
            value: " "
        }]
    };

function addCodeMirrorModes(config) {

    "use strict";

    var root = path.join(__dirname, "brackets-src", "src", "thirdparty", "CodeMirror", "mode"),
        dirs = fs.readdirSync(root),
        include = config.requirejs.main.options.include;

    dirs.forEach(function (file) {
        var stat = fs.statSync(root + "/" + file);
        if (stat.isDirectory()) {
            include.push("thirdparty/CodeMirror/mode/" + file + "/" + file);
        }
    });
}

function addDefaultExtensions(config) {
    "use strict";

    var root = path.join(__dirname, "brackets-src", "src", "extensions", "default"),
        dirs = fs.readdirSync(root),
        rj = config.requirejs;

    dirs.forEach(function (file) {
        var stat = fs.statSync(root + "/" + file);

        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // TODO: JavaScriptCodeHints cannot be optimized for multiple problems. Needs more investigation.
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        if (stat.isDirectory() && fs.existsSync(root + "/" + file + "/main.js") && file !== "JavaScriptCodeHints") {
            var mod = {
                options: {
                    name: "main",
                    out: "brackets-dist/extensions/default/" + file + "/main.js",
                    baseUrl: "brackets-src/src/extensions/default/" + file + "/",
                    preserveLicenseComments: false,
                    optimize: "uglify2",
                    uglify2: {},
                    paths: {
                        "text": "../../../thirdparty/text/text",
                        "i18n": "../../../thirdparty/i18n/i18n",
                    },
                    generateSourceMaps: true,
                    useSourceUrl: true,
                    wrap: false
                }
            };

            // HealtData extension is placeing its menu item after HELP_SHOW_EXT_FOLDER, but we remove that one and
            // that is causing exeception in command manager.
            if (file === "HealthData") {
                mod.options.onBuildRead = function (moduleName, path, contents) {
                    if (moduleName === "main") {
                        return contents.replace(/HELP_SHOW_EXT_FOLDER/g, "HELP_CHECK_FOR_UPDATE");
                    }
                    return contents;
                };
            }

            rj[file] = mod;

            // The code below solves some of the problems with JavaScriptCodeHints optimization.
            //            if (file === "JavaScriptCodeHints") {
            //                mod.options.onBuildRead = function (moduleName, path, contents) {
            //                    return contents.replace("== \"use strict\"", "== \"use\\ strict\"");
            //                };
            //
            //                rj.ternWorker = {
            //                    options: {
            //                        name: "tern-worker",
            //                        out: "brackets-dist/extensions/default/JavaScriptCodeHints/tern-worker.js",
            //                        baseUrl: "brackets-src/src/extensions/default/JavaScriptCodeHints/",
            //                        preserveLicenseComments: false,
            //                        optimize: "uglify2",
            //                        uglify2: {},
            //                        paths: {
            //                            "text" : "../../../thirdparty/text/text",
            //                            "i18n" : "../../../thirdparty/i18n/i18n",
            //                        },
            //                        wrap: false
            //                    }
            //                };
            //            }
        }
    });
}

function addEmbeddedExtensions(config) {
    var root = path.join(__dirname, "embedded-ext"),
        dirs = fs.readdirSync(root),
        rj = config.requirejs;

    dirs.forEach(function (file) {
        var mod = {
            options: {
                name: "main",
                out: "brackets-dist/extensions/default/" + file + "/main.js",
                baseUrl: "embedded-ext/" + file + "/",
                preserveLicenseComments: false,
                optimize: "uglify2",
                uglify2: {},
                paths: {
                    "text": "../../brackets-src/src/thirdparty/text/text",
                    "i18n": "../../brackets-src/src/thirdparty/i18n/i18n",
                },
                generateSourceMaps: true,
                useSourceUrl: true,
                wrap: false
            }
        };

        rj[file] = mod;
    });
}

module.exports = function (grunt) {

    // load dependencies
    require("load-grunt-tasks")(grunt, {
        pattern: ["grunt-*"]
    });
    //grunt.loadTasks("tasks");

    var config = {
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
                        "brackets-srv",
                        "brackets-dist",
                        "brackets-src/src/.index.html",
                        "brackets-src/src/styles/brackets.css",
                        ".tmp"
                    ]
                }]
            }
        },
        copy: {
            dist: {
                files: [{
                    "brackets-dist/index.html": "brackets-src/src/.index.html"

                },
                /* hack files*/
                {
                    expand: true,
                    dest: "brackets-src/src/",
                    cwd: "hacks",
                    src: [
                        "brackets.config.json",
                        "config.json"
                    ]
                },

                /* More hack files*/
                {
                    expand: true,
                    dest: "brackets-src/src/test/perf/OpenFile-perf-files",
                    cwd: "hacks",
                    src: [
                        "Performance-test.js"
                    ]
                },

                {
                    expand: true,
                    dest: "brackets-src/src/nls/root",
                    cwd: "hacks",
                    src: [
                        "strings.js",
                        "strings.js"
                    ]
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
                        "thirdparty/requirejs/require.js"
                    ]
                },
                /* extensions and CodeMirror modes */
                {
                    expand: true,
                    dest: "brackets-dist/",
                    cwd: "brackets-src/src/",
                    src: [
                        'extensions/default/**/*',
                        'extensions/default/JavaScriptCodeHints/**',
                        'extensions/default/*/**/*.{css,less,json,svg,png}',
                        '!extensions/default/*/unittest-files/**',
                        '!extensions/default/*/unittests.js',
                        '!extensions/default/{*/thirdparty,**/node_modules}/**/test/**/*',
                        '!extensions/default/{*/thirdparty,**/node_modules}/**/doc/**/*',
                        '!extensions/default/{*/thirdparty,**/node_modules}/**/examples/**/*',
                        '!extensions/default/*/thirdparty/**/*.htm{,l}',
                        'extensions/dev/*',
                        'thirdparty/CodeMirror/**',
                        'thirdparty/i18n/*.js',
                        'thirdparty/text/*.js'
                    ]
                },
                /* Node domains */
                {
                    expand: true,
                    dest: "brackets-srv/",
                    cwd: "brackets-src/src/",
                    src: [
                        "extensions/default/StaticServer/node/**",
                        "LiveDevelopment/MultiBrowserImpl/transports/node/**",
                        "LiveDevelopment/MultiBrowserImpl/launchers/node/**",
                        'extensibility/node/**',
                        '!extensibility/node/spec/**',
                        '!extensibility/node/node_modules/**/{test,tst}/**/*',
                        '!extensibility/node/node_modules/**/examples/**/*',
                        // 'filesystem/impls/appshell/node/**',
                        // '!filesystem/impls/appshell/node/spec/**',
                        "!extensibility/node/ExtensionManagerDomain.js",
                        "search/node/**"

                    ] //,
                    //                        rename: function(dest, src) {
                    //                            return dest + src.replace(/node_modules/g, "_node_modules");
                    //                        }
                },

                /* node_modules*/
                {
                    expand: true,
                    dest: "brackets-dist",
                    cwd: "brackets-src",
                    src: [
                        'node_modules/**'
                    ]
                },

                /* node_modules*/
                {
                    expand: true,
                    dest: "brackets-srv",
                    cwd: "",
                    src: [
                        'node_modules/**'
                    ]
                },

                /* Node domains */
                {
                    expand: true,
                    dest: "brackets-srv/extensibility/node/",
                    cwd: "lib/domains/",
                    src: ["ExtensionManagerDomain.js"]
                },
                /* styles, fonts and images */
                {
                    expand: true,
                    dest: "brackets-dist/styles",
                    cwd: "brackets-src/src/styles",
                    src: ["jsTreeTheme.css", "fonts/{,*/}*.*", "images/*", "brackets.min.css*"]
                },
                /* custom images */
                {
                    expand: true,
                    dest: "brackets-dist/styles",
                    cwd: "",
                    src: ["images/*"]
                },
                /* custom html */
                {
                    expand: true,
                    dest: "brackets-dist/styles",
                    cwd: "xxx",
                    src: ["images/*"]
                },

                /* samples */

                {
                    expand: true,
                    dest: "brackets-dist/",
                    cwd: "brackets-src/",
                    src: [
                        "samples/**"
                    ]
                },


                /* embedded extensions */
                {
                    expand: true,
                    dest: "brackets-dist/extensions/default/",
                    cwd: "embedded-ext/",
                    src: [
                        "**",
                        "!*/main.js"
                    ]
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
            main: {
                options: {
                    // `name` and `out` is set by grunt-usemin
                    name: "main",
                    out: "brackets-dist/main.js",
                    mainConfigFile: "brackets-src/src/main.js",
                    baseUrl: "brackets-src/src",
                    optimize: "uglify2",
                    uglify2: {}, // https://github.com/mishoo/UglifyJS2
                    include: ["utils/Compatibility", "brackets"],
                    preserveLicenseComments: false,
                    // useStrict: true,
                    exclude: ["text!config.json"],
                    paths: {
                        "hacks.app": "../../hacks/app",
                        "hacks.lowFs": "../../hacks/low-level-fs",
                        "socket.io": "../../node_modules/socket.io-client/dist/socket.io"
                    },
                    onBuildRead: function (moduleName, path, contents) {
                        var rpl = _replace[moduleName];
                        if (rpl) {
                            if (Array.isArray(rpl)) {
                                rpl.forEach(function (el) {
                                    contents = contents.replace(el.match, el.value);
                                });
                                return contents;
                            }
                            return contents.replace(rpl.match, rpl.value);
                        }
                        else if (moduleName === "fileSystemImpl") {
                            // HACK: For in browser loading we need to replace file system implementation very early to avoid exceptions.
                            return fs.readFileSync(__dirname + "/embedded-ext/client-fs/lib/file-system.js", {
                                encoding: "utf8"
                            })
                                .replace(/brackets\.getModule/g, "require")
                                .replace("require(\"./open-dialog\")", "{}")
                                .replace("require(\"./save-dialog\")", "{}")
                                .replace("require(\"../thirdparty/socket.io\");", "require(\"socket.io\");")
                                .replace("// init(\"/brackets\");", "init(\"/brackets\");");
                        }
                        else if (moduleName === "utils/NodeConnection") {
                            // HACK: We serve the source from Node, connect to the same instance.
                            return fs.readFileSync(__dirname + "/hacks/NodeConnection.js", {
                                encoding: "utf8"
                            });
                        }
                        return contents;
                    },
                    generateSourceMaps: true,
                    useSourceUrl: true,
                    wrap: false
                }
            }
        },
        replace: {
            dist: {
                src: "brackets-src/src/.index.html",
                overwrite: true,
                replacements: [{
                    from: "<!-- build:js main.js -->",
                    to: " "
                }]
            }
        },
        targethtml: {
            dist: {
                files: {
                    "brackets-src/src/index.html": "hacks/index.html",
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
                files: [{
                    expand: true,
                    cwd: "brackets-dist/",
                    src: [
                        "**/*.js",
                        "!samples/**",
                        "!extensions/default/new-project/templateFiles/**"
                    ],
                    extDot: "last",
                    dest: "brackets-dist/",
                    ext: ".js.gz"
                }, {
                    expand: true,
                    cwd: "brackets-dist/",
                    src: [
                        "**/*.css",
                        "!samples/**",
                        "!extensions/default/new-project/templateFiles/**"
                    ],
                    extDot: "last",
                    dest: "brackets-dist/",
                    ext: ".css.gz"
                }]
            }
        }
    };

    addDefaultExtensions(config);
    addEmbeddedExtensions(config);
    // addCodeMirrorModes(config);
    grunt.initConfig(config);

    var common = require("./brackets-src/tasks/lib/common")(grunt),
        build = require("./brackets-src/tasks/build")(grunt);

    grunt.registerTask("build-config", "Update config.json with the build timestamp, branch and SHA being built", function () {
        var done = this.async(),
            distConfig = grunt.file.readJSON("brackets-src/src/config.json");

        build.getGitInfo(path.resolve("./brackets-src")).then(function (gitInfo) {
            distConfig.version = distConfig.version.substr(0, distConfig.version.lastIndexOf("-") + 1) + gitInfo.commits;
            distConfig.repository.SHA = gitInfo.sha;
            distConfig.repository.branch = gitInfo.branch;
            distConfig.config.build_timestamp = new Date().toString().split("(")[0].trim();

            common.writeJSON(grunt, "brackets-dist/config.json", distConfig);

            done();
        }, function (err) {
            grunt.log.writeln(err);
            done(false);
        });
    });

    // task: build
    grunt.registerTask("build", [
        "clean",
        "less",
        "targethtml",
        "replace",
        "useminPrepare",
        "htmlmin",
        "requirejs",
        "concat",
        "uglify",
        "copy",
        "usemin",
        "compress",
        "build-config"
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

    grunt.registerTask("publish", function () {
        var opts = {
            cwd: path.join(__dirname, "brackets-srv")
        },
            arg = this.args && this.args.length > 0 ? this.args[0] : null,
            cmd = arg === "simulate" ? "npm install -g" : "npm publish",
            done = this.async();

        glob("**/node_modules", opts, function (err, files) {
            var failure;

            if (err) {
                throw err;
            }

            if (files) {
                files.sort(function (a, b) {
                    return b.length - a.length;
                });

                files.forEach(function (file) {
                    file = path.join(opts.cwd, file);
                    fs.renameSync(file, file + "_");
                    console.log("file: " + file + "_");
                });

                failure = shell.exec(cmd).code;

                files.forEach(function (file) {
                    file = path.join(opts.cwd, file);
                    fs.renameSync(file + "_", file);
                    console.log("file: " + file);
                });

                if (failure) {
                    grunt.fail.fatal(new Error("Execution failed for: " + cmd));
                }
                done();
            }
        });
    });
};
