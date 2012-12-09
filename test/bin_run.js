/*jslint plusplus: true, devel: true, nomen: true, node: true, vars: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

debugger;

var testCase    = require("nodeunit").testCase,
    http        = require("http"),
    fs          = require("fs"),
    path        = require("path"),
    rewire      = require("rewire"),
    appUrl      = "http://localhost:";

function testResponse(test, verifyPort) {
    "use strict";
    
    var run = require("../bin/run");
        
    run.start(function (port) {
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
        
        test.expect(2);
        
        var orgArgv = process.argv,
            run     = rewire("../bin/run");
        
        process.argv = ["node", "../lib/node_modules/brackets/bin/run", "-op", "18658"];
        run.__set__("open", function (url) {
            test.equal(url, "http://localhost:18658");
            run.stop();
            process.argv = orgArgv;
            test.done();
        });
        
        run.start(function (port) {
            test.equal(port, 18658);
        });
    },
    "Tetst --open Parameter on Rendom Port": function (test) {
        "use strict";
        
        test.expect(1);
        
        var orgArgv = process.argv,
            run     = rewire("../bin/run"),
            port;
        
        process.argv = ["node", "../lib/node_modules/brackets/bin/run", "--open"];
        
        run.__set__("open", function (url) {
            test.equal(url, "http://localhost:" + port);
            run.stop();
            process.argv = orgArgv;
            test.done();
        });
        
        run.start(function (argPort) {
            port = argPort;
        });
    },
    "Tetst Template Installation": function (test) {
        "use strict";
        
        test.expect(5);
        
        var orgArgv = process.argv,
            run     = rewire("../bin/run"),
            srcDir = path.join(__dirname, "../bin/templates/express"),
            dstDir = process.cwd();
        
        process.argv = ["node", "../lib/node_modules/brackets/bin/run", "-i", "express -e"];
        
        run.__set__("wrench", {
            copyDirSyncRecursive: function (src, dst, opt) {
                test.equal(src, srcDir);
                test.equal(dst, dstDir);
                test.ok(opt.excludeHiddenUnix);
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
            }
        });
        
        run.start(function (port) {
            test.ok(port === null);
        });
    }
});