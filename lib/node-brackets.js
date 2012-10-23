exports.open = function (req, res, next) {
    console.log(req.url);
    next();
};