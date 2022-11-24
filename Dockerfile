FROM gcr.io/distroless/static-debian11

LABEL maintainer="The Perses Authors <perses-team@googlegroups.com>"

USER nobody

COPY --chown=nobody:nobody perses                            /bin/perses
COPY --chown=nobody:nobody percli                            /bin/percli
COPY --chown=nobody:nobody LICENSE                           /LICENSE
COPY --chown=nobody:nobody schemas/                          /etc/perses/schemas/
COPY --chown=nobody:nobody cue.mod/                          /etc/perses/cue.mod/
COPY --chown=nobody:nobody docs/examples/config.docker.yaml  /etc/perses/config.yaml

WORKDIR /perses
RUN chown -R nobody:nobody /perses

EXPOSE     8080
VOLUME     ["/perses"]
ENTRYPOINT [ "/bin/perses" ]
CMD        ["--config=/etc/perses/config.yaml", \
            "--log.level=error"]
