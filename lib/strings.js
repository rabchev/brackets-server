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
    "COMMAND_FAILED"            : "Couldn't run the command %s.%s with args %s.",
    
    /**
     * CLI Messages
     */
    "CONFIRM_DELETE_DIR"        : "WARNING: Destination is not empty, all files and subdirectories will be DELETED!\n  Do you want to continue?",
    "INSTALLATION_COMPLETE"     : "Installation complete!",
    "INSTALLATION_ABORTED"      : "Installation aborted.",
    "LISTENING_PORT"            : "\n  listening on port %d\n",
    "IDE_SERVER_STOPPED"        : "IDE server stopped.",
    
    /**
     * CLI Help
     */
    "ARGV_OPEN"                 : "Opens the project in the default web browser. Warning: since Brackets currently supports only Chrome you should set it as your default browser.",
    "ARGV_INSTALL"              : "Creates new project based on the template specified.",
    "ARGV_FORCE"                : "Force template installation on none empty directory.",
    "ARGV_START"                : "Starts Brackets after template installation.",
    "ARGV_PROT"                 : "Specifies TCP <port> for Brackets service. Alternatively, BRACKETS_PORT environment variable can be set. If both are omitted, the first free port in the range of 6000 - 6800 is assigned."
};

exports = module.exports = strings;