/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var testCase    = require("nodeunit").testCase;

module.exports = testCase({
    "Fixture Setup": function (test) {
        "use strict";
        
        process.env.NODE_ENV = "test";
        
        test.done();
    },
    "Run Without Arguments": function (test) {
        "use strict";
        
        debugger;
        test.expect(1);
        
        var run = require("../bin/run");
        
        run.console = {
            log: function (msg) {
                test.ok(msg);
                test.ok(msg.indexOf("\n  listening on port ") === 0);
                test.done();
            }
        };
        
        run.execute();
    }
});