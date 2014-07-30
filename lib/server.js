/*jshint -W086 */

"use strict";

// NOTE: Brackets doesn't fully support browsers yet and we need some workarounds. Workarounds will be marked with "HACK:" label.

var fs          = require("fs"),
    http        = require("http"),
    path        = require("path"),
    send        = require("send"),
    util        = require("util"),
    files       = require("./files"),
    socket      = require("socket.io"),
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
    };

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

function createHttpServer(inst, port) {
    inst.httpServer = http.createServer(function (req, res) {
        if (req.url === "/") {
            res.writeHead(302, {Location: "/brackets/"});
            res.end();
        } else {
            res.writeHead(304);
            res.end("Not found");
        }
    });
    inst.io = socket(inst.httpServer);
    inst.httpServer.listen(port);
    console.log(util.format("\n  listening on port %d\n", port));
}

function attachStatic(inst) {
    var srv = inst.httpServer,
        root = inst.root,
        evs = srv.listeners("request").slice(0);

    srv.removeAllListeners("request");
    srv.on("request", function(req, res) {
        if (0 === req.url.indexOf(root)) {
            var url = req.url;

            switch (url) {
                case "/":
                    if (req.originalUrl[req.originalUrl.length - 1] !== "/") {
                        res.writeHead(302, {Location: req.originalUrl + "/"});
                        return res.end();
                    }
                    url = "/index.html";
                    break;
                case "/main.js":
                case "/brackets.js":
                case "/utils/Global.js":
                    return sendModified(url, res);
                case "/filesystem/impls/socket-io-fs.js":
                    return send(req, "/file-system.js", clientFs).pipe(res);
                default:
                    if (/^\/hacks\//.test(url)) {
                        return send(req, url.substr(6), hacks).pipe(res);
                    }
                    break;
            }

            send(req, url, brckSrc).pipe(res);
        } else {
            for (var i = 0; i < evs.length; i++) {
                evs[i].call(srv, req, res);
            }
        }
    });
}

function Server(srv, opts) {
    if (!(this instanceof Server)) {
        return new Server(srv, opts);
    }

    switch (typeof srv) {
        case "undefined":
        case "null":
            createHttpServer(this, 6800);
            break;
        case "object":
            if (srv instanceof socket) {
                this.io = srv;
                this.httpServer = srv.httpServer;
            } else if (srv instanceof http.Server) {
                this.httpServer = srv;
                this.io = socket(this.httpServer);
            } else {
                opts = srv;
                srv = null;
                createHttpServer(this, 6800);
            }
            break;
        case "number":
        case "string":
            createHttpServer(this, Number(srv));
            break;
        default:
            throw "Invalid argument – srv.";
    }

    opts = opts || {};
    switch (typeof opts.workDirs) {
        case "string":
            if (opts.workDirs === "") {
                opts.workDirs = "./";
            }
            this.workDirs = [opts.workDirs];
            break;
        case "undefined":
            this.workDirs = ["./"];
            break;
        case "object":
            if (opts.workDirs instanceof Array) {
                this.workDirs = opts.workDirs;
                if (this.workDirs.length === 0) {
                    this.workDirs[0] = "./";
                }
                break;
            }
            // fall through
        default:
            throw "Invalid value for workDirs option. Please see documentation for valid options.";
    }
    this.root = opts.root || "/brackets";

    attachStatic(this);
    files.init(this);
}

module.exports = Server;
