FROM ubuntu:14.04
MAINTAINER Boyan Rabchev <boyan@rabchev.com>

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && \
    apt-get -y install software-properties-common
RUN add-apt-repository ppa:git-core/ppa && \
    apt-get update && \
    apt-get install -y git curl build-essential

RUN curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash - && \
    apt-get install -y nodejs

RUN npm install -g npm && \
    npm install -g grunt-cli && \
    npm install -g node-inspector

WORKDIR ~
RUN mkdir Projects && mkdir .brackets-srv

WORKDIR /var
RUN git clone https://github.com/rabchev/brackets-server.git

WORKDIR /var/brackets-server
RUN git submodule update --init --recursive && \
    npm install && \
    grunt build

EXPOSE 6800 8080
VOLUME ["~/Projects", "~/.brackets-srv", "/var/brackets-server"]

COPY start.sh /

ENTRYPOINT ["/start.sh"]
CMD ["-d"]
