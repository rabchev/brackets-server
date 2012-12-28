/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var nconf = require("nconf");

nconf
    .argv()
    .env({
        separator: "__",
        whitelist: [
            "IDE__port",
            "IDE__portRange__min",
            "IDE__portRange__max",
            "live__port",
            "live__portRange__min",
            "live__portRange__max",
            "debugger__port",
            "debugger__portRange__min",
            "debugger__portRange__max"
        ]
    })
    .file({ file: '../config.json' })
    .defaults({
        "IDE": {
            "port": "*",
            "portRange": {
                "min": "46100",
                "max": "46900"
            }
        },
        "live": {
            "port": "*",
            "portRange": {
                "min": "44100",
                "max": "44900"
            }
        },
        "debugger": {
            "port": "8080",
            "portRange": {
                "min": "45100",
                "max": "45900"
            }
        }
    });

exports.IDE = nconf.get("IDE");
exports.live = nconf.get("live");
exports.debug = nconf.get("debugger");