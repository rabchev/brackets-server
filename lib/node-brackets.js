/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var fs = require("fs");
var url = require("url");
var send = require("../node_modules/connect/node_modules/send");
var mustach = require("../brackets/src/thirdparty/mustache");

var index, view;

function sendIndex(res) {
    "use strict";
    
    res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
    res.write(mustach.render(index, view));
    res.end();
}

function processFilesRequest(req, res) {
    "use strict";
    
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write("Not implemented! This service should return file.");
    res.end();
}

function initialize(initialPath) {
    "use strict";
    
    view = {
        initialPath: initialPath || "/",
        fileService: ""
    };
    
    return function (req, res, next) {
        var idx = req.originalUrl.length - 1;
        if (req.url === "/" && req.originalUrl[idx] !== "/") {
            res.writeHead(302, {Location: req.originalUrl + "/"});
            res.end();
        } else if (req.url === "/" || req.url === "/index.html") {
            if (!index) {
                fs.readFile(__dirname + "/../brackets/src/index.html", function (err, data) {
                    if (err) {
                        res.writeHead(500, {"Content-Type": "text/plain"});
                        res.write(err + "\n");
                        res.end();
                        return;
                    }
                    
                    index = data.toString();
                    view.fileService = url.resolve(req.originalUrl, "files.svc");
                    sendIndex(res);
                });
                return;
            }
            sendIndex(res);
        } else if (req.url.indexOf("/files.svc") === 0) {
            processFilesRequest(req, res);
        } else {
            send(req, req.url)
                .root(__dirname + "/../brackets/src")
                .pipe(res);
        }
    };
}

exports = module.exports = initialize;
