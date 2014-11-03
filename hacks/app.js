// Shell app mock

define(function (require, exports) {
    "use strict";

    exports.getApplicationSupportDirectory = function () {
        return "/support";
    };


    exports.getUserDocumentsDirectory = function () {
        return "/projects";
    };

    /**
     * Returns the TCP port of the current Node server
     *
     * @param {function(err, port)} callback Asynchronous callback function. The callback gets two arguments
     *        (err, port) where port is the TCP port of the running server.
     *        Possible error values:
     *         ERR_NODE_PORT_NOT_SET      = -1;
     *         ERR_NODE_NOT_RUNNING       = -2;
     *         ERR_NODE_FAILED            = -3;
     *
     * @return None. This is an asynchronous call that sends all return information to the callback.
     */
    exports.getNodeState = function (callback) {
        // We serve the source from Node, connect to the same instance.
        callback(null, window.location.port || window.location.protocol === "http" ? 80 : 443);
    };

    exports.openURLInDefaultBrowser = function (url) {
        var win = window.open(url, "_blank");
        win.focus();
    };

    exports.quit = function () {
        // Browser window cannot be closed from script.
    };

    exports.abortQuit = function () {
        // Browser window cannot be closed from script.
    };

    exports.showExtensionsFolder = function (appURL, callback) {
        // TODO: See if this is needed at all, if so we have to provide some sort of file explorer.
        callback("Not supported.");
    };

    var Fn = Function, global = (new Fn("return this"))();
    if (!global.Mustache.compile) {
        global.Mustache.compile = function (template) {
            // This operation parses the template and caches
            // the resulting token tree. All future calls to
            // mustache.render can now skip the parsing step.
            global.Mustache.parse(template);

                return function (view, partials) {
                return global.Mustache.render(template, view, partials);
            };
        };
    }

    $.ajaxPrefilter(function(options) {
        if (options.crossDomain) {
            options.url = window.location.pathname + "proxy/" + encodeURIComponent(options.url);
            options.crossDomain = false;
        }
    });
});
