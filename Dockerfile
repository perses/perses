FROM alpine AS build-env
RUN apk add --update --no-cache mailcap
RUN mkdir /perses
RUN mkdir /plugins

FROM gcr.io/distroless/static-debian12:nonroot

LABEL maintainer="The Perses Authors <perses-team@googlegroups.com>"

COPY --chown=nonroot:nonroot perses                            /bin/perses
COPY --chown=nonroot:nonroot percli                            /bin/percli
COPY --chown=nonroot:nonroot LICENSE                           /LICENSE
COPY --chown=nonroot:nonroot plugins-archive/                  /etc/perses/plugins-archive/
COPY --chown=nonroot:nonroot docs/examples/config.docker.yaml  /etc/perses/config.yaml
COPY --from=build-env --chown=nonroot:nonroot                  /perses         /perses
COPY --from=build-env --chown=nonroot:nonroot                  /plugins        /etc/perses/plugins
COPY --from=build-env --chown=nonroot:nonroot                  /etc/mime.types /etc/mime.types

WORKDIR /perses

EXPOSE     8080
VOLUME     ["/perses"]
ENTRYPOINT [ "/bin/perses" ]
CMD        ["--config=/etc/perses/config.yaml", \
            "--log.level=error"]
