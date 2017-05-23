FROM ubuntu:16.04
MAINTAINER Thomas Hansen "thomas-docker@whogloo.com"

ENV DEBIAN_FRONTEND noninteractive

RUN DEBIAN_FRONTEND=noninteractive \
  apt-get update && \
  apt-get install -y \
  supervisor \
  build-essential \
  curl \
  wget \
  git \
  vim \
  zip \
  sudo \
  iputils-ping \
  man && \
  rm -rf /var/lib/apt/lists/* && \
  apt-get clean && \
  apt-get -y autoremove && apt-get -y clean && \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
  curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash - && \
  apt-get install -y nodejs && \
  npm install -g grunt-cli && \
  npm cache clean

# Add a nodespeed user so that we we are not running as root
RUN addgroup nodespeed && \
    useradd --system -g nodespeed --uid 1000 -m -s /bin/bash nodespeed && \
    usermod -a -G nodespeed root && \
    echo 'nodespeed ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers && \
    chown -R nodespeed /var/log/supervisor /var/run && \
    mkdir -p /projects && \
    mkdir -p /projects/.brackets-server

# Clone and build the nodeSpeed IDE
WORKDIR /var
RUN git clone https://github.com/whoGloo/nodespeed-ide.git brackets-server && \
    cd /var/brackets-server && \
    git submodule update --init --recursive && \
    npm install && \
    grunt build

WORKDIR /var/brackets-server

#  Make sure we have the correct permissions for the nodespeed user to be able to use supervisor and the IDE
RUN mkdir -p /var/log/supervisor && \
    chown -R nodespeed:nodespeed /var/log/supervisor && \
    chown -R nodespeed:nodespeed /projects && \
    chmod 0777 -R /var/log/supervisor && \
    cp /var/brackets-server/docker/supervisor/supervisord.conf /etc/supervisor/supervisord.conf && \
    cp /var/brackets-server/docker/scripts/* / && \
    cp /var/brackets-server/docker/conf/* /etc/supervisor/conf.d/ && \
    rm -fr /var/brackets-server/embedded-ext && \
    rm -fr /var/brackets-server/docker && \
    rm -fr /var/brackets-server/hacks && \
    rm -fr /var/brackets-server/examples && \
    rm -fr /var/brackets-server/test && \
    rm -fr /var/brackets-server/brackets-src && \
    chown -R nodespeed:nodespeed /var/brackets-server && \
    chown -R nodespeed:nodespeed /var/log/supervisor && \
    chmod 0777 -R /var/log/supervisor && \
    rm -fr /root/.ssh

USER nodespeed

# Expose the IDE port, the Terminal port, the application runtime preview port and the websockets port
EXPOSE 6800 8080 3000 9485
VOLUME ["/projects", "/var/brackets-server"]

CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
