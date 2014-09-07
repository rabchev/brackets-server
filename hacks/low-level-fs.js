define(function (require, exports) {
    "use strict";

    var fs              = require("fileSystemImpl"),
        FileSystemError = require("filesystem/FileSystemError");

    function StatMap(stats) {
        this._stats = stats;
    }

    StatMap.prototype.isDirectory = function () {
        return this._stats.isDirectory;
    };

    StatMap.prototype.isFile = function () {
        return this._stats.isFile;
    };

    function stat(path, callback) {
        fs.stat(path, function (err, stats) {
            if (err) {
                return callback(err);
            }
            callback(null, new StatMap(stats));
        });
    }

    function makedir(path, mode, callback) {
        fs.mkdir(path, parseInt(mode + "", 8), callback);
    }

    function readdir(path, callback) {
        fs.readdir(path, callback);
    }

    function copyFile(src, dest, callback) {
        fs.copyFile(src, dest, callback);
    }

    exports.stat = stat;
    exports.makedir = makedir;
    exports.readdir = readdir;
    exports.copyFile = copyFile;

    exports.NO_ERROR = null;
    exports.ERR_NOT_FOUND = FileSystemError.NOT_FOUND;
});
