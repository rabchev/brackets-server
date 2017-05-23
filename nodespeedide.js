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
        bodyParser = require('body-parser'),
        debug = require('debug')('nodespeed-ide-server'),
        fs = require('fs');

    var https = require('https'),
        send = require('send'),
        urlUtil = require('url'),
        files = require('./lib/files'),
        domains = require('./lib/domains/socket'),
        socket = require('socket.io'),
        brckDist = {
            root: path.join(__dirname, './brackets-dist')
        },
        zipped = {
            '.js': 'application/javascript',
            '.css': 'text/css'
        };

    const fileSystem = require('./lib/file-sys/native');

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
        return path[path.length - 1] === '/' ? path.substr(0, path.length - 1) : path;
    });

    let inst = {
        httpRoot: '/brackets',
        httpServer: server,
        io: socket(server),
        defaultExtensions: path.join(brckDist.root, 'extensions'),
        supportDir: removeTrailingSlash(opts.supportDir || path.resolve('./support')),
        projectsDir: removeTrailingSlash(opts.projectsDir || path.resolve('./projects')),
        samplesDir: removeTrailingSlash(opts.samplesDir || path.join(brckDist.root, 'samples')),
        allowUserDomains: opts.allowUserDomains || false,
        fileSystem
    };

    inst.fileSystem.mkdir(inst.projectsDir, function (err) {
        if (err && err.code !== 'EEXIST') {
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

            if (url === '') {
                res.writeHead(301, {
                    Location: inst.httpRoot + '/'
                });
                res.end();
                return;
            }

            if (url === '/') {
                url = '/index.html';
            }

            if (url.startsWith('/proxy/')) {
                var reqUrl = decodeURIComponent(url.substr('/proxy/'.length)),
                    options = urlUtil.parse(reqUrl),
                    httpClient = options.protocol === 'http' ? http : https;

                delete options.protocol;
                options.method = 'GET';

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
                send(req, url + '.gz', brckDist)
                    .on('headers', function (_res) {
                        _res.setHeader('Content-Encoding', 'gzip');
                        _res.setHeader('Content-Type', cntType);
                    })
                    .pipe(res);
                return;
            }

            send(req, url, brckDist).pipe(res);
        } else if (req.url.startsWith('/support/extensions/')) {

            try {
                return send(req, req.url.substr('/support/extensions'.length), {
                    root: opts.supportDir + '/extensions'
                }).pipe(res);
            } catch (e) {
                res.writeHead(500, {
                    'Content-Length': e.message.length,
                    'Content-Type': 'text/plain'
                });
                res.end(e.message);
            }
        } else {

            debug('Unhandled request ' + req.url);
            res.render('error', {
                title: 'Error',
                message: 'not found'
            });
        }
    };

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

    app.get('/', function (req, res, next) {
        debug('Got request ' + req.url);
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

            var folderPath = req.query.path.replace('/projects', opts.projectsDir),
                folderName = folderPath.substr(folderPath.lastIndexOf('/') + 1),
                archive = archiver('zip');

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
