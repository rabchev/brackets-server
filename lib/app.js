/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var Supervisor      = require("supervisor"),
    path            = require("path"),
    netutil         = require("netutil"),
    util            = require('util'),
    _               = require("underscore"),
    Error           = require("./error"),
    Strings         = require("./strings"),
    Config          = require("./config"),
    httpServers     = [],
    app;

function run(startScript, env, debug, callback) {
    "use strict";
    
    var port = "" + env.PORT;
    var supervisor = httpServers[port];
    if (!supervisor) {
        supervisor = new Supervisor(env);
        httpServers[port] = supervisor;
    }
    
    if (supervisor.child) {
        var err = new Error("SERVER_ALREADY_STARTED", util.format(Strings.SERVER_ALREADY_STARTED, env.PORT));
        err.port = port;
        callback(err);
    } else {
        var appArgs = startScript.split(" "),
            exec = appArgs.splice(0, 1)[0],
            res = { port: port },
            supArgs;
        
        if (debug) {
            supArgs = [debug + "=" + env.DEBUG_PORT];
            
            var dbgrPort = Config.debug.port;
            var dbgrServer = httpServers[dbgrPort];
            if (!dbgrServer) {
                httpServers[dbgrPort] = dbgrServer = new Supervisor();
            }
            
            if (!dbgrServer.child) {
                var modulePath = path.join(__dirname, "..", "node_modules", "node-inspector");
                dbgrServer.run([
                    "-w",
                    path.join(modulePath, "package.json"),
                    "-n",
                    "exit",
                    "-x",
                    "node",
                    "--",
                    path.join(modulePath, "bin", "inspector"),
                    "--web-port=" + dbgrPort
                ]);
            }
            
            res.debuggerPort = dbgrPort;
            res.debugPort = env.DEBUG_PORT;
        } else {
            supArgs = [];
        }
        
        supArgs = supArgs
            .concat(["-w", "package.json", "-n", "exit", "-x", exec, "--"])
            .concat(appArgs);
        
        supervisor.run(supArgs);
        callback(null, res);
    }
}

function setPort(debug, callback) {
    "use strict";
    
    var conf = Config.live,
        env;
    
    if (debug) {
        env = _.clone(process.env);
        delete env.PORT;
    } else {
        env = process.env;
    }
    
    if (!env.PORT) {
        if (!debug && conf.port && conf.port !== "*") {
            env.PORT = conf.port;
        } else {
            netutil.findFreePort((+conf.portRange.min), (+conf.portRange.max), "localhost", function (err, port) {
                if (!err) {
                    env.PORT = port;
                }
                if (debug) {
                    netutil.findFreePort((+Config.debug.portRange.min), (+Config.debug.portRange.max), "localhost", function (err, dbgPort) {
                        if (!err) {
                            env.DEBUG_PORT = dbgPort;
                        }
                        callback(err, env);
                    });
                } else {
                    callback(err, env);
                }
            });
            return;
        }
    }
    callback(null, env);
}

function startApp(debug, callback) {
    "use strict";
    
    try {
        if (!app) {
            app = require(path.join(process.cwd(), "package.json"));
        }
        
        if (app.scripts) {
            if (app.scripts.start) {
                setPort(debug, function (err, env) {
                    if (err) {
                        callback(err);
                    } else {
                        run(app.scripts.start, env, debug, callback);
                    }
                });
            } else {
                callback(new Error("NO_START_SCRIPT"));
            }
        } else {
            callback(new Error("NO_PACKAGE_FILE"));
        }
    } catch (err) {
        if (err instanceof Error) {
            callback(err);
        } else {
            if (err.message) {
                callback({message: err.message});
            }
            throw err;
        }
    }
}

exports.nodeStart = function (callback) {
    "use strict";
    
    startApp(null, callback);
};

exports.nodeStartDebug = function (callback) {
    "use strict";
    
    startApp("--debug", callback);
};

exports.nodeStartDebugBrk = function (callback) {
    "use strict";
    
    startApp("--debug-brk", callback);
};

exports.nodeStop = function (port, callback) {
    "use strict";
    
    if (port) {
        var child,
            sPort = "" + port,
            supervisor = httpServers[sPort];
        
        if (supervisor) {
            child = supervisor.child;
        }
        
        if (!child) {
            callback(new Error("SERVER_NOT_STARTED"));
            return;
        }
        
        try {
            util.debug("crashing child");
            process.kill(child.pid);
            delete httpServers[sPort];
            callback();
        } catch (err) {
            callback(err);
        }
    } else {
        callback(new Error("ARGUMENT_CANNOT_BE_NULL", util.format(Strings.ARGUMENT_CANNOT_BE_NULL, "port")));
    }
};