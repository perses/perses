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

import { AnyGraphQueryDefinition, AnyPanelDefinition, DashboardSpec } from '@perses-dev/core';
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

function convertPanel(grafanaPanel: GrafanaPanel): AnyPanelDefinition {
  switch (grafanaPanel.type) {
    case 'graph':
      return convertGraphPanel(grafanaPanel);
    case 'singlestat':
      return convertSingleStatPanel(grafanaPanel);
    case 'gauge':
      return convertGaugePanel(grafanaPanel);
    default:
      return {
        kind: 'EmptyChart',
        display: {
          name: grafanaPanel.title,
        },
        options: {},
      };
  }
}

function convertGraphPanel(graphPanel: GrafanaGraphPanel): AnyPanelDefinition {
  return {
    kind: 'LineChart',
    display: {
      name: graphPanel.title,
    },
    options: {
      queries: graphPanel.targets.map(convertQueryTarget),
    },
  };
}

function convertGaugePanel(gaugePanel: GrafanaGaugePanel): AnyPanelDefinition {
  // TODO: Does a Gauge chart with multiple queries even make sense?
  const target = gaugePanel.targets[0];

  const filteredThresholdSteps = gaugePanel.fieldConfig.defaults.thresholds.steps.filter((elem) => {
    delete elem.color; // defaults defined in thresholds.ts used instead
    return elem.value != null;
  });

  return {
    kind: 'GaugeChart',
    display: {
      name: gaugePanel.title,
    },
    options: {
      query: convertQueryTarget(target),
      calculation: 'LastNumber',
      unit: { kind: 'Percent' }, // TODO (sjcobb): add calc mapping, support gauge formats other than percents
      thresholds: {
        steps: filteredThresholdSteps,
      },
    },
  };
}

function convertSingleStatPanel(statPanel: GrafanaSingleStatPanel): AnyPanelDefinition {
  const target = statPanel.targets[0];
  const { format } = statPanel;
  const convertedFormat = format[format.length - 1] === 's' ? format.slice(0, -1) : format;
  // TODO (sjcobb): convert sparkline color / backgroundColor and remaining formats, use migrateFromAngularSinglestat
  const convertedPanel = {
    kind: 'StatChart',
    display: {
      name: statPanel.title,
    },
    options: {
      query: convertQueryTarget(target),
      calculation: convertTransformation(statPanel.valueName),
      unit: {
        kind: 'Decimal',
        suffix: convertedFormat,
        decimal_places: statPanel.decimals ?? 2,
      },
    },
  };
  if (statPanel.sparkline.show === true) {
    convertedPanel.options['sparkline'] = {};
  }
  return convertedPanel;
}

function convertQueryTarget(target?: PromQueryTarget): AnyGraphQueryDefinition {
  const query = target.expr ?? '';
  const min_step = target.step === undefined ? undefined : `${target.step}s`;

  return {
    kind: 'PrometheusGraphQuery',
    options: {
      query,
      min_step,
    },
  };
}
