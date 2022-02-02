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

import { DashboardResource, DurationString, isDurationString } from '@perses-dev/core';
import { convertVariables } from './convert-variables';
import { convertPanels } from './convert-panels';
import { convertLayouts } from './convert-layouts';
import { GrafanaDashboardJson, GrafanaTimeRange } from './grafana-json-model';

export function convertDashboardJson(json: GrafanaDashboardJson): DashboardResource {
  const now = new Date();

  const { panels, panelKeys } = convertPanels(json.panels);
  return {
    kind: 'Dashboard',
    metadata: {
      name: json.title,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      project: 'perses',
    },
    spec: {
      datasource: { kind: 'Prometheus', name: 'PrometheusDemo', global: true },
      duration: convertTimeRange(json.time),
      variables: convertVariables(json.templating.list),
      panels,
      layouts: convertLayouts(json.panels, panelKeys),
    },
  };
}

function convertTimeRange(range: GrafanaTimeRange): DurationString {
  // Just handle the 'now' case for the time being, otherwise return a default
  if (range.to === 'now' && range.from.startsWith('now-')) {
    const maybeDuration = range.from.substring(4);
    if (isDurationString(maybeDuration)) {
      return maybeDuration;
    }
  }
  return '24h';
}
