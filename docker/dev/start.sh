#!/bin/bash

if [ -z "$DEBUG" ]; then
    echo "starting in normal mode"
    node "/var/brackets-server/bin/run" $*
elif [ $DEBUG = "debug" ]; then
    echo "starting in debug mode"
    node-inspector &
    node --debug "/var/brackets-server/bin/run" $*
elif [ $DEBUG = "debug-brk" ]; then
    echo "starting in debug-brk mode"
    node-inspector &
    node --debug-brk "/var/brackets-server/bin/run" $*
else
    echo "unsupported debug variable"
    exit 1
fi
