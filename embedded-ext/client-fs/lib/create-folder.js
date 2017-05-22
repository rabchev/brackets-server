define(function (require, exports) {
    "use strict";

    var Dialogs             = brackets.getModule("widgets/Dialogs"),
        Strings             = require("../strings"),
        dialogTemplate      = require("text!../templates/create-folder.html"), 
        Mustache            = brackets.getModule("thirdparty/mustache/mustache");

    exports.show = function (contents, callback) {
        var context = {
                TITLE: Strings.LABEL_FOLDER_NAME,
                BUTTON_CANCEL: Strings.BUTTON_CANCEL,
                BUTTON_OK: Strings.BUTTON_OK
            },
            dialog      = Dialogs.showModalDialogUsingTemplate(Mustache.render(dialogTemplate, context)),
            $dialog     = dialog.getElement(),
            btnOk       = $dialog.find("button[data-button-id='ok']")[0],
            $input      = $dialog.find("#rfs-folder-name"),
            $msg        = $dialog.find("#rfs-msg");

        btnOk.disabled = true;
        $input.focus();
        $input.keyup(function () {
            var val = $input.val().trim(),
                exists  = $.inArray(val, contents) !== -1;

            if (!val || exists) {
                btnOk.disabled = true;
            } else if (btnOk.disabled) {
                btnOk.disabled = false;
            }

            if (exists) {
                $msg.text(Strings.MSG_FILE_EXISTS);
            } else if ($msg.html() !== "&nbsp;") {
                $msg.html("&nbsp;");
            }
        });

        dialog.done(function (buttonId) {
            if (buttonId === "ok") {
                callback($input.val().trim());
            }
        });
    };
});
