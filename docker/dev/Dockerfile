FROM ubuntu:14.04
MAINTAINER Boyan Rabchev <boyan@rabchev.com>

RUN add-apt-repository ppa:git-core/ppa
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y curl
RUN apt-get install -y build-essential
RUN curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
RUN apt-get install -y nodejs
RUN npm install -g npm
RUN npm install -g grunt-cli
RUN npm install -g node-inspector
RUN cd /var
RUN git clone https://github.com/rabchev/brackets-server.git
RUN cd brackets-server
RUN git submodul update --init --recursive
RUN npm install
RUN grunt build
