"use strict";

var ConnectionManager = require("./ConnectionManager"),
    DomainManager     = require("./DomainManager");

function init(srv) {
    var root = srv.httpRoot + "-ext",
        apiUrl = root + "/api";

    srv.httpServer.on("request", function (req, res) {
        if (req.url.startsWith(apiUrl)) {
            res.setHeader("Content-Type", "application/json");
            res.end(
                JSON.stringify(DomainManager.getDomainDescriptions(),
                               null,
                               4)
            );
        }
    });

    srv.io
        .of(root)
        .on("connection", ConnectionManager.createConnection);

    DomainManager.httpRoot = srv.httpRoot;
    DomainManager.supportDir = srv.supportDir;
    DomainManager.projectsDir = srv.projectsDir;
    DomainManager.samplesDir = srv.samplesDir;
    DomainManager.allowUserDomains = srv.allowUserDomains;
    DomainManager.loadDomainModulesFromPaths(["./BaseDomain"]);
}

exports.init = init;
