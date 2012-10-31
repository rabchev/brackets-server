/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var fs = require("fs");
var url = require("url");
var send = require("../node_modules/connect/node_modules/send");
var mustach = require("../brackets/src/thirdparty/mustache");

var index, view;
var namespaces = {
	fs : fs
};

function createCallback(id, res) {
    "use strict";
    
	return function () {
		var args = Array.prototype.slice.call(arguments);
        
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify({id: id, result: args}));
        res.end();
	};
}

function doCommand(id, namespace, command, args, res) {
    "use strict";
    
	try {
		var f = namespaces[namespace][command],
            callback = createCallback(id, res);
            
        callback(f.apply(global, args));
	} catch (e) {
		console.log("Error: Couldn't run the command " + namespace + "." + command + " with args " + JSON.stringify(args));
	}
}

function sendIndex(res) {
    "use strict";
    
    res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
    res.write(mustach.render(index, view));
    res.end();
}

function processFilesRequest(req, res) {
    "use strict";
    
    if (req.method === "POST") {
        var body;
        req.on("data", function (chunk) {
            body += chunk.toString();
        }).on("end", function () {
            var m = JSON.parse(body);
            doCommand(m.id, m.namespace, m.command, m.args, res);
        });
        return;
    }
    
    res.writeHead(405, "Method not supported", {"Content-Type": "text/plain"});
    res.end("405 - Method not supported");
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
