"use strict";

var fs      = require("fs"),
    path    = require("path"),
    glob    = require("glob"),
    opts    = {
        cwd: path.join(__dirname, "..", "brackets-srv")
    },
    logFile = "./install.log",
    exists  = fs.existsSync(logFile),
    conts;

if (exists) {
    conts = fs.readFileSync(logFile, { encoding: "utf8" });
    fs.unlinkSync(logFile);
}

if (!conts) {
    glob("**/node_modules", opts, function (err, files) {
        if (err) {
            throw err;
        }

        if (files) {
            files.sort(function (a, b) {
                return  b.length - a.length;
            });

            files.forEach(function (file) {
                file = path.join(opts.cwd, file);
                fs.renameSync(file, file + "_");
                console.log("file: " + file + "_");
            });
        }
    });
}
