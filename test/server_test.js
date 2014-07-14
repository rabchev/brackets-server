"use strict";

var request         = require("supertest"),
    chai            = require("chai"),
    server          = require("./app"),
    expect          = chai.expect,
    agent;

function test(done, setReq, examine) {
    var req = setReq(agent);
    req.end(function (err, res) {
        if (err) {
            return done(err);
        }
        if (examine) {
            var data;
            if (res.body && Object.keys(res.body).length) {
                data = res.body;
            } else {
                data = res.text;
            }
            examine(data);
            done();
        } else {
            done();
        }
    });
}

describe("swaggy", function () {

    before(function (done) {
        server.init(function (err, app) {
            if (err) {
                return done(err);
            }

            agent = request.agent(app);
            done();
        });
    });

    it("get index", function (done) {
        test(done, function (req) {
            return req
                .get("/")
                .set("Accept", "text/html")
                .expect("Content-Type", /html/)
                .expect(200);
        }, function (data) {
            expect(data).to.equal("Hello");
        });
    });
});
