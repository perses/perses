// Copyright The Perses Authors
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

import { parseDashboard } from './parse-dashboard';

const GRAFANA_DASHBOARD = { panels: [{ title: 'CPU Usage', type: 'graph' }] };
const GRAFANA_V2_DASHBOARD = { apiVersion: 'dashboard.grafana.app/v2beta1', kind: 'Dashboard', spec: {} };
const PERSES_DASHBOARD = { kind: 'Dashboard', spec: { duration: '1h' } };

describe('parseDashboard', () => {
  it.each([
    {
      title: 'parses a grafana dashboard from YAML',
      definition: 'panels:\n  - title: CPU Usage\n    type: graph\n',
      expected: { kind: 'grafana', data: GRAFANA_DASHBOARD },
    },
    {
      title: 'parses a grafana v2 dashboard from YAML',
      definition: 'apiVersion: dashboard.grafana.app/v2beta1\nkind: Dashboard\nspec: {}\n',
      expected: { kind: 'grafana', data: GRAFANA_V2_DASHBOARD },
    },
    {
      title: 'parses a perses dashboard from YAML',
      definition: 'kind: Dashboard\nspec:\n  duration: 1h\n',
      expected: { kind: 'perses', data: PERSES_DASHBOARD },
    },
    {
      title: 'parses a grafana dashboard from JSON',
      definition: JSON.stringify(GRAFANA_DASHBOARD),
      expected: { kind: 'grafana', data: GRAFANA_DASHBOARD },
    },
    {
      title: 'parses a perses dashboard from JSON',
      definition: JSON.stringify(PERSES_DASHBOARD, null, 2),
      expected: { kind: 'perses', data: PERSES_DASHBOARD },
    },
    { title: 'returns undefined for invalid YAML', definition: ':invalid: yaml: [broken', expected: undefined },
    { title: 'returns undefined for invalid JSON', definition: '{not valid', expected: undefined },
    { title: 'returns undefined for a scalar', definition: 'just a string', expected: undefined },
    { title: 'returns undefined for a list', definition: '- a\n- b\n', expected: undefined },
    { title: 'returns undefined for an empty document', definition: '', expected: undefined },
  ])('$title', ({ definition, expected }) => {
    expect(parseDashboard(definition)).toEqual(expected);
  });
});
