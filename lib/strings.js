/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var strings = {
    /**
     * Error Descriptions
     */
    "NO_PACKAGE_FILE"           : "No package.json file found!",
    "NO_START_SCRIPT"           : "No start script specified!",
    "SERVER_ALREADY_STARTED"    : "Live Server already started on port: %d.",
    "SERVER_NOT_STARTED"        : "Live Server is not started.",
    "INVALID_ARG_MODULE_INIT"   : "Invalid argument for node-brackets module initialization.",
    "COMMAND_FAILED"            : "Couldn't run the command %s.%s with args %s."
};

exports = module.exports = strings;