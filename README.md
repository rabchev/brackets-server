Brackets Server
===============

Brackets Server is a server for providing hosted version of the popular code editor [Brackets](http://brackets.io/). The code editor can be loaded directly in the web browser and it doesn’t require additional installations or browser extensions. Brackets works just like the desktop version, except that all projects and files reside on the server instead of the local file system.

The server may be useful for remote development, real-time changes and testing, development form thin clients or devices such as tablets, or it could be used in conjunction with other web applications for collaboration.

To check the current verion of Brackets source used in the server, please see [CHANGELOG](CHANGELOG.md).

Installation
------------

Install from npm:

    $ npm install brackets -g

Usage Examples
--------------

    $ brackets --port 80 --proj-dir /var/projects --supp-dir /var/brackets

**IMPORTANT:** Make sure ***projects*** directory exists.

All arguments are optional.

| Short Option | Long Option  | Default Value     | Description
|--------------|--------------|-------------------|------------------------------------------------------------
| `-p <prot>`  | `--port`     | `6800`            | TCP port on which Brackets server is listening.
| `-j <dir>`   | `--proj-dir` | `~/Projects`      | Root directory for projects. Directories above this root cannot be accessed.
| `-s <dir>`   | `--supp-dir` | `~/.brackets-srv` | Root directory for Brackets supporting files such as user extensions, configurations and state persistence.

Embedding Brackets Server in Web Applications
---------------------------------------------

Example with Express:

```javascript
    var path        = require("path"),
        http        = require("http"),
        express     = require("express"),
        brackets    = require("brackets"),
        app         = express(),
        server      = http.createServer(app);

    app.get("/", function (req, res) {
        res.send("Hello World");
    });

    var bracketsOpts = {
        projectsDir: path.join(__dirname, ".."),
        supportDir: path.join(__dirname, "..", "/support")
    };
    brackets(server, bracketsOpts);

    server.listen(3000);

    console.log("Your application is availble at http://localhost:3000");
    console.log("You can access Brackets on http://localhost:3000/brackets/");
```

**NOTE:** The default values for `projectsDir` and `supportDir` are different when Brackets Server is initiated from code. They are respectively `./projects` and `./brackets`, relative to the current working directory. Same as the CLI, the ***projects*** directory must exist, otherwise Open and Create project will not work.

Contributing
------------

Please see [`CONTRIBUTING.md`](CONTRIBUTING.md)

License
-------

(MIT License)

Copyright (c) 2012 Boyan Rabchev <boyan@rabchev.com>. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
