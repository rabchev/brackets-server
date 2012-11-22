/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var path = require("path");

exports.install = function (callback) {
    "use strict";
    
    process.argv = ["express"];
    var expPath = path.join(process.cwd(), "node_modules", "express", "bin", "express"),
        express = require(expPath);
    
    callback();
};