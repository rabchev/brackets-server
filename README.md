Node-Brackets
-------------

Node-Brackets is a [Node.js](http://nodejs.org) module implemented as Connect middleware which 
integrates [Adobe Brackets](http://brackets.io/) code editor in Node.js based web applications. 
It provides exceptionally convenient way to manage, edit and test project files 
directly on the server via web browser. Brackets doesn't have to be installed on 
client machines, it opens in a web browser.

Installation
------------

Install from npm:

    $ npm install brackets

Usage Examples
--------------

```js
var connect     = require('connect'),
    brackets    = require('brackets');
    
    connect()
        .use('/brackets', brackets())
        .use(function (req, res) {
            res.end('Hello World');
        })
        .listen(3000);
```

Security Considerations
-----------------------

Browser Compatibility
---------------------

Known Issues
------------

Roadmap
-------