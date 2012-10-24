var send = require("../node_modules/connect/node_modules/send");

exports = module.exports = initialize;

function initialize() {
    
    return function (req, res, next) {
        send(req, req.url)
            .root(__dirname + '/../brackets')
            .pipe(res);
    };
}
