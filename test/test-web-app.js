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
        test.expect(1);
        http.get(appUrl + "/brackets", function(res) {
            test.equal(res.statusCode, 200);
            test.done();
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