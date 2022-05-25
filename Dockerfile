FROM scratch

LABEL maintainer="The Perses Authors <perses-team@googlegroups.com>"

COPY perses /bin/perses
COPY percli /bin/percli

ENTRYPOINT [ "/bin/perses" ]
