FROM scratch

LABEL maintainer="Augustin Husson <husson.augustin@gmail.com>"

COPY perses /bin/perses
COPY percli /bin/percli

ENTRYPOINT [ "/bin/perses" ]
