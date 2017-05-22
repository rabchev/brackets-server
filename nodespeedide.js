#!/usr/bin/env node

(function () {
    'use strict';

    var path = require('path'),
        http = require('http'),
        express = require('express'),
        exphbs = require('express-handlebars'),
        commander = require('commander'),
        pkg = require('./package.json'),
        open = require('open'),
        app = express(),
        archiver = require('archiver'),
        server = http.createServer(app),
        cookieParser = require('cookie-parser'),
        bodyParser = require('body-parser'),
        session = require('express-session'),
        passport = require('passport'),
        Auth0Strategy = require('passport-auth0'),
        ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn(),
        debug = require('debug')('nodespeed-ide-server'),
        fs = require('fs');

    var https = require("https"),
        send = require("send"),
        urlUtil = require("url"),
        files = require("./lib/files"),
        domains = require("./lib/domains/socket"),
        socket = require("socket.io"),
        brckDist = {
            root: path.join(__dirname, "./brackets-dist")
        },
        zipped = {
            ".js": "application/javascript",
            ".css": "text/css"
        };

    var id_token = '';

    const fileSystem = require("./lib/file-sys/native");

    commander
        .version(pkg.version)
        .option('-p, --port <port>', 'Specifies TCP <port> for Brackets service. The default port is 6800.')
        .option('-o, --open', 'Opens Brackets in the default web browser.')
        .option('-s, --supp-dir <path>', 'Specifies the root directory for Brackets supporting files such as user extensions, configurations and state persistence. The default locations is /projects/.brackets-srv.')
        .option('-j, --proj-dir <path>', 'Specifies the root directory for projects. The default locations is /projects.')
        .option('-d, --user-domains', 'Allows Node domains to be loaded from user extensions.')
        .parse(process.argv);

    var opts = {
        supportDir: commander.suppDir || path.join(__dirname, '..', '/.brackets-server'),
        projectsDir: commander.projDir || path.join(__dirname, '..', '/'),
        allowUserDomains: commander.userDomains || true,
        port: commander.port || 6800
    };

    debug('Using suppDir ' + opts.supportDir);
    debug('Using projDir ' + opts.projectsDir);
    debug('Using port ' + opts.port);

    let removeTrailingSlash = ((path) => {
        return path[path.length - 1] === "/" ? path.substr(0, path.length - 1) : path;
    });

    let inst = {
        httpRoot: "/brackets",
        httpServer: server,
        io: socket(server),
        defaultExtensions: path.join(brckDist.root, "extensions"),
        supportDir: removeTrailingSlash(opts.supportDir || path.resolve("./support")),
        projectsDir: removeTrailingSlash(opts.projectsDir || path.resolve("./projects")),
        samplesDir: removeTrailingSlash(opts.samplesDir || path.join(brckDist.root, "samples")),
        allowUserDomains: opts.allowUserDomains || false,
        fileSystem
    };

    inst.fileSystem.mkdir(inst.projectsDir, function (err) {
        if (err && err.code !== "EEXIST") {
            throw err;
        }

        files.init(inst);

        domains.init(inst);
    });

    if (commander.open) {
        open('http://localhost:' + app.httpServer.address().port);
    }

    let processRequest = (req, res) => {

        //debug('Got request ' + req.url);

        if (req.url.startsWith(inst.httpRoot)) {
            var url = req.url.substr(inst.httpRoot.length);

            if (url === "") {
                res.writeHead(301, {
                    Location: inst.httpRoot + "/"
                });
                res.end();
                return;
            }

            if (url === "/") {
                url = "/index.html";
            }

            if (url.startsWith("/proxy/")) {
                var reqUrl = decodeURIComponent(url.substr("/proxy/".length)),
                    options = urlUtil.parse(reqUrl),
                    httpClient = options.protocol === "http" ? http : https;

                delete options.protocol;
                options.method = "GET";

                req.pause();
                var connector = httpClient.request(options, function (_res) {
                    _res.pause();
                    res.writeHead(_res.statusCode, _res.headers);
                    _res.pipe(res);
                    _res.resume();
                });

                connector.on('error', function (e) {
                    req.resume();
                    return;
                });

                req.pipe(connector);
                req.resume();
                return;
            }

            var cntType = zipped[path.extname(url)];
            if (cntType) {
                send(req, url + ".gz", brckDist)
                    .on("headers", function (_res) {
                        _res.setHeader("Content-Encoding", "gzip");
                        _res.setHeader("Content-Type", cntType);
                    })
                    .pipe(res);
                return;
            }

            send(req, url, brckDist).pipe(res);
        } else if (req.url.startsWith("/support/extensions/")) {

            try {
                return send(req, req.url.substr("/support/extensions".length), {
                    root: opts.supportDir + '/extensions'
                }).pipe(res);
            } catch (e) {
                res.writeHead(500, {
                    "Content-Length": e.message.length,
                    "Content-Type": "text/plain"
                });
                res.end(e.message);
            }
        } else {

            debug('Unhandled request ' + req.url)
            res.render('error', {
                title: 'Error',
                message: 'not found'
            });
        }
    };

    var vhost = process.env.VIRTUAL_HOST.split(',')[0];
    vhost = vhost.substring(0, vhost.length - 5);

    var env = {
        AUTH0_CLIENT_ID: process.env.NODESPEED_AUTHENTICATION_APPLICATION,
        AUTH0_CLIENT_SECRET: process.env.NODESPEED_AUTHENTICATION_SECRET,
        AUTH0_DOMAIN: process.env.NODESPEED_AUTHENTICATION_DOMAIN,
        AUTH0_CALLBACK_URL: process.env.NODESPEED_AUTHENTICATION_CALLBACK_URL
    };

    debug('Using AUTH0_CLIENT_ID: ' + env.AUTH0_CLIENT_ID);
    debug('Using AUTH0_DOMAIN ' + env.AUTH0_DOMAIN);
    debug('Using AUTH0_CALLBACK_URL ' + env.AUTH0_CALLBACK_URL);

    // This will configure Passport to use Auth0
    var strategy = new Auth0Strategy({
        domain: env.AUTH0_DOMAIN,
        clientID: env.AUTH0_CLIENT_ID,
        clientSecret: env.AUTH0_CLIENT_SECRET,
        callbackURL: env.AUTH0_CALLBACK_URL
    }, function (accessToken, refreshToken, extraParams, profile, done) {
        id_token = extraParams.id_token;
        debug('Access token retrieved ' + id_token);
        return done(null, profile);
    });

    passport.use(strategy);

    // you can use this section to keep a smaller payload
    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        done(null, user);
    });

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));

    app.engine('handlebars', exphbs({
        defaultLayout: 'main'
    }));

    app.set('view engine', 'handlebars');

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(cookieParser());
    app.use(function (req, res, next) {
        var cookie = req.cookies.id_token;

        if (id_token != cookie) {
            res.cookie('id_token', id_token, {
                maxAge: 900000,
                httpOnly: false
            });
        }

        next();
    });
    app.use(session({
        secret: env.AUTH0_CLIENT_SECRET,
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    var privateRoutes = ['/brackets', '/user', '/download', '/download-folder'];

    app.get(privateRoutes, ensureLoggedIn);

    app.get('/', function (req, res, next) {
        debug('Got request ' + req.url);
        res.render('login', {
            title: 'nodeSpeed IDE',
            env: env
        });
    });

    app.get('/profile', function (req, res) {
        debug('Got request ' + req.url);
        res.json(req.user);
    });

    app.get('/login', function (req, res) {
        debug('Got login request');
        res.redirect('/');
    });

    app.get('/login-fail', function (req, res) {
        debug('Got request ' + req.url);
        res.send(req.url);
    });

    app.get('/logout', function (req, res) {
        debug('Got request ' + req.url);
        req.logout();
        res.redirect('/');
    });

    app.get('/callback', passport.authenticate('auth0', {
            failureRedirect: '/login-fail'
        }),
        function (req, res) {
            debug('User ' + req.user.displayName + ' authenticated');
            res.redirect('/brackets');
        });

    app.get('/download', function (req, res) {
        debug('Got request ' + req.url);
        if (req.query.path) {
            let filePath = req.query.path.replace('/projects', opts.projectsDir);
            res.download(filePath);
        } else {
            res.render('error', {
                title: 'Error',
                message: 'Path to file not provided.'
            });
        }
    });

    app.get('/download-folder', function (req, res) {
        debug('Got request ' + req.url);
        if (req.query.path) {

            var folderPath = req.query.path.replace('/projects', opts.projectsDir);

            var folderName = folderPath.substr(folderPath.lastIndexOf('/') + 1);

            var archive = archiver('zip');

            res.attachment(folderName + '.zip');

            archive.on('error', function (err) {
                res.status(500).send({
                    error: err.message
                });
            });

            archive.pipe(res);

            archive.bulk([
                {
                    expand: true,
                    cwd: folderPath,
                    src: ['**'],
                    dest: folderName
             }
            ]);

            archive.finalize();
        } else {
            res.render('error', {
                title: 'Error',
                message: 'Path to folder not provided.'
            });
        }
    });

    app.get('*', (req, res) => {
        processRequest(req, res);
    });

    server.listen(opts.port, function () {
        debug('Listening on port: ' + opts.port);
    });

})();
