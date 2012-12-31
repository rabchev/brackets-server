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
    "COMMAND_FAILED"            : "Couldn't execute the command %s.%s with args %s.",
    
    /**
     * CLI Messages
     */
    "CONFIRM_NONEMPTY_DIR"      : "WARNING: Destination is not empty, some files may be replaced!\n  Do you want to continue?",
    "INSTALLATION_COMPLETE"     : "Installation complete!",
    "INSTALLATION_ABORTED"      : "Installation aborted.",
    "LISTENING_PORT"            : "\n  IDE server listening on port %d\n",
    "IDE_SERVER_STOPPED"        : "  IDE server stopped\n",
    
    /**
     * CLI Help
     */
    "ARGV_OPEN"                 : "Opens the project in the default web browser. Warning: since Brackets currently supports only Chrome you should set it as your default browser.",
    "ARGV_INSTALL"              : "Creates new project based on the template specified.",
    "ARGV_FORCE"                : "Force template installation on none empty directory.",
    "ARGV_START"                : "Starts Brackets after template installation.",
    "ARGV_IDE_PROT"             : "Specifies the TCP <port> for the IDE service. Alternatively, IDE__port environment variable can be set. If both are omitted, a random free port in the configured IDE ports range is assigned.",
    "ARGV_IDE_PROT_MIN"         : "Specifies the lowest TCP <port> for automatic port assignment for the IDE service. Alternatively, IDE__portRange__min environment variable can be set. The default value is 46100.",
    "ARGV_IDE_PROT_MAX"         : "Specifies the highest TCP <port> for automatic port assignment for the IDE service. Alternatively, IDE__portRange__max environment variable can be set. The default value is 46900.",
    "ARGV_LIVE_PROT"            : "Specifies the TCP <port> for the Live server. Alternatively, live__port environment variable can be set. If both are omitted, a random free port in the configured Live Server ports range is assigned.",
    "ARGV_LIVE_PROT_MIN"        : "Specifies the lowest TCP <port> for automatic port assignment for the Live server. Alternatively, live__portRange__min environment variable can be set. The default value is 44100.",
    "ARGV_LIVE_PROT_MAX"        : "Specifies the highest TCP <port> for automatic port assignment for the Live server. Alternatively, live__portRange__max environment variable can be set. The default value is 44900.",
    "ARGV_DEBUG_PROT"           : "Specifies the TCP <port> for the Debugger service. Alternatively, debugger__port environment variable can be set. The default value is 8080.",
    "ARGV_DEBUG_PROT_MIN"       : "Specifies the lowest TCP <port> for automatic port assignment for debugging. Alternatively, debugger__portRange__min environment variable can be set. The default value is 45100.",
    "ARGV_DEBUG_PROT_MAX"       : "Specifies the highest TCP <port> for automatic port assignment for debugging. Alternatively, debugger__portRange__max environment variable can be set. The default value is 45900."
};

exports = module.exports = strings;