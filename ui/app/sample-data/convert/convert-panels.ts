// Copyright 2021 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { TimeSeriesQueryDefinition, PanelDefinition, DashboardSpec } from '@perses-dev/core';
import { camelCase } from 'lodash-es';
import {
  GrafanaGaugePanel,
  GrafanaGraphPanel,
  GrafanaSingleStatPanel,
  GrafanaPanel,
  GrafanaRow,
  PromQueryTarget,
} from './grafana-json-model';
import { convertTransformation } from './convert-transformations';

export function convertPanels(rowsAndPanels: Array<GrafanaRow | GrafanaPanel>): {
  panels: DashboardSpec['panels'];
  panelKeys: Map<number, string>;
} {
  const panels: DashboardSpec['panels'] = {};

  // Generate unique keys for Grafana panels, trying to make them human-readable
  // by camel casing the panel title, but appending the panel's unique ID if
  // necesssary
  const usedPanelKeys = new Set<string>();
  const panelKeys = new Map<number, string>(); // Grafana Panel ID -> Generated Key
  const addPanelKey = (panel: GrafanaPanel) => {
    let key = camelCase(panel.title);
    if (key === '' && usedPanelKeys.has(key)) {
      key += panel.id.toString();
    }
    panelKeys.set(panel.id, key);
    usedPanelKeys.add(key);
    return key;
  };

  for (const rowOrPanel of rowsAndPanels) {
    if (rowOrPanel.type === 'row') {
      if (rowOrPanel.collapsed === false) continue;

      for (const panel of rowOrPanel.panels) {
        const key = addPanelKey(panel);
        panels[key] = convertPanel(panel);
      }
      continue;
    }

    const key = addPanelKey(rowOrPanel);
    panels[key] = convertPanel(rowOrPanel);
  }

  return { panels, panelKeys };
}

function convertPanel(grafanaPanel: GrafanaPanel): PanelDefinition {
  switch (grafanaPanel.type) {
    case 'graph':
      return convertGraphPanel(grafanaPanel);
    case 'singlestat':
      return convertSingleStatPanel(grafanaPanel);
    case 'gauge':
      return convertGaugePanel(grafanaPanel);
    default:
      return {
        kind: 'Panel',
        spec: {
          display: {
            name: grafanaPanel.title,
          },
          plugin: {
            kind: 'EmptyChart',
            spec: {},
          },
        },
      };
  }
}

function convertGraphPanel(graphPanel: GrafanaGraphPanel): PanelDefinition {
  return {
    kind: 'Panel',
    spec: {
      display: {
        name: graphPanel.title,
      },
      plugin: {
        kind: 'LineChart',
        spec: {
          queries: graphPanel.targets.map(convertQueryTarget),
        },
      },
    },
  };
}

function convertGaugePanel(gaugePanel: GrafanaGaugePanel): PanelDefinition {
  // TODO: Does a Gauge chart with multiple queries even make sense?
  const target = gaugePanel.targets[0];

  const filteredThresholdSteps = gaugePanel.fieldConfig.defaults.thresholds.steps.filter((elem) => {
    delete elem.color; // defaults defined in thresholds.ts used instead
    return elem.value != null;
  });

  return {
    kind: 'Panel',
    spec: {
      display: {
        name: gaugePanel.title,
      },
      plugin: {
        kind: 'GaugeChart',
        spec: {
          query: convertQueryTarget(target),
          calculation: 'LastNumber',
          unit: { kind: 'Percent' }, // TODO (sjcobb): add calc mapping, support gauge formats other than percents
          thresholds: {
            steps: filteredThresholdSteps,
          },
        },
      },
    },
  };
}

function convertSingleStatPanel(statPanel: GrafanaSingleStatPanel): PanelDefinition {
  const target = statPanel.targets[0];
  const convertedPanel = {
    kind: 'Panel' as const,
    spec: {
      display: {
        name: statPanel.title,
      },
      plugin: {
        kind: 'StatChart',
        spec: {
          query: convertQueryTarget(target),
          calculation: convertTransformation(statPanel.valueName),
          unit: {
            kind: 'Decimal',
            decimal_places: statPanel.decimals ?? 2,
            abbreviate: true,
          },
        },
      },
    },
  };
  if (statPanel.sparkline.show === true) {
    convertedPanel.spec.plugin.spec['sparkline'] = {};
  }
  return convertedPanel;
}

function convertQueryTarget(target?: PromQueryTarget): TimeSeriesQueryDefinition {
  const query = target?.expr ?? '';
  const min_step = target?.step === undefined ? undefined : `${target.step}s`;

  return {
    kind: 'TimeSeriesQuery',
    spec: {
      plugin: {
        kind: 'PrometheusTimeSeriesQuery',
        spec: {
          query,
          min_step,
        },
      },
    },
  };
}
