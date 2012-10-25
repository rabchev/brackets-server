var testCase  = require('nodeunit').testCase;

var connect = require('connect');
var brackets = require('../lib/node-brackets.js');
var http = require("http");
var port = 3119;
var appUrl = "http://localhost:" + port;
var app;

module.exports = testCase({
    "Fixture Setup": function(test) {
        app = connect()
            .use('/brackets', brackets())
            .use('/*', function(req, res){
                  res.send('Hello World');
                })
            .listen(port);
        
        test.done();
    },
    "test index.html": function(test) {
        test.expect(3);
        http.get(appUrl + "/brackets", function(res) {
            res.setEncoding('utf8');
            
            test.equal(res.statusCode, 200);
            test.equal(res.headers["content-type"], "text/html; charset=UTF-8");
            res.on("data", function(chunk) {
                var str = String(chunk);
                test.ok(str.indexOf("<script src=\"thirdparty/require.js\" data-main=\"brackets\"></script>") != -1);
                test.done();
            });            
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
            test.done();
        });
    },
    "test resource file": function(test) {
        test.expect(3);
        http.get(appUrl + "/brackets/thirdparty/require.js", function(res) {
            res.setEncoding('utf8');
            
            test.equal(res.statusCode, 200);
            test.equal(res.headers["content-type"], "application/javascript");
            res.on("data", function(chunk) {
                var str = String(chunk);
                test.ok(str.indexOf("RequireJS 1.0.3 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.") != -1);
                test.done();
            });            
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
            test.done();
        });
    },
    "test non Brackets request": function(test) {
        test.expect(3);
        http.get(appUrl + "/", function(res) {
            res.setEncoding('utf8');
            
            test.equal(res.statusCode, 200);
            test.equal(res.headers["content-type"], "text/html");
            res.on("data", function(chunk) {
                var str = String(chunk);
                test.ok(str.indexOf("Hello World") != -1);
                test.done();
            });            
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
            test.done();
        });
    },
    "Fixture Teardown": function(test) {
        app.close();
        
        test.done();
    }    
});