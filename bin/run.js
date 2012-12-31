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
    Strings     = require("../lib/strings.js"),
    Config      = require("../lib/config.js"),
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
            .option("-o, --open", Strings.ARGV_OPEN)
            .option("-i, --install <template>", Strings.ARGV_INSTALL)
            .option("-s, --start", Strings.ARGV_START)
            .option("-f, --force", Strings.ARGV_FORCE)
            .option("--IDE.port <port>", Strings.ARGV_IDE_PROT)
            .option("--IDE.portRange.min <port>", Strings.ARGV_IDE_PROT_MIN)
            .option("--IDE.portRange.max <port>", Strings.ARGV_IDE_PROT_MAX)
            .option("--live.port <port>", Strings.ARGV_LIVE_PROT)
            .option("--live.portRange.min <port>", Strings.ARGV_LIVE_PROT_MIN)
            .option("--live.portRange.max <port>", Strings.ARGV_LIVE_PROT_MAX)
            .option("--debugger.port <port>", Strings.ARGV_DEBUG_PROT)
            .option("--debugger.portRange.min <port>", Strings.ARGV_DEBUG_PROT_MIN)
            .option("--debugger.portRange.max <port>", Strings.ARGV_DEBUG_PROT_MAX)
}

// This method can be mocked during tests to suppress logging or test log messages
var log = function (message) {
    "use strict";
    
    console.log(message);
};

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
    
    log(util.format(Strings.LISTENING_PORT, port));
    
    if (callback) {
        callback(null, port);
    }
    
    if (commander.open) {
        open("http://localhost:" + port);
    }
};

var determinePortAndStartBrackets = function (callback) {
    "use strict";
    
    var ide = Config.IDE;
    if (ide.port && ide.port !== "*") {
        startBrackets((+ide.port), callback);
    } else {
        netutil.findFreePort((+ide.portRange.min), (+ide.portRange.max), "localhost", function (err, port) {
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
    
    emptyDirectory(trg, function (empty) {
        if (empty || commander.force) {
            wrench.copyDirSyncRecursive(src, trg, { excludeHiddenUnix: true, preserve: true });
            callback(false);
        } else {
            commander.confirm("\n\n" + Strings.CONFIRM_NONEMPTY_DIR + " ", function (ok) {
                if (ok) {
                    wrench.copyDirSyncRecursive(src, trg, { excludeHiddenUnix: true, preserve: true });
                    callback(false);
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
            log(err.message);
            if (callback) {
                callback(err);
            } else {
                process.exit();
            }
        } else {
            log(Strings.INSTALLATION_COMPLETE);
            
            if (commander.start || commander.open) {
                determinePortAndStartBrackets(callback);
            } else if (callback) {
                callback(err);
            } else {
                process.exit();
            }
        }
    }
    
    copyFiles(src, trg, function (abort) {
        if (abort) {
            exit(new Error(Strings.INSTALLATION_ABORTED));
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
        
        log(Strings.IDE_SERVER_STOPPED);
    }
};


// Start immediately if not testing.
if (process.env.NODE_ENV !== "test") {
    exports.start();
}
