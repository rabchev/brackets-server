var send = require("send");

exports = module.exports = initialize;

function initialize() {
    
    return function (req, res, next) {
        send(req, req.url)
            .root(__dirname + '/../brackets')
            .pipe(res);
    };
}