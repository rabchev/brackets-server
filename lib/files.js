"use strict";

exports.init = function (inst) {
    inst.io
        .of(inst.root)
        .on("connection", function () {

        });
};
