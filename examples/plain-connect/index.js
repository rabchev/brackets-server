/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

try {
    var connect     = require("../../node_modules/connect"),
        brackets    = require("../..");
} catch (e) {
    console.log("Cannot find dependant module.");
    console.log("Please install dependant modules for this project by doing:");
    console.log("");
    console.log("    $ cd ../..");
    console.log("    $ npm install");
    console.log("");
    process.exit();
}

connect()
    .use('/brackets', brackets())
    .use(function (req, res) {
        "use strict";
        res.end('Hello World');
    })
    .listen(3000);

console.log("\n  listening on port 3000\n");