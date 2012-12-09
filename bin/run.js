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

commander
        .version(pkg.version)
        .option("-p, --port <port>", "Specifies TCP <port> for Brackets service. Alternatively, BRACKETS_PORT environment variable can be set. If both are omitted, the first free port in the range of 6000 - 6800 is assigned.")
        .option("-o, --open", "Opens the project in the default web browser. Warning: since Brackets currently supports only Chrome you should set it as your default browser.")
        .option("-i, --install <template>", "Creates new project based on the template specified.")
        .option("-s, --start", "Starts Brackets after template installation.");

function startBrackets(port, callback) {
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
        callback(port);
    }
    
    if (commander.open) {
        open("http://localhost:" + port);
    }
}

function determinePortAndStartBrackets(callback) {
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
}

exports.start = function (callback) {
    "use strict";
    
    commander.parse(process.argv);
    
    if (commander.install) {
        var args = commander.install.split(" "),
            sourceDir = path.join(__dirname, "templates", args[0]),
            destDir = process.cwd();
        
        wrench.copyDirSyncRecursive(sourceDir, process.cwd(), { excludeHiddenUnix: true });
        
        // TODO: [Hack] 
        //          For some reason the process current working directory is changed to an invalid path after copy.
        //          Have to investigate this and see if it can be fixed.
        try {
            process.cwd();
        } catch (err) {
            if (err.code === "ENOENT") {
                process.chdir(destDir);
            } else {
                throw err;
            }
        }
        
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
                
                var script = path.join(sourceDir, ".bin");
                fs.exists(script, function (exists) {
                    if (exists === true) {
                        args.splice(0, 1);
                        require(script).install(args, function (err) {
                            if (err) {
                                console.log('error: ' + err);
                            }
                            console.log("Installation complete!");
                            if (commander.start || commander.open) {
                                determinePortAndStartBrackets(callback);
                            } else {
                                callback(null);
                            }
                        });
                    }
                });
            });
        });
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
