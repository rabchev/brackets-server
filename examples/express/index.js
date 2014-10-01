"use strict";

var path        = require("path"),
    http        = require("http"),
    express     = require("express"),
    brackets    = require("brackets"),
    app         = express(),
    server      = http.createServer(app);

app.get("/", function (req, res) {
    res.send("Hello World");
});

var bracketsOpts = {
    projectsDir: path.join(__dirname, ".."),
    supportDir: path.join(__dirname, "..", "/support")
};
brackets(server, bracketsOpts);

server.listen(3000);

console.log("Your application is availble at http://localhost:3000");
console.log("You can access Brackets on http://localhost:3000/brackets/");
