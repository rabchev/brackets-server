"use strict";

exports.init = function (io) {
    io.of("/brackets")
    .on("connection", function () {

    });
    exports.isInit = true;
};
