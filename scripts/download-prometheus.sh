#!/bin/bash

version=3.2.1

arch=$(go env GOARCH)
os=$(go env GOOS)

curl -L https://github.com/prometheus/prometheus/releases/download/v${version}/prometheus-${version}."${os}"-"${arch}".tar.gz | tar -xz

mv prometheus-${version}."${os}"-"${arch}" prometheus
