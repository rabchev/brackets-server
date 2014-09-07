"use strict";

var fs          = require("fs"),
    ncp         = require("ncp"),
    mkdirp      = require("mkdirp"),
    rimraf      = require("rimraf"),
    pathUtil    = require("path"),
    suppRoot    = "/support/",
    sampRoot    = "/samples/",
    projRoot    = "/projects/";

function resolvePath(reqPath, context, callback) {
    var extRoot = context.httpRoot + "/extensions/",
        userExt = context.httpRoot + "/extensions/user",
        root,
        err,
        res;

    if (reqPath.startsWith(projRoot)) {
        root = context.projectsDir;
        res = pathUtil.join(root, reqPath.substr(projRoot.length));
    } else if (reqPath.startsWith(userExt)) {
        root = context.supportDir + "/extensions/user";
        res = pathUtil.join(root, reqPath.substr(userExt.length));
    } else if (reqPath.startsWith(extRoot)) {
        root = context.defaultExtensions;
        res = pathUtil.join(context.defaultExtensions, reqPath.substr(extRoot.length));
    } else if (reqPath.startsWith(suppRoot)) {
        root = context.supportDir;
        res = pathUtil.join(context.supportDir, reqPath.substr(suppRoot.length));
    } else if (reqPath.startsWith(sampRoot)) {
        root = context.samplesDir;
        res = pathUtil.join(context.samplesDir, reqPath.substr(sampRoot.length));
    } else {
        err = new Error("No such file or directory.");
        err.code = "ENOENT";
        return callback(err);
    }

    if (res.substr(0, root.length) !== root) {
        err = new Error("Permission denied.");
        err.code = "EACCES";
        callback(err);
    } else {
        callback(null, res);
    }
}

function stat(path, callback) {
    fs.stat(path, function (err, stats) {
        if (err) {
            return callback(err);
        }

        callback(null, {
            isFile: stats.isFile(),
            mtime: stats.mtime,
            size: stats.size,
            realPath: null, // TODO: Set real path if symbolic link.
            hash: stats.mtime.getTime()
        });
    });
}

function readdir(path, callback) {
    fs.readdir(path, callback);
}

function mkdir(path, mode, callback) {
    mkdirp(path, { mode: mode }, callback);
}

function rename(oldPath, newPath, callback) {
    fs.rename(oldPath, newPath, callback);
}

function readFile(path, encoding, callback) {
    fs.readFile(path, { encoding: encoding }, callback);
}

function writeFile(path, data, encoding, callback) {
    fs.writeFile(path, data, { encoding: encoding }, callback);
}

function unlink(path, callback) {
    rimraf(path, callback);
}

function moveToTrash(path, callback) {
    rimraf(path, callback);
}

function watchPath(req, callback) {
    callback();
}

function unwatchPath(req, callback) {
    callback();
}

function unwatchAll(req, callback) {
    callback();
}

function copyFile(src, dest, callback) {
    ncp(src, dest, callback);
}

exports.resolvePath = resolvePath;
exports.stat = stat;
exports.readdir = readdir;
exports.mkdir = mkdir;
exports.rename = rename;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.unlink = unlink;
exports.moveToTrash = moveToTrash;
exports.watchPath = watchPath;
exports.unwatchPath = unwatchPath;
exports.unwatchAll = unwatchAll;
exports.copyFile = copyFile;
