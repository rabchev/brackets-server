<<<<<<< HEAD
<<<<<<< HEAD
exports.open = function (req, res, next) {
    console.log(req.url);
    next();
};
=======
exports = module.exports = setup;
=======
var send = require("send");
>>>>>>> 815f1eeae0bfefe5845926f0b5d854cb097fccd6

exports = module.exports = initialize;

function initialize() {
    
    return function (req, res, next) {
        send(req, req.url)
            .root(__dirname + '/../brackets')
            .pipe(res);
    };
}
>>>>>>> b154867e8fd942f7b268c4d5cd53a89790fa2c8b
