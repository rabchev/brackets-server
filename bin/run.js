#!/usr/bin/env node

var commander   = require("commander"),
    brackets    = require("../"),
    pkg         = require("../package.json"),
    open        = require("open");

commander
    .version(pkg.version)
    .option("-p, --port <port>", "Specifies TCP <port> for Brackets service. If omitted, the first free port in the range of 6000 - 6800 is picked.")
    .option("-o, --open", "Opens the project in the default web browser. Warning: since Brackets currently supports only Chrome you should set it as your default browser.")
    .parse(process.argv);

var app = brackets(commander.port);

if (commander.open) {
    open("http://localhost:" + app.httpServer.address().port);
}
