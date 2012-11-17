/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var connect     = require("connect"),
    util        = require("util"),
    brackets    = require("./");

var port = 5686;

connect()
    .use('/brackets', brackets())
    .use(function (req, res) {
        "use strict";
        
        if (req.url === "/") {
            res.writeHead(302, {Location: "/brackets/"});
            res.end();
        } else {
            res.writeHead(304);
            res.end("Not found");
        }
    })
    .listen(port);

console.log(util.format("\n  listening on port %d\n", port));