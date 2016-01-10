Docker Image for Brackets-Server Development
============================================

How to build
------------

    $ docker build -t brackets_server_dev
    
This will pull the last commit in master branch and build brackets-server.

How to use this image
---------------------

Start in normal mode:

    $ docker run -d -p 6800:6800 --name brackets-server -v /home/myname/Projects:/root/Projects brackets_server_dev

Open browser and navigate to http://localhost:6800

Start in debug mode:

    $ docker run -e DEBUG=debug -d -p 6800:6800 -p 8080:8080 --name brackets-server-debug brackets_server_dev
    
The value of DEBUG variable can be either debug or debug-brk. This will also start node-inspector on port 8080 in the same container.

