/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var fs          = require("fs"),
    url         = require("url"),
    util        = require("util"),
    path        = require("path"),
    send        = require("send"),
    wrench      = require("wrench"),
    Error       = require("./error"),
    Strings     = require("./strings"),
    app         = require("./app"),
    mustach     = require("../brackets-src/src/thirdparty/mustache");

var index,
    env,
    namespaces = {
        fs : fs,
        app: app
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

fs.rmdirRecursive = function (path, callback) {
    "use strict";
    
    wrench.rmdirRecursive(path, function (err) {
        callback(err, null);
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

function createCallback(id, namespace, res) {
    "use strict";
    
    return function () {
        var args = Array.prototype.slice.call(arguments);
        
        if (namespace === "fs") {
            var result = args[0];
            if (result === null) { // Brackets expects 0 response code on successful write but Node fs returns null 
                args[0] = 0;
            } else if (result.code) {
                switch (result.code) {
                case "ENOENT": // Not found, Brackets expects response code 3
                    args[0] = 3;
                    break;
                }
            }
        }
                        
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify({id: id, result: args}));
        res.end();
	};
}

function doCommand(id, namespace, command, args, res) {
    "use strict";
    
    if (namespace === "fs") {
        var filePath = args[0];
        if (filePath === "/.git/HEAD") {
            args[0] = path.normalize(__dirname + "/../brackets-src" + filePath);
        } else if (filePath.indexOf(env.bracketsRoot) === 0) {
            args[0] = path.normalize(__dirname + "/../brackets-src/src" + filePath.substr(env.bracketsRoot.length));
        } else {
            args[0] = path.resolve(filePath);
        }
    }
    
    try {
        var f = namespaces[namespace][command],
            callback = createCallback(id, namespace, res);
    
        args.push(callback);
        f.apply(global, args);
    } catch (e) {
        handleError(res, util.format(Strings.COMMAND_FAILED, namespace, command, JSON.stringify(args)));
    }
}

function sendIndex(res) {
    "use strict";
    
    res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
    res.write(mustach.render(index, { data: JSON.stringify(env) }));
    res.end();
}

function processCommandRequest(req, res) {
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
        
function setProjectName() {
    "use strict";
    
    var projPath = process.cwd();
    var packPath = path.join(projPath, "package.json");
    fs.exists(packPath, function (exists) {
        if (exists === true) {
            var pack = require(packPath);
            env.projectName = pack.name || projPath.substr(projPath.lastIndexOf("/") + 1);
        } else {
            env.projectName = projPath.substr(projPath.lastIndexOf("/") + 1);
        }
    });
}

function initialize(workDirectories) {
    "use strict";
    
    var folders, argType = typeof workDirectories;
    
    switch (argType) {
    case "string":
        if (workDirectories === "") {
            workDirectories = "./";
        }
        folders = [workDirectories];
        break;
    case "undefined":
        folders = ["./"];
        break;
    case "object":
        if (workDirectories instanceof Array) {
            folders = workDirectories;
            if (folders.length === 0) {
                folders[0] = "./";
            }
            break;
        }
        // fall through
    default:
        throw new Error("INVALID_ARG_MODULE_INIT");
    }
    
    env = {
        currentRootFolder: folders[0],
        rootFolders: folders,
        fileService: "",
        bracketsRoot: ""
    };
        
    setProjectName();
    
    return function (req, res, next) {
        var idx = req.originalUrl.length - 1;
        if (req.url === "/" && req.originalUrl[idx] !== "/") {
            res.writeHead(302, {Location: req.originalUrl + "/"});
            res.end();
        } else if (req.url === "/" || req.url === "/index.html") {
            if (!index) {
                fs.readFile(__dirname + "/../brackets-src/src/index.html", function (err, data) {
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
            processCommandRequest(req, res);
        } else {
            send(req, req.url)
                .root(__dirname + "/../brackets-src/src")
                .pipe(res);
        }
    };
}

exports = module.exports = initialize;
