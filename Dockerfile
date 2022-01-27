FROM scratch

LABEL maintainer="Augustin Husson <husson.augustin@gmail.com>"

COPY perses /bin/perses
COPY p3s /bin/p3s

ENTRYPOINT [ "/bin/perses" ]
