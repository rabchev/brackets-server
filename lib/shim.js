"use strict";

if (!String.prototype.startsWith) {
    var toString = {}.toString;
    String.prototype.startsWith = function (search){
        if (this === null) {
            throw new TypeError();
        }
        var string = String(this);
        if (search && toString.call(search) === "[object RegExp]") {
            throw new TypeError();
        }
        var stringLength = string.length;
        var searchString = String(search);
        var searchLength = searchString.length;
        var position = arguments.length > 1 ? arguments[1] : undefined;

        var pos = position ? Number(position) : 0;
        if (pos !== pos) {
            pos = 0;
        }
        var start = Math.min(Math.max(pos, 0), stringLength);

        if (searchLength + start > stringLength) {
            return false;
        }
        var index = -1;
        while (++index < searchLength) {
            if (string.charCodeAt(start + index) !== searchString.charCodeAt(index)) {
                return false;
            }
        }
        return true;
    };
}
