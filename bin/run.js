#!/usr/bin/env node

/*jslint plusplus: true, devel: true, nomen: true, node: true, vars: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var connect     = require("connect"),
    util        = require("util"),
    netutil     = require("netutil"),
    commander   = require("commander"),
    os          = require("os"),
    fs          = require("fs"),
    brackets    = require("../"),
    pkg         = require("../package.json"),
    open        = require("open"),
    wrench      = require("wrench"),
    path        = require("path"),
    npm         = require("npm"),
    npmconf     = require("npmconf"),
    nopt        = require("nopt"),
    configDefs  = npmconf.defs,
    shorthands  = configDefs.shorthands,
    types       = configDefs.types,
    app;

// Unit tests may load this module multiple times and we have to avoid duplicating options. 
if (commander.options.length === 0) {
    commander
            .version(pkg.version)
            .option("-p, --port <port>", "Specifies TCP <port> for Brackets service. Alternatively, BRACKETS_PORT environment variable can be set. If both are omitted, the first free port in the range of 6000 - 6800 is assigned.")
            .option("-o, --open", "Opens the project in the default web browser. Warning: since Brackets currently supports only Chrome you should set it as your default browser.")
            .option("-i, --install <template>", "Creates new project based on the template specified.")
            .option("-s, --start", "Starts Brackets after template installation.")
            .option("-f, --force", "Force template installation on none empty directory.");
}

var startBrackets = function (port, callback) {
    "use strict";
    
    app = connect()
        .use("/brackets", brackets())
        .use(connect.favicon(path.join(__dirname, "favicon.ico")))
        .use(function (req, res) {
            if (req.url === "/") {
                res.writeHead(302, {Location: "/brackets/"});
                res.end();
            } else {
                res.writeHead(304);
                res.end("Not found");
            }
        })
        .listen(port);
    
    console.log(util.format("\n  listening on port %d\n", port));
    
    if (callback) {
        callback(null, port);
    }
    
    if (commander.open) {
        open("http://localhost:" + port);
    }
};

var determinePortAndStartBrackets = function (callback) {
    "use strict";
    
    var port = commander.port || process.env.BRACKETS_PORT;
    if (port) {
        startBrackets(port, callback);
    } else {
        netutil.findFreePort(6000, 6800, "localhost", function (err, port) {
            if (err) {
                throw err;
            }
            startBrackets(port, callback);
        });
    }
};

// Just a way to mock the required script
var getInstallScritp = function (scriptPath) {
    "use strict";
    
    return require(scriptPath);
};

var emptyDirectory = function (path, fn) {
    "use strict";
    
    fs.readdir(path, function (err, files) {
        if (err && "ENOENT" !== err.code) {
            throw err;
        }
        
        fn(!files || !files.length);
    });
};

var copyFiles = function (src, trg, callback) {
    "use strict";
    
    function doCopy() {
        wrench.copyDirSyncRecursive(src, trg, { excludeHiddenUnix: true });
        
        // TODO: [Hack] 
        //      For some reason the process current working directory is changed to an invalid path after copy.
        //      Have to investigate this and see if it can be fixed.
        try {
            process.cwd();
        } catch (err) {
            if (err.code === "ENOENT") {
                process.chdir(trg);
            } else {
                throw err;
            }
        }
        
        callback(false);
    }
    
    emptyDirectory(trg, function (empty) {
        if (empty || commander.force) {
            doCopy();
        } else {
            commander.confirm('destination is not empty, continue? ', function (ok) {
                if (ok) {
                    doCopy();
                } else {
                    callback(true);
                }
            });
        }
    });
};

function installTemplate(callback) {
    "use strict";
    
    var args = commander.install.split(" "),
        src = path.join(__dirname, "templates", args[0]),
        trg = process.cwd();
    
    function exit(err) {
        if (err) {
            console.log(err);
            if (callback) {
                callback(err);
            }
        } else {
            console.log("Installation complete!");
            if (commander.start || commander.open) {
                determinePortAndStartBrackets(callback);
            } else if (callback) {
                callback(err);
            }
        }
    }
    
    copyFiles(src, trg, function (abort) {
        if (abort) {
            exit(new Error("Installation aborted."));
        } else {
            var conf = nopt(types, shorthands);
            conf._exit = true;
            npm.load(conf, function (err) {
                if (err) {
                    throw err;
                }
                    
                npm.commands.install([], function (err, installed) {
                    if (err) {
                        throw err;
                    }
                    
                    var script = path.join(src, ".bin");
                    fs.exists(script, function (exists) {
                        if (exists === true) {
                            var scrObj = getInstallScritp(script);
                            if (scrObj && scrObj.install) {
                                args.splice(0, 1);
                                
                                scrObj.install(args, function (err) {
                                    if (err) {
                                        throw err;
                                    }
                                    
                                    exit();
                                });
                            }
                        } else {
                            exit();
                        }
                    });
                });
            });
        }
    });
}

exports.start = function (callback) {
    "use strict";
    
    commander.parse(process.argv);
    
    if (commander.install) {
        installTemplate(callback);
    } else {
        determinePortAndStartBrackets(callback);
    }
};

exports.stop = function () {
    "use strict";
    
    if (app) {
        app.close();
        app = null;
        console.log("Brackets stopped.");
    }
};


// Start immediately if not testing.
if (process.env.NODE_ENV !== "test") {
    exports.start();
}
