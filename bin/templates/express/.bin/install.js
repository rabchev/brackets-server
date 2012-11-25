/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var path        = require("path"),
    cp          = require("child_process"),
    spawn       = cp.spawn,
    exec        = cp.exec;

exports.install = function (args, callback) {
    "use strict";
    
    var cwd         = process.cwd(),
        expPath     = [path.join(cwd, "node_modules", "express", "bin", "express")],
        expArgs     = expPath.concat(args || []),
        exp         = spawn("node", expArgs, { cwd: cwd, env: process.env });
    
    exp.stdout.setEncoding("utf8");
    exp.stdout.on("data", function (data) {
        console.log("stdout: " + data);
        if (data === "destination is not empty, continue? ") {
            exp.stdin.write("y");
            exp.stdin.end();
            console.log("y");
        }
    });
    
    exp.stderr.setEncoding("utf8");
    exp.stderr.on("data", function (data) {
        callback(data);
    });
    
    exp.on("exit", function (code) {
        console.log("express process exited with code " + code);
        if (code === 0) {
            console.log("installing dependencies...");
            // On Windows spawn won't run .cmd batch file, that's why we use exec instead.
            exec("npm install", function (err, stdout, stderr) {
                console.log("stdout: " + stdout);
                console.log("stderr: " + stderr);
                callback(err);
            });
        }
    });
};