"use strict";

var fs      = require("fs"),
    path    = require("path"),
    glob    = require("glob"),
    opts    = {
        cwd: path.join(__dirname, "..", "brackets-srv")
    },
    conts   = fs.readFileSync("install.log", { encoding: "utf8" });

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
fs.writeFileSync("install.log", "");
