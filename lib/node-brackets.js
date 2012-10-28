/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var send = require("../node_modules/connect/node_modules/send");

function initialize() {
    "use strict";
    return function (req, res, next) {
        var idx = req.originalUrl.length - 1;
        if (req.url === "/" && req.originalUrl[idx] !== "/") {
            res.writeHead(302, {Location: req.originalUrl + "/"});
            res.end();
        } else {
            send(req, req.url)
                .root(__dirname + '/../bin/src')
                .pipe(res);
        }
    };
}

exports = module.exports = initialize;
