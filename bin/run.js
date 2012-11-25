//#!/usr/bin/env node

/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
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
    types       = configDefs.types;

commander
    .version(pkg.version)
    .option("-p, --port <port>", "Specifies TCP <port> for Brackets service. Alternatively, BRACKETS_PORT environment variable can be set. If both are omitted, the first free port in the range of 6000 - 6800 is assigned.")
    .option("-o, --open", "Opens the project in the default web browser. Warning: since Brackets currently supports only Chrome you should set it as your default browser.")
    .option("-i, --install <template>", "Creates new project based on the template specified.")
    .parse(process.argv);

function startBrackets(port) {
    "use strict";
    
    connect()
        .use('/brackets', brackets())
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
    
    if (commander.open) {
        open("http://localhost:" + port);
    }
}

function determinePortAndStartBrackets() {
    "use strict";
    
    var port = commander.port || process.env.BRACKETS_PORT;
    if (port) {
        startBrackets(port);
    } else {
        netutil.findFreePort(6000, 6800, "localhost", function (err, port) {
            if (err) {
                throw err;
            }
            startBrackets(port);
        });
    }
}

if (commander.install) {
    var args = commander.install.split(" ");
    var sourceDir = path.join(__dirname, "templates", args[0]);
    wrench.copyDirSyncRecursive(sourceDir, process.cwd(), { excludeHiddenUnix: true });
    
    var conf = nopt(types, shorthands);
    conf._exit = true;
    npm.load(conf, function (err) {
        "use strict";
    
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
                        
                        determinePortAndStartBrackets();
                    });
                }
            });
        });
    });
} else {
    determinePortAndStartBrackets();
}



