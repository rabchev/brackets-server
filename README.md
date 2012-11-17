Node-Brackets
-------------

Node-Brackets is a [Node.js](http://nodejs.org) module implemented as [Connect](http://www.senchalabs.org/connect/) middleware which 
integrates [Adobe Brackets](http://brackets.io/) code editor in Node.js based web applications. 
It provides exceptionally convenient way to manage, edit and test project files 
directly on the server via web browser. Brackets doesn't have to be installed on 
client machines, it opens in a web browser and communicates with the server over
standard HTTP or HTTPS protocol.

This module might be useful for remote development, real-time changes and testing, 
development form a thin client or device such as tablet, or it could be used in 
conjunction with other modules for collaboration.

Installation
------------

Install from npm:

    $ npm install brackets

Usage Examples
--------------

Create test app:

    $ mkdir my-app
    $ cd my-app
    $ npm install connect
    . . .
    $ npm install brackets
    . . .
    
Add index.js file to my-app directory and enter the following code:

```js
    var connect     = require('connect'),
        brackets    = require('brackets');
        
    connect()
        .use('/brackets', brackets())
        .use(function (req, res) {
            res.end('Hello World');
        })
        .listen(3000);
    
    console.log("\n  listening on port 3000\n");
```
    
Start the app:
    
    $ node index
    
Open Google Chrome bowser and type **http://localhost:3000** in the address bar. 
At this point you should see “Hello World”. Navigate to **http://localhost:3000/brackets**. 
Now you should see Brackets UI and the contents of your working directory, including Brackets source.

To limit the access to specific directory/s you can pass an argument to brackets function.

* **brackets("resources");** 
  the directory **"./resources/"** will become the project root.

* **brackets(\["controllers", "views", "public"\]);** 
  the directory **"./controllers/"** will become the initial project root and the other folders will be accessible via
  Recent Projects dropdown (the small arrow above the navigation tree).
  
NOTE: the specified directories must exist, otherwise an exception will be thrown.

There is an example project based on [Express](http://expressjs.com/) MVC example, 
located in [https://github.com/rabchev/node-brackets-module/tree/master/examples/express-mvc](https://github.com/rabchev/node-brackets-module/tree/master/examples/express-mvc).

If you want to be able to see your code changes immediately on the live site, without manually restarting Node, 
you could use [node-supervisor](https://github.com/isaacs/node-supervisor) or similar module.

Security Considerations
-----------------------

Authentication and authorization are outside the scope of this module.
They should be done by other modules, configured to intercept the request prior to Node-Brackets.

Since Node-Brackets exposes server files for modification over HTTP/HTTPS, it is absolutely critical to 
properly protect your network or file system. It is strongly recommended **not** to use this module on
production sites, unless you truly understand the security of your system.

Browser Compatibility
---------------------

Apparently, Brackets is currently working properly only in Google Chrome. 
It kind of works in Firefox but it has some styling problems and JavaScript errors. 
It doesn’t work at all in Internet Explorer. 
However, these problems should be referred to Brackets core team.

Known Issues
------------

* Delete command doesn’t refresh correctly the active documents tabs and an error 
  message is displayed if an open document is deleted.
  
  Delete command is currently added as an extension, but I believe it should be Brackets core 
  function in the future and therefore I’m not planning to spend more time on Delete.
  
* Check for updates command doesn’t work.

  This is due to Cross-Origin Resource Sharing not allowed by http://dev.brackets.io/updates/stable/en-US.json.
  I believe this issue can be resolved only by Brackets team.
  
* Show Developer Tools - doesn't work.

  Will be fixed.
  
* Performance data always shows 0.

  Will be fixed.

* Live Preview - doesn't work.

  Will be fixed.

Roadmap
-------

* Move "Find in Files" on the server-side – performance optimization.
* Make global install - for easer project creation.
* Integrate NPM in the UI
* Integrate Supervisor, possibility Brackets to be served from second port.

Updating Brackets source code
-----------------------------

TODO:

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