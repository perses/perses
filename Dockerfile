FROM scratch

LABEL maintainer="The Perses Authors <perses-team@googlegroups.com>"

COPY perses                     /bin/perses
COPY percli                     /bin/percli
COPY LICENSE                    /LICENSE
COPY schemas/                   /etc/perses/schemas/
COPY docs/examples/config.yaml  /etc/perses/config.yaml

WORKDIR    /perses
EXPOSE     8080
VOLUME     ["/perses"]
ENTRYPOINT [ "/bin/perses" ]
CMD        ["--config=/etc/perses/config.yaml", \
            "--log.level=error"]
