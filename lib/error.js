/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, sloppy: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var strings = require("./strings");

function LocalizableError(code, message) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.code = code;
    if (message) {
        this.message = message;
    } else {
        this.message = strings[code];
    }
}

LocalizableError.prototype.__proto__ = Error.prototype;

exports = module.exports = LocalizableError;