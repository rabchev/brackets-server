/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var fs = require("fs");
var url = require("url");
var path = require("path");
var send = require("../node_modules/connect/node_modules/send");
var mustach = require("../brackets/src/thirdparty/mustache");

var index, env;
var namespaces = {
	fs : fs
};

// add some stuff to fs because the return types are sometimes complicated objects that don't jsonify
fs.statBrackets = function (path, callback) {
    "use strict";
    
	fs.stat(path, function (err, stats) {
		if (err) {
			callback(err, null);
		} else {
			var result = {};
			result.isFile = stats.isFile();
			result.isDirectory = stats.isDirectory();
			result.mtime = stats.mtime;
			result.filesize = stats.size;
			callback(0, result); // TODO: hack, need handling of error being null in callbacks on client side
		}
	});
};

function handleError(res, message, statusCode, reasonPhrase) {
    "use strict";
    
    message = "Error: " + message + "\n";
    console.log(message);
    res.writeHead(statusCode || 500, reasonPhrase || "Internal server error", {"Content-Type": "text/plain"});
    res.write(message);
    res.end();
}

function createCallback(id, res) {
    "use strict";
    
    return function () {
        var args = Array.prototype.slice.call(arguments),
            result = args[0];
        if (result === null) { // Brackets expects 0 response code on successful write but Node fs returns null 
            args[0] = 0;
        } else if (result.code) {
            switch (result.code) {
            case "ENOENT": // Not found, Brackets expects response code 3
                args[0] = 3;
                break;
            }
        }
        
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify({id: id, result: args}));
        res.end();
	};
}

function doCommand(id, namespace, command, args, res) {
    "use strict";
    
    var filePath = args[0];
    if (filePath === "/.git/HEAD") {
        args[0] = path.normalize(__dirname + "/../brackets" + filePath);
    } else if (filePath.indexOf(env.bracketsRoot) === 0) {
        args[0] = path.normalize(__dirname + "/../brackets/src" + filePath.substr(env.bracketsRoot.length));
    } else {
        args[0] = path.normalize(env.initialPath + filePath);
    }
    
    try {
        var f = namespaces[namespace][command],
            callback = createCallback(id, res);
    
        args.push(callback);
        f.apply(global, args);
    } catch (e) {
        handleError(res, "Couldn't run the command " + namespace + "." + command + " with args " + JSON.stringify(args));
    }
}

function sendIndex(res) {
    "use strict";
    
    res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
    res.write(mustach.render(index, env));
    res.end();
}

function processFilesRequest(req, res) {
    "use strict";
    
    if (req.method === "POST") {
        var body = "";
        req.setEncoding("utf8");
        req.on("data", function (chunk) {
            body += chunk;
        }).on("end", function () {
            var m = JSON.parse(body);
            doCommand(m.id, m.namespace, m.command, m.args, res);
        });
        return;
    }
    
    handleError(res, "405 - Method not supported", 405, "Method not supported");
}

function initialize(workDirctories) {
    "use strict";
    var initialPath;
    if (typeof workDirctories === "string") {
        initialPath = workDirctories;
    }
    env = {
        initialPath: initialPath || process.cwd(),
        fileService: "",
        bracketsRoot: ""
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
                        handleError(res, err);
                        return;
                    }
                    
                    var pathname = req.originalUrl;
                    index = data.toString();
                    env.fileService = url.resolve(pathname, "files.svc");
                    env.bracketsRoot = pathname.substr(0, pathname.lastIndexOf("/"));
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
