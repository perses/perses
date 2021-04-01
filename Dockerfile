FROM scratch

LABEL maintainer="Augustin Husson <husson.augustin@gmail.com>"

COPY perses /bin/perses

ENTRYPOINT [ "/bin/perses" ]
