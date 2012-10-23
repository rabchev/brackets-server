exports = module.exports = setup;

function setup() {
    console.log("brackets setup!");
    return function (req, res, next) {
        console.log("brackets responding...");
    };
}