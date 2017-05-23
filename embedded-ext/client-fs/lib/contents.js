define(function (require, exports, module) {
    "use strict";

    var FileUtils           = brackets.getModule("file/FileUtils"),
        FileSystem          = brackets.getModule("filesystem/FileSystem"),
        Strings             = require("../strings"),
        contentsTemplate    = require("text!../templates/contents.html"), 
        Mustache            = brackets.getModule("thirdparty/mustache/mustache");

    function Contents($dialog, allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, proposedNewFilename, onError, onSelected) {
        if (!(this instanceof Contents)) {
            return new Contents($dialog, allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, proposedNewFilename, onError, onSelected);
        }

        var that = this;

        this.allowMultipleSelection = allowMultipleSelection;
        this.chooseDirectories = chooseDirectories;
        this.title = title;
        this.initialPath = initialPath;
        this.fileTypes = fileTypes;
        this.proposedNewFilename = proposedNewFilename;
        this.onError = onError;
        this.onSelected = onSelected;
        this.$contents = $dialog.find("#rfs-contents");
        this.$saveName = $dialog.find("#rfs-save-name");
        this.$contents.on("click", function (event) {
            that.selectRow(event);
        });
        this.$contents.on("dblclick", function (event) {
            that.openFolder(event);
        });

        this.btnOk = $dialog.find("button[data-button-id='ok']")[0];
        this.selected = {};

        this.resetTrail(initialPath);
        this.showFiles(initialPath);
    }

    Contents.prototype.isDirSelected = function () {
        return this.chooseDirectories &&
            this.currTrail &&
            FileUtils.stripTrailingSlash(this.currTrail.path) !== FileUtils.stripTrailingSlash(this.initialPath);
    };

    Contents.prototype.setSelected = function (path, val) {
        this.selected[path] = val;
        if (!this.allowMultipleSelection) {
            this.$saveName.text(FileUtils.stripTrailingSlash(path));
        }
    };

    Contents.prototype.deselectRow = function ($tr) {
        $tr.children().removeClass("selected");
        delete this.selected[$tr.attr("data-path")];
        this.$saveName.text("");
        if (this.isDirSelected()) {
            this.setSelected(this.currTrail.path, true);
        }
        if (Object.keys(this.selected).length === 0) {
            this.btnOk.disabled = true;
        }
    };

    Contents.prototype.deselectAll = function () {
        var keys = Object.keys(this.selected),
            that = this;

        if (keys.length) {
            keys.forEach(function (key) {
                var sel = that.selected[key];
                if (sel.children) {
                    sel.children().removeClass("selected");
                }
            });
            this.selected = {};
            this.btnOk.disabled = true;
        }
    };

    Contents.prototype.selectRow = function (event) {
        var pel     = event.target.parentElement,
            $tr     = $(pel.tagName === "TR" ? pel : pel.parentElement),
            path    = $tr.attr("data-path"),
            isDir   = $tr.find(".dir");

        event.stopImmediatePropagation();
        if (path) {
            if (this.onSelected) {
                if (!isDir.length) {
                    this.onSelected({ path: this.currTrail.path, fileName: FileUtils.getBaseName(path) });
                }
            } else {
                if (this.selected[path]) {
                    this.deselectRow($tr);
                } else if ((this.chooseDirectories && isDir.length) || (!this.chooseDirectories && !isDir.length)) {
                    if (!this.allowMultipleSelection) {
                        this.deselectAll();
                    }
                    $tr.children().addClass("selected");
                    this.setSelected(path, $tr);
                    if (this.btnOk.disabled) {
                        this.btnOk.disabled = false;
                    }
                }
            }
        }
    };

    Contents.prototype.resetTrail = function (path) {
        var parts   = path.split("/"),
            lPath   = "",
            that    = this;

        this.trail = [];
        this.currTrail = null;
        parts.forEach(function (el) {
            if (el) {
                lPath += "/" + el;
                that.trail.push({
                    name: el,
                    path: lPath
                });
            }
        });
    };

    Contents.prototype.openFolder = function (event) {
        var pel     = event.target.parentElement,
            el      = pel.tagName === "TR" ? pel : pel.parentElement,
            $tr     = $(el),
            path    = $tr.attr("data-path"),
            isDir   = $tr.find(".dir");

        event.stopImmediatePropagation();
        if (path && isDir.length) {
            this.resetTrail(path);
            this.showFiles(path);
        }
    };

    Contents.prototype.openTrail = function (event) {
        event.stopImmediatePropagation();
        this.showFiles($(event.target).attr("data-path"));
    };

    Contents.prototype.showFiles = function (path) {
        var dir = FileSystem.getDirectoryForPath(path),
            that = this;

        this.selected = {};
        this.$saveName.text("");
        if (!this.onSelected) {
            this.btnOk.disabled = true;
        }

        // TODO: Add loading indication here.
//            $contents.empty();

        dir.getContents(function (err, files) {
            var list    = [],
                context = {
                    OPEN_FOLDER: Strings.BUTTON_OPEN_FOLDER,
                    multiSelect: that.allowMultipleSelection,
                    chooseDir: that.chooseDirectories
                };

            if (err) {
                that.onError(err);
            } else {
                files.forEach(function (el) {
                    var file = {
                        name: el.name,
                        fullPath: el.fullPath,
                        isFile: el.isFile,
                        isDirectory: el.isDirectory,
                        type: el.isDirectory ? "dir" : "file"
                    };
                    if (that.chooseDirectories && el.isFile) {
                        file.disabled = "rfs-disabled";
                    }
                    list.push(file);
                });
                list.sort(function (a, b) {
                    if (a.type === b.type) {
                        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                    } else {
                        return (a.type < b.type) ? -1 : 1;
                    }
                });
                that.files = list;
                path = FileUtils.stripTrailingSlash(path);
                that.trail.forEach(function (el) {
                    if (el.path === path) {
                        el.curr = "curr";
                        that.currTrail = el;
                        if (that.onSelected) {
                            that.onSelected({ path: el.path });
                        }
                    } else if (el.curr) {
                        delete el.curr;
                    }
                });

                if (that.isDirSelected()) {
                    that.setSelected(that.currTrail.path, true);
                    that.btnOk.disabled = false;
                }

                context.files = list;
                context.trail = that.trail;
                that.$contents.html(Mustache.render(contentsTemplate, context));
                that.$contents.on("click", ".rfs-icon.dir", function (event) {
                    that.openFolder(event);
                });
                that.$contents.on("click", "#rfs-trail > ul > li", function (event) {
                    that.openTrail(event);
                });
            }
        });
    };

    Contents.prototype.getSelected = function () {
        return Object.keys(this.selected);
    };

    module.exports = Contents;
});
