/*jshint -W086 */

"use strict";

module.exports = function (workDirectories) {
    var folders;

    switch (typeof workDirectories) {
    case "string":
        if (workDirectories === "") {
            workDirectories = "./";
        }
        folders = [workDirectories];
        break;
    case "undefined":
        folders = ["./"];
        break;
    case "object":
        if (workDirectories instanceof Array) {
            folders = workDirectories;
            if (folders.length === 0) {
                folders[0] = "./";
            }
            break;
        }
        // fall through
    default:
        throw "Invalid argument for node-brackets module initialization.";
    }
};
