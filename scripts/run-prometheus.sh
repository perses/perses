#!/bin/bash

# This script is use to run Prometheus in the CI for windows tests.
# As I have no idea why I cannot run prometheus in the background on windows using the `&` operator directly in github actions,
# I have written this script for this purpose. And nothing else.
# Please do NOT open any issue about this script, excepting if you have a better solution to run prometheus in the background on windows, or if you have an issue related to the CI.

prometheus/prometheus.exe --config.file=prometheus/prometheus.yml &

# Wait for Prometheus to start
while ! curl --silent --fail localhost:9090/api/v1/status/config; do
    echo >&2 'Site down, retrying in 5s...'
    sleep 5
done
echo >&2 'Site up, exiting'
