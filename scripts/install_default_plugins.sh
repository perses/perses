#!/bin/bash

set -euo pipefail

overwrite=false

# Parse command-line options
while [[ $# -gt 0 ]]; do
  case $1 in
    --overwrite)
      shift
      overwrite=$1
      shift
      ;;
    *)
      break
      ;;
  esac
done

./scripts/install_plugin.sh --url https://github.com/perses/perses-plugins/releases/download/bar-chart-0.1.0/BarChart.tar.gz --overwrite "$overwrite" &
./scripts/install_plugin.sh --url https://github.com/perses/perses-plugins/releases/download/gauge-chart-0.1.0/GaugeChart.tar.gz --overwrite "$overwrite" &
./scripts/install_plugin.sh --url https://github.com/perses/perses-plugins/releases/download/markdown-chart-0.1.2/Markdown.tar.gz --overwrite "$overwrite" &
./scripts/install_plugin.sh --url https://github.com/perses/perses-plugins/releases/download/stat-chart-0.1.0/StatChart.tar.gz --overwrite "$overwrite" &
./scripts/install_plugin.sh --url https://github.com/perses/perses-plugins/releases/download/timeseries-chart-0.1.0/TimeSeriesChart.tar.gz --overwrite "$overwrite" &

wait
