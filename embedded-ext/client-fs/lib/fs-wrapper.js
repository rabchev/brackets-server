define(function (require, exports) {
    "use strict";

    var nativeFs    = brackets.getModule("fileSystemImpl"),
        remoteFs    = require("./file-system"),
        fs          = nativeFs;

    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        nativeFs.showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback);
    }

    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        nativeFs.showSaveDialog(title, initialPath, proposedNewFilename, callback);
    }

    function stat(path, callback) {
        fs.stat(path, callback);
    }

    function exists(path, callback) {
        fs.exists(path, callback);
    }

    function readdir(path, callback) {
        fs.readdir(path, callback);
    }

    function mkdir(path, mode, callback) {
        fs.mkdir(path, mode, callback);
    }

    function rename(oldPath, newPath, callback) {
        fs.rename(oldPath, newPath, callback);
    }

    function readFile(path, options, callback) {
        fs.readFile(path, options, callback);
    }

    function writeFile(path, data, options, callback) {
        fs.writeFile(path, data, options, callback);
    }

    function unlink(path, callback) {
        fs.unlink(path, callback);
    }

    function moveToTrash(path, callback) {
        fs.moveToTrash(path, callback);
    }

    function initWatchers(changeCallback, offlineCallback) {
//      Initialize watchers for both implementations.
        nativeFs.initWatchers(changeCallback, offlineCallback);
        remoteFs.initWatchers(changeCallback, offlineCallback);
    }

    function watchPath(path, ignored, callback) {
        fs.watchPath(path, ignored, callback);
    }

    function unwatchPath(path, ignored, callback) {
        fs.unwatchPath(path, ignored, callback);
    }

    function unwatchAll(callback) {
        fs.unwatchAll(callback);
    }

    function setFs(remote) {
        if (remote) {
            fs = remote;
            fs._init(remote);
        } else {
            fs = nativeFs;
        }
    }

    Object.defineProperty(exports, "recursiveWatch", {
        get: function () {
            return nativeFs.recursiveWatch;
        }
    });

    Object.defineProperty(exports, "normalizeUNCPaths", {
        get: function () {
            return nativeFs.normalizeUNCPaths;
        }
    });

    // Export public API
    exports.showOpenDialog  = showOpenDialog;
    exports.showSaveDialog  = showSaveDialog;
    exports.exists          = exists;
    exports.readdir         = readdir;
    exports.mkdir           = mkdir;
    exports.rename          = rename;
    exports.stat            = stat;
    exports.readFile        = readFile;
    exports.writeFile       = writeFile;
    exports.unlink          = unlink;
    exports.moveToTrash     = moveToTrash;
    exports.initWatchers    = initWatchers;
    exports.watchPath       = watchPath;
    exports.unwatchPath     = unwatchPath;
    exports.unwatchAll      = unwatchAll;
    exports.setFs           = setFs;
});
