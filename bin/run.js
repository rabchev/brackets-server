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
    path        = require("path");

commander
    .version(pkg.version)
    .option("-p, --port <port>", "Specifies TCP <port> for Brackets service. If omitted, the first free port in the range of 6000 - 6800 is picked.")
    .option("-o, --open", "Opens the project in the default web browser. Warning: since Brackets currently supports only Chrome you should set it as your default browser.")
    .option("-t, --template <name>", "Specifies the project template to be used upon project creation.")
    .parse(process.argv);

function start(port) {
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

if (commander.template) {
    var sourceDir = path.join(__dirname, "templates", commander.template);
    wrench.copyDirRecursive(sourceDir, process.cwd(), function (err) {
        "use strict";
        
        if (err) {
            console.log("An error occurred while coping files from template directory.");
            console.log(err);
            return;
        }
        
        
    });
}

if (commander.port) {
    start(commander.port);
} else {
    netutil.findFreePort(6000, 6800, "localhost", function (err, port) {
        "use strict";
        
        if (err) {
            throw err;
        }
        start(port);
    });
}

