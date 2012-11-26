/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var supervisor      = require("supervisor"),
    path            = require("path"),
    netutil         = require("netutil"),
    util            = require('util'),
    errCodes        = require("./error-codes"),
    strings         = require("./strings"),
    app;

function run(startScript, callback) {
    "use strict";
    
    if (supervisor.child) {
        callback(new Error(errCodes.SERVER_ALREADY_STARTED,
                           util.format(strings.SERVER_ALREADY_STARTED, process.env.PORT)));
    } else {
        var args = startScript.split(" "),
            exec = args.splice(0, 1)[0];
        
        supervisor.run(["-w", "package.json", "-x", exec].concat(args));
        callback(null, { port: process.env.PORT });
    }
}

function setPort(callback) {
    "use strict";
    
    if (!process.env.PORT) {
        if (app.config && app.config.port) {
            process.env.PORT = app.config.port;
        } else {
            netutil.findFreePort(3000, 3800, "localhost", function (err, port) {
                if (!err) {
                    process.env.PORT = port;
                }
                callback(err);
            });
            return;
        }
    }
    callback();
}

exports.nodeStart = function (callback) {
    "use strict";
    
    try {
        if (!app) {
            app = require(path.join(process.cwd(), "package.json"));
        }
        
        if (app.scripts) {
            if (app.scripts.start) {
                setPort(function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        run(app.scripts.start, callback);
                    }
                });
            } else {
                callback(new Error(errCodes.NO_START_SCRIPT, strings.NO_START_SCRIPT));
            }
        } else {
            callback(new Error(errCodes.NO_PACKAGE_FILE, strings.NO_PACKAGE_FILE));
        }
    } catch (err) {
        callback(err);
    }
};