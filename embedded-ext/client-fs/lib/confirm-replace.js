define(function (require, exports) {
    "use strict";

    var Dialogs             = brackets.getModule("widgets/Dialogs"),
        StringUtils         = brackets.getModule("utils/StringUtils"),
        Strings             = require("../strings"),
        dialogTemplate      = require("text!../templates/confirm-replace.html"),
        Mustache            = brackets.getModule("thirdparty/mustache/mustache");

    exports.show = function (folderName, fileName, callback) {
        var context = {
                TITLE: Strings.TITLE_CONFIRM_REPLACE,
                REPLACE_MESSAGE: StringUtils.format(Strings.MSG_CONFIRM_REPLACE, fileName, folderName),
                BUTTON_CANCEL: Strings.BUTTON_CANCEL,
                BUTTON_REPLACE: Strings.BUTTON_REPLACE
            },
            dialog  = Dialogs.showModalDialogUsingTemplate(Mustache.render(dialogTemplate, context));

        dialog.done(callback);
    };
});
