/*jslint plusplus: true, devel: true, nomen: true, node: true, vars: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

debugger;

var testCase    = require("nodeunit").testCase,
    http        = require("http"),
    fs          = require("fs"),
    path        = require("path"),
    commander   = require("commander"),
    rewire      = require("rewire"),
    appUrl      = "http://localhost:";

function resetCommander() {
    "use strict";
    
    delete commander.port;
    delete commander.open;
    delete commander.install;
    delete commander.start;
}

function testResponse(test, verifyPort) {
    "use strict";
    
    var run = rewire("../bin/run");
    resetCommander();
        
    run.start(function (err, port) {
        verifyPort(port);
        
        var dsp = false;
        function exit() {
            if (!dsp) {
                dsp = true;
                run.stop();
                test.done();
            }
        }
        
        http.get(appUrl + port + "/brackets/", function (res) {
            res.setEncoding("utf8");
            
            test.equal(res.statusCode, 200);
            test.equal(res.headers["content-type"], "text/html; charset=UTF-8");
            res.on("data", function (chunk) {
                var str = String(chunk);
                test.ok(str.indexOf("<script src=\"thirdparty/require.js\" data-main=\"brackets\"></script>") !== -1);
                exit();
            });
            res.on("end", function (chunk) {
                exit();
            });
        }).on("error", function (e) {
            console.log("Got error: " + e.message);
            exit();
        });
    });
}

module.exports = testCase({
    "Fixture Setup": function (test) {
        "use strict";
        
        process.env.NODE_ENV = "test";
                
        test.done();
    },
    "Run Without Arguments": function (test) {
        "use strict";
        
        test.expect(5);
        
        testResponse(test, function (port) {
            test.ok(port);
            test.ok(port >= 6000 && port <= 6800);
        });
    },
    "Test Environment Port": function (test) {
        "use strict";
        
        test.expect(4);
        
        process.env.BRACKETS_PORT = 15456;
        
        testResponse(test, function (port) {
            test.equal(port, 15456);
            delete process.env.BRACKETS_PORT;
        });
    },
    "Run on Specific Port": function (test) {
        "use strict";
        
        test.expect(4);
        
        var orgArgv = process.argv;
        process.argv = ["node", "../lib/node_modules/brackets/bin/run.js", "-p", "18658"];
        
        testResponse(test, function (port) {
            test.equal(port, 18658);
            
            process.argv = orgArgv;
        });
    },
    "Tetst Shebang": function (test) {
        "use strict";
        
        test.expect(1);
        
        fs.readFile("../bin/run.js", function (err, data) {
            if (err) {
                throw err;
            }
            var array = data.toString().split("\n");
            test.equal(array[0], "#!/usr/bin/env node");
            test.done();
        });
    },
    "Tetst -op Parameters": function (test) {
        "use strict";
        
        test.expect(3);
        
        var orgArgv = process.argv,
            run     = rewire("../bin/run");
        
        resetCommander();
        
        process.argv = ["node", "../lib/node_modules/brackets/bin/run", "-op", "18658"];
        run.__set__("open", function (url) {
            test.equal(url, "http://localhost:18658");
            run.stop();
            process.argv = orgArgv;
            test.done();
        });
        
        run.start(function (err, port) {
            test.ok(!err);
            test.equal(port, 18658);
        });
    },
    "Tetst --open Parameter on Rendom Port": function (test) {
        "use strict";
        
        test.expect(1);
        
        var orgArgv = process.argv,
            run     = rewire("../bin/run"),
            port;
        
        resetCommander();
        
        process.argv = ["node", "../lib/node_modules/brackets/bin/run", "--open"];
        
        run.__set__("open", function (url) {
            test.equal(url, "http://localhost:" + port);
            run.stop();
            process.argv = orgArgv;
            test.done();
        });
        
        run.start(function (err, argPort) {
            port = argPort;
        });
    },
    "Tetst Template Installation With Script": function (test) {
        "use strict";
        
        test.expect(12);
        
        var orgArgv = process.argv,
            run     = rewire("../bin/run"),
            srcDir = path.join(__dirname, "../bin/templates/express"),
            dstDir = process.cwd();
        
        resetCommander();
        
        process.argv = ["node", "../lib/node_modules/brackets/bin/run", "-i", "express -e"];
        
        run.__set__("wrench", {
            copyDirSyncRecursive: function (src, dst, opt) {
                test.equal(src, srcDir);
                test.equal(dst, dstDir);
                test.ok(opt.excludeHiddenUnix);
                test.ok(opt.preserve);
            }
        });
        
        run.__set__("npm", {
            load: function (conf, callback) {
                callback();
            },
            commands: {
                install: function (args, callback) {
                    test.ok(args.length === 0);
                    callback(null, {});
                }
            }
        });
        
        run.__set__("fs", {
            exists: function (file, callback) {
                test.equal(file, path.join(srcDir, ".bin"));
                callback(true);
            },
            readdir: function (path, callback) {
                test.equal(dstDir, path);
                
                // Simulate empty directory
                callback();
            }
        });
        
        run.__set__("getInstallScritp", function (scriptPath) {
            test.equal(scriptPath, path.join(srcDir, ".bin"));
            return {
                install: function (args, callback) {
                    test.ok(args.length === 1);
                    test.ok(args[0] === "-e");
                    callback();
                }
            };
        });
        
        run.start(function (err, port) {
            test.ok(err === undefined);
            test.ok(port === undefined);
            test.done();
        });
    },
    "Tetst Template Installation Without Script": function (test) {
        "use strict";
        
        test.expect(6);
        
        var orgArgv = process.argv,
            run     = rewire("../bin/run"),
            srcDir = path.join(__dirname, "../bin/templates/plain-connect"),
            dstDir = process.cwd();
        
        resetCommander();
        
        process.argv = ["node", "../lib/node_modules/brackets/bin/run", "-i", "plain-connect"];
        
        run.__set__("wrench", {
            copyDirSyncRecursive: function (src, dst, opt) {
                test.equal(src, srcDir);
                test.equal(dst, dstDir);
                test.ok(opt.excludeHiddenUnix);
                test.ok(opt.preserve);
            }
        });
        
        run.__set__("npm", {
            load: function (conf, callback) {
                callback();
            },
            commands: {
                install: function (args, callback) {
                    callback(null, {});
                }
            }
        });
        
        run.__set__("fs", {
            exists: function (file, callback) {
                callback(false);
            },
            readdir: function (path, callback) {
                // Simulate empty directory
                callback();
            }
        });
        
        run.__set__("getInstallScritp", function (scriptPath) {
            throw new Error("getInstallScritp should not be called.");
        });
        
        run.start(function (err, port) {
            test.ok(err === undefined);
            test.ok(port === undefined);
            test.done();
        });
    }
});