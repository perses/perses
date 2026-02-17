FROM alpine AS build-env
RUN apk add --update --no-cache mailcap
RUN mkdir /perses
RUN mkdir /plugins

FROM gcr.io/distroless/static-debian12:debug-nonroot
ARG TARGETPLATFORM
LABEL maintainer="The Perses Authors <perses-team@googlegroups.com>"

COPY                                          ${TARGETPLATFORM}/perses                       /bin/perses
COPY                                          ${TARGETPLATFORM}/percli                       /bin/percli
COPY                                          LICENSE                                        /LICENSE
COPY                                          plugins-archive/                               /etc/perses/plugins-archive/
COPY                                          docs/examples/config.docker.yaml               /etc/perses/config.yaml
COPY --from=build-env --chown=nonroot:nonroot /perses                                        /perses
COPY --from=build-env --chown=nonroot:nonroot /plugins                                       /etc/perses/plugins
COPY --from=build-env                         /etc/mime.types                                /etc/mime.types

WORKDIR /perses

EXPOSE     8080
VOLUME     ["/perses"]
ENTRYPOINT [ "/bin/perses" ]
CMD        ["--config=/etc/perses/config.yaml", \
            "--log.level=error"]
