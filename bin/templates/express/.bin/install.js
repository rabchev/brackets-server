/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var path        = require("path"),
    cp          = require("child_process"),
    spawn       = cp.spawn,
    exec        = cp.exec;

exports.install = function (callback) {
    "use strict";
    
    var cwd         = process.cwd(),
        expPath     = path.join(cwd, "node_modules", "express", "bin", "express"),
        exp         = spawn("node", [expPath], { cwd: cwd, env: process.env });
    
    exp.stdout.setEncoding('utf8');
    exp.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
        if (data === "destination is not empty, continue? ") {
            exp.stdin.write("y");
            exp.stdin.end();
            console.log("y");
        }
    });
    
    exp.stderr.setEncoding('utf8');
    exp.stderr.on('data', function (data) {
        callback(data);
    });
    
    exp.on('exit', function (code) {
        if (code === 0) {
            console.log('express process exited with code ' + code);
            console.log('installing dependencies...');
            
            exec("npm install", function (err, stdout, stderr) {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                callback(err);
            });
            
//            var npm = spawn("npm", ["install"], { cwd: cwd, env: process.env });
//            
//            npm.stdout.setEncoding('utf8');
//            npm.stdout.on('data', function (data) {
//                console.log('stdout: ' + data);
//            });
//            
//            npm.stderr.setEncoding('utf8');
//            npm.stderr.on('data', function (data) {
//                callback(data);
//            });
//            
//            npm.on('exit', function (code) {
//                if (code === 0) {
//                    callback();
//                }
//            });
        }
    });
};