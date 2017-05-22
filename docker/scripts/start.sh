#!/bin/bash

if [ -z "$DEBUG" ]; then
    echo "starting in normal mode"
    node "/var/brackets-server/nodespeedide" $*
elif [ $DEBUG = "debug" ]; then
    echo "starting in debug mode"
    node-inspector -p  8081 &
    node --debug "/var/brackets-server/nodespeedide" $*
elif [ $DEBUG = "debug-brk" ]; then
    echo "starting in debug-brk mode"
    node-inspector &
    node --debug-brk "/var/brackets-server/nodespeedide" $*
else
    echo "unsupported debug variable"
    exit 1
fi

