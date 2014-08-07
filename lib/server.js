/*jshint -W086 */

"use strict";

// NOTE: Brackets doesn't fully support browsers yet and we need some workarounds. Workarounds will be marked with "HACK:" label.

var fs          = require("fs"),
    http        = require("http"),
    https       = require("https"),
    path        = require("path"),
    send        = require("send"),
    util        = require("util"),
    files       = require("./files"),
    socket      = require("socket.io"),
    brckDist    = {root: path.join(__dirname, "..", "brackets-dist")},
    brckSrc     = {root: path.join(__dirname, "..", "brackets-src", "src")},
    clientFs    = {root: path.join(__dirname, "..", "client-fs")},
    hacks       = {root: path.join(__dirname, "..", "hacks")};

require("./shim");

function removeTrailingSlash(path) {
    return path[path.length - 1] === "/" ? path.substr(0, path.length - 1) : path;
}

function getModified(inst, file, root, callback) {
    if (inst._cache[file]) {
        return callback(null, inst._cache[file]);
    }

    fs.readFile(path.join(root || brckSrc.root, file), function (err, data) {
        if (err) {
            return callback(err);
        }

        var str = data.toString(),
            rpl = inst._replace[file];

        if (rpl && rpl.match !== rpl.value) {
            str = str.replace(rpl.match, rpl.value);
        }
        inst._cache[file] = str;
        callback(null, str);
    });
}

function sendModified(inst, file, res, root) {
    getModified(inst, file, root, function (err, data) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain; charset=utf-8"});
            res.end(err.message);
        } else {
            res.writeHead(200, {"Content-Type": "application/javascript; charset=utf-8"});
            res.end(data);
        }
    });
}

function createHttpServer(inst, port) {
    inst.httpServer = http.createServer(function (req, res) {
        if (req.url === "/") {
            res.writeHead(302, {Location: inst.root + "/"});
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
        if (req.url.startsWith(root)) {
            var url = req.url.substr(root.length);

            switch (url) {
                case "":
                case "/":
                    url = "/index.html";
                    break;
                case "/main.js":
                    // Replace entire Brackets source with optimized version.
                    return send(req, "/main-built.js", brckDist).pipe(res);
                case "/brackets.js":
                case "/utils/Global.js":
                    return sendModified(inst, url, res);
                case "/filesystem/impls/socket-io-fs.js":
                    return sendModified(inst, "/file-system.js", res, clientFs.root);
            }

            if (url.startsWith("/hacks/")) {
                return send(req, url.substr(6), hacks).pipe(res);
            }

            if (url.startsWith("/s3.amazonaws.com/")) {
                var options = {
                    hostname: "s3.amazonaws.com",
                    port: 443,
                    path: url.substr(17),
                    method: "GET"
                };

                req.pause();
                var connector = https.request(options, function(_res) {
                    _res.pause();
                    res.writeHead(_res.statusCode, _res.headers);
                    _res.pipe(res);
                    _res.resume();
                });
                req.pipe(connector);
                req.resume();
                return;
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
    this.root = removeTrailingSlash(opts.root || "/brackets");
    this.extensionsDir = opts.extensionsDir || path.resolve("brackets-ext");

    this._cache = {};
    this._replace = {
        // HACK: For in browser loading we need to replace file system implementation very early to avoid exceptions.
        "/main.js": {
            match: "filesystem/impls/appshell/AppshellFileSystem",
            value: "filesystem/impls/socket-io-fs"
        },
        // HACK: 1. We have to mock shell app.
        // HACK: 2. Brackets inBrowser behaves very differently, that's why we have to fake it.
        // HACK: 3. We need the menus in the Browser.
        // HACK: 4/5. Brackets extension registry services don't allow CORS, that's why we have to proxy the requests.
        "/utils/Global.js": {
            match: "global.brackets.app = {};",
            value: "global.brackets.app = require(\"hacks/app\"); global.brackets.inBrowser = false; global.brackets.nativeMenus = false; global.brackets.config.extension_registry = '/brackets/s3.amazonaws.com/extend.brackets/registry.json'; global.brackets.config.extension_url = '/brackets/s3.amazonaws.com/extend.brackets/{0}/{0}-{1}.zip';"
        },
        // HACK: Remove warning dialog about Brackets not been ready for browsers.
        "/brackets.js": {
            match: /\/\/ Let the user know Brackets doesn't run in a web browser yet\s+if \(brackets.inBrowser\) {/,
            value: "if (false) {"
        },
        "/file-system.js": {
            match: "/brackets",
            value: this.root
        }
    };

    attachStatic(this);

    // Attach file system methods to socket.io.
    files.init(this);
}

module.exports = Server;
