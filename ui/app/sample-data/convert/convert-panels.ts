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

import {
  AnyGraphQueryDefinition,
  AnyPanelDefinition,
  DashboardSpec,
} from '@perses-ui/core';
import { camelCase } from 'lodash-es';
import {
  GrafanaGraphPanel,
  GrafanaPanel,
  GrafanaRow,
  PromQueryTarget,
} from './grafana-json-model';

export function convertPanels(
  rowsAndPanels: Array<GrafanaRow | GrafanaPanel>
): { panels: DashboardSpec['panels']; panelKeys: Map<number, string> } {
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

function convertQueryTarget(target: PromQueryTarget): AnyGraphQueryDefinition {
  return {
    kind: 'PrometheusGraphQuery',
    options: {
      query: target.expr,
      min_step: `${target.step}s`,
    },
  };
}
