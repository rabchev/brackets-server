"use strict";

var fs      = require("fs"),
    path    = require("path"),
    glob    = require("glob"),
    opts    = {
        cwd: path.join(__dirname, "..", "brackets-srv")
    };

glob("**/node_modules_", opts, function (err, files) {
    if (err) {
        throw err;
    }

    if (files) {
        files.sort(function (a, b) {
            return  b.length - a.length;
        });

        files.forEach(function (file) {
            file = path.join(opts.cwd, file);
            fs.renameSync(file, file.substr(0, file.length - 1));
            console.log("file: " + file.substr(0, file.length - 1));
        });
    }
});
