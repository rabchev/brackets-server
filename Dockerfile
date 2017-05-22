FROM node
MAINTAINER Thomas Hansen "thomas-docker@whogloo.com"

ENV DEBIAN_FRONTEND noninteractive

RUN DEBIAN_FRONTEND=noninteractive \
  apt-get update && \
  apt-get install -y \
  wget \
  supervisor \
  build-essential \
  curl \
  libssl-dev \
  git \
  vim \
  zip \
  sudo \
  man && \
  sed -i 's/^\(\[supervisord\]\)$/\1\nnodaemon=true/' /etc/supervisor/supervisord.conf  && \
  rm -rf /var/lib/apt/lists/* && \
  apt-get clean && \
  apt-get -y autoremove && apt-get -y clean && \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
  npm install -g grunt-cli && \
  npm cache clean

# Add a nodespeed user so that we we are not running as root
RUN addgroup nodespeed && \
    useradd --system -g nodespeed --uid 1000 -m -s /bin/bash nodespeed && \
    usermod -a -G nodespeed root && \
    echo 'nodespeed ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers && \
    chown -R nodespeed /var/log/supervisor /var/run

RUN mkdir -p /projects && \
    mkdir -p /projects/.brackets-server

# Clone and build the nodeSpeed IDE
WORKDIR /var
RUN git clone https://github.com/whoGloo/nodespeed-ide.git

WORKDIR /var/brackets-server
RUN git submodule update --init --recursive && \
    npm install && \
    grunt build

# Add the supervisor files used to start the IDE and Terminal processes when the code container starts
ADD conf/ /etc/supervisor/conf.d/

RUN mkdir -p /var/log/supervisor && \
    chown -R nodespeed:nodespeed /var/log/supervisor && \
    chown -R nodespeed:nodespeed /projects && \
    chmod 0777 -R /var/log/supervisor && \
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

ADD docker/scripts/ /

# Expose the IDE port, the Terminal port and the application runtime preview port
EXPOSE 6800 8080 3000
VOLUME ["/projects", "/var/brackets-server"]

CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
