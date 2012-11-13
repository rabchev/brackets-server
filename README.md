Node-Brackets
-------------

Node-Brackets is a [Node.js](http://nodejs.org) module implemented as [Connect](http://www.senchalabs.org/connect/) middleware which 
integrates [Adobe Brackets](http://brackets.io/) code editor in Node.js based web applications. 
It provides exceptionally convenient way to manage, edit and test project files 
directly on the server via web browser. Brackets doesn't have to be installed on 
client machines, it opens in a web browser and comunicates with the server over
standard HTTP protocol.

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
    
Add index.js file to my-app directory and enter the folwoing code:

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
    
Open Google Chrome bowser and type *http://localhost:3000* in the address bar. 
At this point you should see “Hello World”. Navigate to *http://localhost:3000/brackets*. 
Now you should see Brackets UI and the contents of your working directory, including Brackets source.

To limit the access to specific directory/s you can pass an argument to brackets function.

* brackets("resources"); 
  the directory "./resources/" will become the project root.

* brackets(\["controllers", "views", "public"\]); 
  the directory "./controllers/" will become the initial project root and the other folders will be accessible via
  Recent Projects dropdown (the small arrow above the navigation tree).
  
NOTE: the specified directories must exist, otherwise an exception will be thrown.

There is an example project based on [Express](http://expressjs.com/) MVC example, 
located in [https://github.com/rabchev/node-brackets-module/tree/master/examples/express-mvc](https://github.com/rabchev/node-brackets-module/tree/master/examples/express-mvc).

If you want to be able to see your code changes immediately on the live site, without manually restarting Node, 
you could use [node-supervisor](https://github.com/isaacs/node-supervisor) or similar module.

Security Considerations
-----------------------

Browser Compatibility
---------------------

Known Issues
------------

Roadmap
-------