"use strict";

var fs      = require("fs"),
    path    = require("path"),
    mkdirp  = require("mkdirp");

function init(srv) {

    function resolvePath(filePath) {
        if (filePath === "/.git/HEAD") {
            return path.normalize(__dirname + "/../brackets-src" + filePath);
        } else if (filePath.startsWith("/extensions/user")) {
            return path.join(srv.extensionsDir, filePath.substr("/extensions/user".length));
        } else if (filePath.startsWith("/extensions")) {
            return path.normalize(__dirname + "/../brackets-src/src" + filePath);
        } else if (filePath.startsWith(srv.root)) {
            return path.normalize(__dirname + "/../brackets-src/src" + filePath.substr(srv.root.length));
        }

        return path.resolve(filePath);
    }

    function stat(data, callback) {
        fs.stat(resolvePath(data), function (err, stats) {
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
    }

    function readdir(data, callback) {
        fs.readdir(resolvePath(data), function (err, files) {
            if (err) {
                return callback({ err: err });
            }

            callback({ contents: files });
        });
    }

    function mkdir(data, callback) {
        mkdirp(resolvePath(data.path), data.mode, function (err) {
            callback(err);
        });
    }

    function onConnection (socket) {
        socket.emit("greeting", "hi");

        socket
            .on("stat", stat)
            .on("mkdir", mkdir)
            .on("readdir", readdir);
    }

    srv.io
        .of(srv.root)
        .on("connection", onConnection);
}

exports.init = init;
