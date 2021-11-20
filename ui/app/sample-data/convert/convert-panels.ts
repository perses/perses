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

import { DashboardSpec } from '@perses-ui/core';
import { camelCase } from 'lodash-es';
import { GrafanaPanel, GrafanaRow } from './grafana-json-model';

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
        panels[key] = {
          kind: 'EmptyChart',
          display: {
            name: panel.title,
          },
          options: {},
        };
      }
      continue;
    }

    const key = addPanelKey(rowOrPanel);
    panels[key] = {
      kind: 'EmptyChart',
      display: {
        name: rowOrPanel.title,
      },
      options: {},
    };
  }

  return { panels, panelKeys };
}
