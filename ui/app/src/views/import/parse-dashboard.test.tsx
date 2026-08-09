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

import '@testing-library/jest-dom';
import { getDashboardType, parseDashboard } from './parse-dashboard';

const GRAFANA_DASHBOARD = { panels: [{ title: 'CPU Usage', type: 'graph' }] };
const PERSES_DASHBOARD = { kind: 'perses', spec: { duration: '1h' } };

const YAML_GRAFANA = `
panels:
  - title: CPU Usage
    type: graph
`;

const YAML_PERSES = `
kind: perses
spec:
  duration: 1h
`;

const JSON_GRAFANA = JSON.stringify(GRAFANA_DASHBOARD);

const JSON_PERSES = JSON.stringify(PERSES_DASHBOARD);

describe('getDashboardType', () => {
  it.each([
    { name: 'detects grafana dashboard', input: { panels: [] }, expectedKind: 'grafana' as const },
    { name: 'detects perses dashboard', input: { kind: 'perses' }, expectedKind: 'perses' as const },
    { name: 'returns undefined when undefined is given', input: undefined, expectedKind: undefined },
  ])('$name', ({ input, expectedKind }) => {
    expect(getDashboardType(input)).toBe(expectedKind);
  });
});

describe('parseDashboard - YAML', () => {
  const cases = [
    {
      title: 'parses grafana dashboard',
      data: YAML_GRAFANA,
      expected: { kind: 'grafana', data: GRAFANA_DASHBOARD },
    },
    { title: 'parses perses dashboard', data: YAML_PERSES, expected: { kind: 'perses', data: PERSES_DASHBOARD } },
    { title: 'returns undefined for invalid yaml', data: ':invalid: yaml: [broken', expected: undefined },
  ];

  it.each(cases)('$title', ({ data, expected }) => {
    const result = parseDashboard(data);
    expect(result).toEqual(expected);
  });
});

describe('parseDashboard - JSON', () => {
  const cases = [
    { title: 'parses grafana dashboard', data: JSON_GRAFANA, expected: { kind: 'grafana', data: GRAFANA_DASHBOARD } },
    { title: 'parses perses dashboard', data: JSON_PERSES, expected: { kind: 'perses', data: PERSES_DASHBOARD } },
    { title: 'returns undefined for invalid json', data: '{not valid', expected: undefined },
  ];

  it.each(cases)('$title', ({ data, expected }) => {
    const result = parseDashboard(data);
    expect(result).toEqual(expected);
  });
});
