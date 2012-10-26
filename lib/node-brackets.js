/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var send = require("../node_modules/connect/node_modules/send");

function initialize() {
    "use strict";
    return function (req, res, next) {
        
        send(req, req.url)
            .root(__dirname + '/../brackets')
            .pipe(res);
    };
}

exports = module.exports = initialize;
