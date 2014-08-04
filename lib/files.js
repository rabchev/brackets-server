"use strict";

var fs      = require("fs"),
    path    = require("path"),
    mkdirp  = require("mkdirp"),
    rimraf  = require("rimraf");

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
        } else if (filePath.startsWith("/samples/")) {
            return path.normalize(__dirname + "/../brackets-src" + filePath);
        }

        return path.resolve(filePath);
    }

    function stat(req, callback) {
        fs.stat(resolvePath(req), function (err, stats) {
            if (err) {
                return callback({ err: err });
            }

            var options = {
                isFile: stats.isFile(),
                mtime: stats.mtime,
                size: stats.size,
                realPath: null, // TODO: Set real path if symbolic link.
                hash: stats.mtime.getTime()
            };
            callback({ stats: options });
        });
    }

    function readdir(req, callback) {
        fs.readdir(resolvePath(req), function (err, files) {
            callback({ err: err, contents: files });
        });
    }

    function mkdir(req, callback) {
        mkdirp(resolvePath(req.path), req.mode, callback);
    }

    function rename(req, callback) {
        fs.rename(resolvePath(req.oldPath), resolvePath(req.newPath), callback);
    }

    function readFile(req, callback) {
        fs.readFile(resolvePath(req.path), { encoding: req.encoding }, function (err, data) {
            callback({ err: err, data: data });
        });
    }

    function writeFile(req, callback) {
        fs.writeFile(resolvePath(req.path), req.data, { encoding: req.encoding }, function (err) {
            callback(err);
        });
    }

    function unlink(req, callback) {
        rimraf(resolvePath(req), function (err) {
            callback(err);
        });
    }

//    function moveToTrash(req, callback) {
//        callback("Not implemented!");
//    }

    function onConnection (socket) {
        socket.emit("greeting", "hi");

        socket
            .on("stat", stat)
            .on("mkdir", mkdir)
            .on("readdir", readdir)
            .on("rename", rename)
            .on("readFile", readFile)
            .on("writeFile", writeFile)
            .on("unlink", unlink)
            .on("moveToTrash", unlink);
    }

    srv.io
        .of(srv.root)
        .on("connection", onConnection);
}

exports.init = init;
