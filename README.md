Brackets Server
===============

Brackets Server is a server for providing hosted version of the popular code editor [Brackets](http://brackets.io/). The code editor can be loaded directly in the web browser and it doesn’t require additional installations or browser extensions. Brackets works just like the desktop version, except that all projects and files reside on the server instead of the local file system.

The server may be useful for remote development, real-time changes and testing, development form thin clients or devices such as tablets, or it could be used in conjunction with other web applications for collaboration.

To check the current verion of Brackets source used in the server, please see [CHANGELOG](https://github.com/rabchev/brackets-server/blob/master/CHANGELOG.md).

Installation
------------

Install from npm:

    $ npm install brackets -g

Usage Examples
--------------

    $ brackets --port 80 --proj-dir /var/projects --supp-dir /var/brackets

**IMPORTANT:** Make sure ***projects*** directory exists.

**IMPORTANT:** Brackets Server cannot work simultaneously on the same machine with the desktop Brackets because of 
port conflict in one of the build-in modules. The error thrown is: "Error: listen EADDRINUSE". 
To workaround this problem if you ever need to use bouth simultaneously, run Brackets Server in Docker container.

All arguments are optional.

| Short Option | Long Option      | Default Value     | Description
|--------------|------------------|-------------------|------------------------------------------------------------
| `-p <prot>`  | `--port`         | `6800`            | TCP port on which Brackets server is listening.
| `-j <dir>`   | `--proj-dir`     | `~/Projects`      | Root directory for projects. Directories above this root cannot be accessed.
| `-s <dir>`   | `--supp-dir`     | `~/.brackets-srv` | Root directory for Brackets supporting files such as user extensions, configurations and state persistence.
| `-d`         | `--user-domains` | `false`           | Allows Node domains to be loaded from user extensions.

**NOTE:** Some Brackets extensions require external Node.js process, called node domain. Node domains run on the server, thereby allowing arbitrary code to be executed on the server through custom extensions.  Since this imposes very serious security and stability risks, Brackets Server will not load nor execute domains from user extensions, unless `-d` option is specified.

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

**NOTE:** The default values for `projectsDir` and `supportDir` are different when Brackets Server is initiated from code. They are respectively `./projects` and `./brackets`, relative to the current working directory.

Options:

| Option           | Default Value     | Description
|------------------|-------------------|------------------------------------------------------------
| httpRoot         | `/brackets`       | Defines the root HTTP endpoint for Brackets Server (http://yourdomain.com/brackets).
| projectsDir      | `./projects`      | Root directory for projects. Directories above this root cannot be accessed.
| supportDir       | `./brackets`      | Root directory for Brackets supporting files such as user extensions, configurations and state persistence.
| allowUserDomains | `false`           | Allows Node domains to be loaded from user extensions.


Contributing
------------

Please see [`CONTRIBUTING.md`](https://github.com/rabchev/brackets-server/blob/master/CONTRIBUTING.md)

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
