define(function (require, exports) {
    "use strict";

    var FileSystemStats     = brackets.getModule("filesystem/FileSystemStats"),
        FileSystemError     = brackets.getModule("filesystem/FileSystemError"),
        OpenDialog          = require("./open-dialog"),
        SaveDialog          = require("./save-dialog"),
        io                  = require("../thirdparty/socket.io");

    /**
     * Callback to notify FileSystem of watcher changes
     * @type {?function(string, FileSystemStats=)}
     */
    var _changeCallback;

    /**
     * Callback to notify FileSystem if watchers stop working entirely
     * @type {?function()}
     */
    var _offlineCallback;

    function _mapError(err) {
        if (!err) {
            return null;
        }
        switch (err.code) {
            case "ERR_INVALID_PARAMS":
                return FileSystemError.INVALID_PARAMS;
            case "ENOENT":
                return FileSystemError.NOT_FOUND;
            case "ERR_CANT_READ":
                return FileSystemError.NOT_READABLE;
            case "ERR_CANT_WRITE":
                return FileSystemError.NOT_WRITABLE;
            case "ERR_UNSUPPORTED_ENCODING":
                return FileSystemError.UNSUPPORTED_ENCODING;
            case "ENOSPC":
                return FileSystemError.OUT_OF_SPACE;
            case "EEXIST":
                return FileSystemError.ALREADY_EXISTS;
        }
        return FileSystemError.UNKNOWN;
    }

    var socket;

    function init(url) {
        socket = io.connect(url);

        socket.on("greeting", function (data) {
            if (data === "hi") {
                console.log("Socket.io connected!");
            }
        });
    }

    /**
     * Display an open-files dialog to the user and call back asynchronously with
     * either a FileSystmError string or an array of path strings, which indicate
     * the entry or entries selected.
     *
     * @param {boolean} allowMultipleSelection
     * @param {boolean} chooseDirectories
     * @param {string} title
     * @param {string} initialPath
     * @param {Array.<string>=} fileTypes
     * @param {function(?string, Array.<string>=)} callback
     */
    function showOpenDialog(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        OpenDialog.show(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback);
    }

    /**
     * Display a save-file dialog and call back asynchronously with either a
     * FileSystemError string or the path to which the user has chosen to save
     * the file. If the dialog is cancelled, the path string will be empty.
     *
     * @param {string} title
     * @param {string} initialPath
     * @param {string} proposedNewFilename
     * @param {function(?string, string=)} callback
     */
    function showSaveDialog(title, initialPath, proposedNewFilename, callback) {
        SaveDialog.show(title, initialPath, proposedNewFilename, callback);
    }

    /**
     * Stat the file or directory at the given path, calling back
     * asynchronously with either a FileSystemError string or the entry's
     * associated FileSystemStats object.
     *
     * @param {string} path
     * @param {function(?string, FileSystemStats=)} callback
     */
    function stat(path, callback) {
        socket.emit("stat", path, function (res) {
            if (res.err) {
                callback(_mapError(res.err));
            } else {
                res.stats.mtime = new Date(res.stats.mtime);
                callback(null, new FileSystemStats(res.stats));
            }
        });
    }

    /**
     * Determine whether a file or directory exists at the given path by calling
     * back asynchronously with either a FileSystemError string or a boolean,
     * which is true if the file exists and false otherwise. The error will never
     * be FileSystemError.NOT_FOUND; in that case, there will be no error and the
     * boolean parameter will be false.
     *
     * @param {string} path
     * @param {function(?string, boolean)} callback
     */
    function exists(path, callback) {
        stat(path, function (err) {
            if (err) {
                if (err === FileSystemError.NOT_FOUND) {
                    callback(null, false);
                } else {
                    callback(err);
                }
                return;
            }

            callback(null, true);
        });
    }

    /**
     * Read the contents of the directory at the given path, calling back
     * asynchronously either with a FileSystemError string or an array of
     * FileSystemEntry objects along with another consistent array, each index
     * of which either contains a FileSystemStats object for the corresponding
     * FileSystemEntry object in the second parameter or a FileSystemError
     * string describing a stat error.
     *
     * @param {string} path
     * @param {function(?string, Array.<FileSystemEntry>=, Array.<string|FileSystemStats>=)} callback
     */
    function readdir(path, callback) {
        socket.emit("readdir", path, function (res) {
            if (res.err) {
                return callback(_mapError(res.err));
            }

            var count = res.contents.length;
            if (!count) {
                return callback(null, [], []);
            }

            var stats = [];
            res.contents.forEach(function (val, idx) {
                stat(path + "/" + val, function (err, stat) {
                    stats[idx] = err || stat;
                    count--;
                    if (count <= 0) {
                        callback(null, res.contents, stats);
                    }
                });
            });
        });
    }

    /**
     * Create a directory at the given path, and call back asynchronously with
     * either a FileSystemError string or a stats object for the newly created
     * directory. The octal mode parameter is optional; if unspecified, the mode
     * of the created directory is implementation dependent.
     *
     * @param {string} path
     * @param {number=} mode The base-eight mode of the newly created directory.
     * @param {function(?string, FileSystemStats=)=} callback
     */
    function mkdir(path, mode, callback) {
        if (typeof mode === "function") {
            callback = mode;
            mode = parseInt("0755", 8);
        }
        socket.emit("mkdir", { path: path, mode: mode }, function (err) {
            if (callback) {
                if (err) {
                    return callback(_mapError(err));
                }
                stat(path, callback);
            }
        });
    }

    /**
     * Rename the file or directory at oldPath to newPath, and call back
     * asynchronously with a possibly null FileSystemError string.
     *
     * @param {string} oldPath
     * @param {string} newPath
     * @param {function(?string)=} callback
     */
    function rename(oldPath, newPath, callback) {
        socket.emit("rename", { oldPath: oldPath, newPath: newPath }, function (err) {
            if (callback) {
                callback(_mapError(err));
            }
        });
    }

    /**
     * Read the contents of the file at the given path, calling back
     * asynchronously with either a FileSystemError string, or with the data and
     * the FileSystemStats object associated with the read file. The options
     * parameter can be used to specify an encoding (default "utf8"), and also
     * a cached stats object that the implementation is free to use in order
     * to avoid an additional stat call.
     *
     * Note: if either the read or the stat call fails then neither the read data
     * nor stat will be passed back, and the call should be considered to have failed.
     * If both calls fail, the error from the read call is passed back.
     *
     * @param {string} path
     * @param {{encoding: string=, stat: FileSystemStats=}} options
     * @param {function(?string, string=, FileSystemStats=)} callback
     */
    function readFile(path, options, callback) {
        var encoding = options.encoding || "utf8";

        // Execute the read and stat calls in parallel. Callback early if the
        // read call completes first with an error; otherwise wait for both
        // to finish.
        var done = false, data, fileStat, err;

        if (options.stat) {
            done = true;
            fileStat = options.stat;
        } else {
            stat(path, function (_err, _stat) {
                if (done) {
                    callback(_err, _err ? null : data, _stat);
                } else {
                    done = true;
                    fileStat = _stat;
                    err = _err;
                }
            });
        }

        socket.emit("readFile", { path: path, encoding: encoding }, function (res) {
            if (res.err) {
                callback(_mapError(res.err));
                return;
            }

            if (done) {
                callback(err, err ? null : res.data, fileStat);
            } else {
                done = true;
                data = res.data;
            }
        });
    }

    /**
     * Write data to the file at the given path, calling back asynchronously with
     * either a FileSystemError string or the FileSystemStats object associated
     * with the written file and a boolean that indicates whether the file was
     * created by the write (true) or not (false). If no file exists at the
     * given path, a new file will be created. The options parameter can be used
     * to specify an encoding (default "utf8"), an octal mode (default
     * unspecified and implementation dependent), and a consistency hash, which
     * is used to the current state of the file before overwriting it. If a
     * consistency hash is provided but does not match the hash of the file on
     * disk, a FileSystemError.CONTENTS_MODIFIED error is passed to the callback.
     *
     * @param {string} path
     * @param {string} data
     * @param {{encoding : string=, mode : number=, expectedHash : object=, expectedContents : string=}} options
     * @param {function(?string, FileSystemStats=, boolean)} callback
     */
    function writeFile(path, data, options, callback) {
        var encoding = options.encoding || "utf8";

        function _finishWrite(created) {
            socket.emit("writeFile", { path: path, data: data, encoding: encoding }, function (err) {
                if (err) {
                    callback(_mapError(err));
                } else {
                    stat(path, function (err, stat) {
                        callback(err, stat, created);
                    });
                }
            });
        }

        stat(path, function (err, stats) {
            if (err) {
                switch (err) {
                    case FileSystemError.NOT_FOUND:
                        _finishWrite(true);
                        break;
                    default:
                        callback(err);
                }
                return;
            }

            if (options.hasOwnProperty("expectedHash") && options.expectedHash !== stats._hash) {
                console.error("Blind write attempted: ", path, stats._hash, options.expectedHash);

                if (options.hasOwnProperty("expectedContents")) {
                    readFile(path, options, function (_err, _data) {
                        if (_err || _data !== options.expectedContents) {
                            callback(FileSystemError.CONTENTS_MODIFIED);
                            return;
                        }

                        _finishWrite(false);
                    });
                    return;
                } else {
                    callback(FileSystemError.CONTENTS_MODIFIED);
                    return;
                }
            }

            _finishWrite(false);
        });
    }

    /**
     * Unlink (i.e., permanently delete) the file or directory at the given path,
     * calling back asynchronously with a possibly null FileSystemError string.
     * Directories will be unlinked even when non-empty.
     *
     * @param {string} path
     * @param {function(string)=} callback
     */
    function unlink(path, callback) {
        socket.emit("unlink", path, function (err) {
            if (callback) {
                callback(_mapError(err));
            }
        });
    }

    /**
     * Move the file or directory at the given path to a system dependent trash
     * location, calling back asynchronously with a possibly null FileSystemError
     * string. Directories will be moved even when non-empty.
     *
     * @param {string} path
     * @param {function(string)=} callback
     */
    function moveToTrash(path, callback) {
        socket.emit("moveToTrash", path, function (err) {
            if (callback) {
                callback(_mapError(err));
            }
        });
    }

    /**
     * Initialize file watching for this filesystem, using the supplied
     * changeCallback to provide change notifications. The first parameter of
     * changeCallback specifies the changed path (either a file or a directory);
     * if this parameter is null, it indicates that the implementation cannot
     * specify a particular changed path, and so the callers should consider all
     * paths to have changed and to update their state accordingly. The second
     * parameter to changeCallback is an optional FileSystemStats object that
     * may be provided in case the changed path already exists and stats are
     * readily available. The offlineCallback will be called in case watchers
     * are no longer expected to function properly. All watched paths are
     * cleared when the offlineCallback is called.
     *
     * @param {function(?string, FileSystemStats=)} changeCallback
     * @param {function()=} offlineCallback
     */
    function initWatchers(changeCallback, offlineCallback) {
        _changeCallback = changeCallback;
        _offlineCallback = offlineCallback;
    }

    /**
     * Start providing change notifications for the file or directory at the
     * given path, calling back asynchronously with a possibly null FileSystemError
     * string when the initialization is complete. Notifications are provided
     * using the changeCallback function provided by the initWatchers method.
     * Note that change notifications are only provided recursively for directories
     * when the recursiveWatch property of this module is true.
     *
     * @param {string} path
     * @param {Array<string>} ignored
     * @param {function(?string)=} callback
     */

    function watchPath(path, ignored, callback) {
        socket.emit("watchPath", path, ignored, function (err) {
            if (callback) {
                callback(_mapError(err));
            }
        });
    }

    /**
     * Stop providing change notifications for the file or directory at the
     * given path, calling back asynchronously with a possibly null FileSystemError
     * string when the operation is complete.
     * This function needs to mirror the signature of watchPath
     * because of FileSystem.prototype._watchOrUnwatchEntry implementation.
     *
     * @param {string} path
     * @param {Array<string>} ignored
     * @param {function(?string)=} callback
     */
    function unwatchPath(path, ignored, callback) {
        socket.emit("unwatchPath", path, ignored, function (err) {
            if (callback) {
                callback(_mapError(err));
            }
        });
    }

    /**
     * Stop providing change notifications for all previously watched files and
     * directories, optionally calling back asynchronously with a possibly null
     * FileSystemError string when the operation is complete.
     *
     * @param {function(?string)=} callback
     */
    function unwatchAll(callback) {
        socket.emit("unwatchAll", "", function (err) {
            if (callback) {
                callback(_mapError(err));
            }
        });
    }

    function copyFile(srcPath, destPath, callback) {
        socket.emit("copyFile", { src: srcPath, dest: destPath}, function (err) {
            if (callback) {
                callback(_mapError(err));
            }
        });
    }

    function setDialogs(openDlg, saveDlg) {
        OpenDialog = openDlg;
        SaveDialog = saveDlg;
    }

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
    exports.copyFile        = copyFile;
    exports._setDialogs     = setDialogs;
    exports._init           = init;

    /**
     * Indicates whether or not recursive watching notifications are supported
     * by the watchPath call. Currently, only Darwin supports recursive watching.
     *
     * @type {boolean}
     */
    exports.recursiveWatch = false;

    /**
     * Indicates whether or not the filesystem should expect and normalize UNC
     * paths. If set, then //server/directory/ is a normalized path; otherwise the
     * filesystem will normalize it to /server/directory. Currently, UNC path
     * normalization only occurs on Windows.
     *
     * @type {boolean}
     */
    exports.normalizeUNCPaths = false;

    // The line below is a placeholder for the server version.
    // init("/brackets");
});
