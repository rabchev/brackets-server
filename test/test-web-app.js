var testCase  = require('nodeunit').testCase;

var connect = require('connect');
var brackets = require('../lib/node-brackets.js');
var http = require("http");
var app;

console.log('Listening on port 3000');

module.exports = testCase({
    "Fixture Setup": function(test) {
        app = connect()
            .use('/brackets', brackets())
            .use('/*', function(req, res){
                  res.send('Hello World');
                })
            .listen(3000);
        
        test.done();
    },
    "test 1": function(test) {
        test.expect(1);
        http.get("http://localhost:3000/brackets", function(res) {
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