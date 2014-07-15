/*jshint -W086 */

// NOTE: Brackets doesn't fully support browsers yet and we need some workarounds. Workarounds will be marked with "HACK:" label.

"use strict";

var fs          = require("fs"),
    path        = require("path"),
    send        = require("send"),
    brckSrc     = path.join(__dirname, "..", "brackets-src", "src"),
    clientFs    = path.join(__dirname, "..", "client-fs"),
    hacks       = path.join(__dirname, "..", "hacks"),
    workDirs,
    mainJs,
    globalJs;

// HACK: For in browser loading we need to replace file system implementation very early to avoid exceptions.
function getMainJs(callback) {
    if (mainJs) {
        return callback(null, mainJs);
    }

    fs.readFile(path.join(brckSrc, "main.js"), function (err, data) {
        if (err) {
            return callback(err);
        }

        mainJs = data.toString().replace("filesystem/impls/appshell/AppshellFileSystem", "filesystem/impls/socket-io-fs");
        callback(null, mainJs);
    });
}

// HACK: We have to mock shell app.
function getGlobalJs(callback) {
    if (globalJs) {
        return callback(null, globalJs);
    }

    fs.readFile(path.join(brckSrc, "utils", "Global.js"), function (err, data) {
        if (err) {
            return callback(err);
        }

        globalJs = data.toString().replace("global.brackets.app = {};",
                                           "global.brackets.app = require(\"hacks/app\");");
        callback(null, mainJs);
    });
}

module.exports = function (workDirectories) {
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

    // TODO: Optimize this funciton.
    return function (req, res, next) {
        var idx = req.originalUrl.length - 1,
            url = req.url;

        if (url === "/" && req.originalUrl[idx] !== "/") {
            res.writeHead(302, {Location: req.originalUrl + "/"});
            return res.end();
        }

        if (url === "/") {
            url = "/index.html";
        } else if (url === "/main.js") {
            return getMainJs(function (err, data) {
                if (err) {
                   return next(err);
                }

                res.writeHead(200, {"Content-Type": "application/javascript; charset=utf-8"});
                res.end(data);
            });
        } else if (url === "/utils/Global.js") {
            return getGlobalJs(function (err, data) {
                if (err) {
                   return next(err);
                }

                res.writeHead(200, {"Content-Type": "application/javascript; charset=utf-8"});
                res.end(data);
            });
        } else if (url === "/filesystem/impls/socket-io-fs.js") {
            return send(req, "/file-system.js").root(clientFs).pipe(res);
        } else if (url.indexOf("/hacks/") === 0) {
            return send(req, url.substr(6)).root(hacks).pipe(res);
        }

        send(req, url).root(brckSrc).pipe(res);
    };
};
