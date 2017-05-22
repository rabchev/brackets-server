# Docker Image for nodeSpeed IDE


## How to build

```
cd docker 
. make.sh 
```

This will build a node Docker image using the latest build from master of nodeSpeed IDE. 

If you are using a fork of this project,make sure to adjust the Dockerfile accordingly. 

## How to use this image

Start in normal mode:

    $ docker run -d -p 6800:6800 -p 8080:8080 -p 3000:3000 --name nodespeed-ide -v /home/myname/projects:/projects nodespeed-ide 

Open browser and navigate to http://localhost:6800

The nodeSpeed Terminal will be available on http://localhost/8080. 

Any node applications run from inside the IDE container on port 3000 will be available on http://localhost:3000. 

Start in debug mode:

    $ docker run -e DEBUG=debug -d -p 6800:6800 -p 8081:8081 --name nodespeed-ide-debug nodespeed-ide
    
The value of DEBUG variable can be either debug or debug-brk. This will also start node-inspector on port 8081 in the same container.

# Spinups.io
nodeSpeed IDE is available as a commercial offering on [Spinups.io](https://spinups.io) under the product name **nodeSpeed Development**. Get your own private instance of nodeSpeed development by [signing up for an account](https://signup.spinups.io/nodespeed_development) and spinning up an instance with a 14-day free trial. 
