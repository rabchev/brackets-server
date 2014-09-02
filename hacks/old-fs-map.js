define(function (require, exports) {
    "use strict";

    var _   = require("thirdparty/lodash"),
        fs  = require("fileSystemImpl");

    _.mixin(exports, fs);

});
