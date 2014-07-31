"use strict";

var fs      = require("fs"),
    mkdirp  = require("mkdirp");

exports.init = function (inst) {
    inst.io
    .of(inst.root)
    .on("connection", function (socket) {
        socket.emit("greeting", "hi");
        socket.on("mkdir", function (data, callback) {
            mkdirp(data.path, data.mode, function (err) {
                callback(err);
            });
        })
        .on("stat", function (data, callback) {
            fs.stat(data, function (err, stats) {
                if (err) {
                    return callback({ err: err });
                }

                var options = {
                    isFile: stats.isFile(),
                    mtime: stats.mtime,
                    size: stats.size,
                    realPath: stats.realPath,
                    hash: stats.mtime.getTime()
                };
                callback({ stats: options });
            });
        });
    });
};
