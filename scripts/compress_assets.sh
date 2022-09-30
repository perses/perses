#!/usr/bin/env bash
#
# compress static assets

set -euo pipefail

cd ui
cp embed.go.tmpl embed.go

GZIP_OPTS="-fk"
# gzip option '-k' may not always exist in the latest gzip available on different distros.
if ! gzip -k -h &>/dev/null; then GZIP_OPTS="-f"; fi

dist="app/dist"

if ! [[ -d "${dist}" ]]; then
  mkdir -p ${dist}
  echo "<!doctype html>
        <html lang=\"en\">
        <head>
          <meta charset=\"utf-8\">
          <title>Node</title>
          <base href=\"/\">
          <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
          <link rel=\"icon\" type=\"image/x-icon\" href=\"favicon.ico\">
        </head>
        <body>
        <div>
          <p> This is the default index, looks like you forget to generate the react app before generating the golang endpoint.</p>
        </div>
        </body>
        </html>" > ${dist}/index.html
fi

find app/dist -type f -name '*.gz' -delete
find app/dist -type f -exec gzip $GZIP_OPTS '{}' \; -print0 | xargs -0 -I % echo %.gz | xargs echo //go:embed >> embed.go
echo var embedFS embed.FS >> embed.go
