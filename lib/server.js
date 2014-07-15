/*jshint -W086 */

"use strict";

var fs          = require("fs"),
    path        = require("path"),
    send        = require("send"),
    brckSrc     = path.join(__dirname, "..", "brackets-src", "src"),
    clientFs    = path.join(__dirname, "..", "client-fs"),
    workDirs,
    mainJs;

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
        } else if (url === "/filesystem/impls/socket-io-fs.js") {
            return send(req, "/file-system.js").root(clientFs).pipe(res);
        }

        send(req, url).root(brckSrc).pipe(res);
    };
};
