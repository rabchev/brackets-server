define(function (require, exports) {
    "use strict";

    var Dialogs             = brackets.getModule("widgets/Dialogs"),
        Strings             = require("../strings"),
        contents            = require("./contents"),
        dialogTemplate      = require("text!../templates/open-dialog.html"), 
        Mustache            = brackets.getModule("thirdparty/mustache/mustache");

    exports.show = function (allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback) {
        if (initialPath.indexOf("/samples/") === 0) {
            initialPath = null;
        }

        var context = {
                TITLE: title,
                BUTTON_CANCEL: Strings.BUTTON_CANCEL,
                BUTTON_OPEN: Strings.BUTTON_OPEN
            },
            path        = initialPath || brackets.app.getUserDocumentsDirectory(),
            dialog      = Dialogs.showModalDialogUsingTemplate(Mustache.render(dialogTemplate, context)),
            $dialog     = dialog.getElement(),
            cnts        = contents($dialog, allowMultipleSelection, chooseDirectories, title, path, fileTypes, null, callback, null);

        dialog.done(function (buttonId) {
            if (buttonId === "ok") {
                callback(null, cnts.getSelected());
            }
        });
    };
});
