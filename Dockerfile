FROM alpine:3.16

LABEL maintainer="The Perses Authors <perses-team@googlegroups.com>"

COPY perses                            /bin/perses
COPY percli                            /bin/percli
COPY LICENSE                           /LICENSE
COPY schemas/                          /etc/perses/schemas/
COPY cue.mod/                          /etc/perses/cue.mod/
COPY docs/examples/config.docker.yaml  /etc/perses/config.yaml

WORKDIR /perses
RUN chown -R nobody:nobody /etc/perses /perses

USER       nobody
EXPOSE     8080
VOLUME     ["/perses"]
ENTRYPOINT [ "/bin/perses" ]
CMD        ["--config=/etc/perses/config.yaml", \
            "--log.level=error"]
