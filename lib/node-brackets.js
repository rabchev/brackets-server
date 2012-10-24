<<<<<<< HEAD
exports.open = function (req, res, next) {
    console.log(req.url);
    next();
};
=======
exports = module.exports = setup;

function setup() {
    console.log("brackets setup!");
    return function (req, res, next) {
        console.log("brackets responding...");
    };
}
>>>>>>> b154867e8fd942f7b268c4d5cd53a89790fa2c8b
