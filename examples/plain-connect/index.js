/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var connect     = require("../../node_modules/connect"),
    brackets    = require("../..");

connect()
    .use('/brackets', brackets())
    .use(function (req, res) {
        "use strict";
        res.end('Hello World');
    })
    .listen(3000);

console.log("\n  listening on port 3000\n");