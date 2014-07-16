/*jshint -W086 */

"use strict";

// NOTE: Brackets doesn't fully support browsers yet and we need some workarounds. Workarounds will be marked with "HACK:" label.

var fs          = require("fs"),
    path        = require("path"),
    send        = require("send"),
    files       = require("./files"),
    socketIO    = require("socket.io"),
    brckSrc     = {root: path.join(__dirname, "..", "brackets-src", "src")},
    clientFs    = {root: path.join(__dirname, "..", "client-fs")},
    hacks       = {root: path.join(__dirname, "..", "hacks")},
    cache       = {},
    replace     = {
        // HACK: For in browser loading we need to replace file system implementation very early to avoid exceptions.
        "/main.js": {
            match: "filesystem/impls/appshell/AppshellFileSystem",
            value: "filesystem/impls/socket-io-fs"
        },
        // HACK: We have to mock shell app.
        "/utils/Global.js": {
            match: "global.brackets.app = {};",
            value: "global.brackets.app = require(\"hacks/app\");"
        },
        // HACK: Remove warning dialog about Brackets not been ready for browsers.
        "/brackets.js": {
            match: /\/\/ Let the user know Brackets doesn't run in a web browser yet\s+if \(brackets.inBrowser\) {/,
            value: "if (false) {"
        }
    },
    workDirs;

function getModified(file, callback) {
    if (cache[file]) {
        return callback(cache[file]);
    }

    fs.readFile(path.join(brckSrc.root, file), function (err, data) {
        if (err) {
            return callback(err);
        }

        var str = data.toString(),
            rpl = replace[file];

        if (rpl) {
            str = str.replace(rpl.match, rpl.value);
        }
        cache[file] = str;
        callback(null, str);
    });
}

function sendModified(file, res, next) {
    getModified(file, function (err, data) {
        if (err) {
            return next(err);
        }

        res.writeHead(200, {"Content-Type": "application/javascript; charset=utf-8"});
        res.end(data);
    });
}

module.exports = function (workDirectories, io) {
    switch (typeof workDirectories) {
        case "string":
            if (workDirectories === "") {
                workDirectories = "./";
            }
            workDirs = [workDirectories];
            break;
        case "undefined":
            workDirs = ["./"];
            break;
        case "object":
            if (workDirectories instanceof Array) {
                workDirs = workDirectories;
                if (workDirs.length === 0) {
                    workDirs[0] = "./";
                }
                break;
            }
            // fall through
        default:
            throw "Invalid argument for node-brackets module initialization.";
    }

    if (io) {
        files.init(io);
    }

    return function (req, res, next) {
        var url = req.url;

        switch (url) {
            case "/":
                if (req.originalUrl[req.originalUrl.length - 1] !== "/") {
                    res.writeHead(302, {Location: req.originalUrl + "/"});
                    return res.end();
                }
                url = "/index.html";
                if (!files.isInit) {
                    files.init(socketIO(req.app));
                }
                break;
            case "/main.js":
            case "/brackets.js":
            case "/utils/Global.js":
                return sendModified(url, res, next);
            case "/filesystem/impls/socket-io-fs.js":
                return send(req, "/file-system.js", clientFs).pipe(res);
            default:
                if (/^\/hacks\//.test(url)) {
                    return send(req, url.substr(6), hacks).pipe(res);
                }
                break;
        }

        send(req, url, brckSrc).pipe(res);
    };
};
