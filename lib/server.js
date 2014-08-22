/*jshint -W086 */

"use strict";

// NOTE: Brackets doesn't fully support browsers yet and we need some workarounds. Workarounds will be marked with "HACK:" label.

var http        = require("http"),
    https       = require("https"),
    path        = require("path"),
    send        = require("send"),
    util        = require("util"),
    files       = require("./files"),
    socket      = require("socket.io"),
    brckDist    = {root: path.join(__dirname, "..", "brackets-dist")},
    zipped      = { ".js": "application/javascript", ".css": "text/css"};

require("./shim");

function removeTrailingSlash(path) {
    return path[path.length - 1] === "/" ? path.substr(0, path.length - 1) : path;
}

function createHttpServer(inst, port) {
    inst.httpServer = http.createServer(function (req, res) {
        if (req.url === "/") {
            res.writeHead(302, {Location: inst.httpRoot + "/"});
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
        root = inst.httpRoot,
        evs = srv.listeners("request").slice(0);

    srv.removeAllListeners("request");
    srv.on("request", function(req, res) {
        if (req.url.startsWith(root)) {
            var url = req.url.substr(root.length);

            if (url === "" || url === "/") {
                url = "/index.html";
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

            var cntType = zipped[path.extname(url)];
            if (cntType) {
                send(req, url + ".gz", brckDist)
                    .on("headers", function (_res) {
                        _res.setHeader("Content-Encoding", "gzip");
                        _res.setHeader("Content-Type", cntType);
                    })
                    .pipe(res);
                return;
            }

            send(req, url, brckDist).pipe(res);
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

    this.httpRoot = removeTrailingSlash(opts.httpRoot || "/brackets");
    this.defaultExtensions = path.join(brckDist.root, "extensions");
    this.supportDir = removeTrailingSlash(opts.supportDir || path.resolve("./brackets"));
    this.projectsDir = removeTrailingSlash(opts.projectsDir || path.resolve("./projects"));
    this.samplesDir = removeTrailingSlash(opts.samplesDir || path.join(brckDist.root, "samples"));
    this.fileSystem = opts.fileSystem || require("./file-sys/native");

    attachStatic(this);

    // Attach file system methods to socket.io.
    files.init(this);
}

module.exports = Server;
