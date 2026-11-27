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
const PERSES_DASHBOARD = { kind: 'Dashboard', metadata: { name: 'test' }, spec: { duration: '1h' } };
const PERSES_YAML = 'kind: Dashboard\nmetadata:\n  name: test\nspec:\n  duration: 1h\n';

describe('parseDashboard', () => {
  it.each([
    {
      title: 'parses a grafana dashboard from YAML',
      definition: 'panels:\n  - title: CPU Usage\n    type: graph\n',
      expected: GRAFANA_DASHBOARD,
    },
    {
      title: 'parses a grafana v2 dashboard from YAML',
      definition: 'apiVersion: dashboard.grafana.app/v2beta1\nkind: Dashboard\nspec: {}\n',
      expected: GRAFANA_V2_DASHBOARD,
    },
    {
      title: 'parses a grafana dashboard from JSON',
      definition: JSON.stringify(GRAFANA_DASHBOARD),
      expected: GRAFANA_DASHBOARD,
    },
  ])('$title', ({ definition, expected }) => {
    expect(parseDashboard(definition)).toEqual({ kind: 'grafana', data: expected });
  });

  it.each([
    { title: 'parses a perses dashboard from YAML', definition: PERSES_YAML },
    { title: 'parses a perses dashboard from JSON', definition: JSON.stringify(PERSES_DASHBOARD, null, 2) },
    {
      title: 'keeps JSON semantics for duplicate keys (last one wins)',
      definition: '{"kind": "Dashboard", "metadata": {"name": "test"}, "spec": {"duration": "5m", "duration": "1h"}}',
    },
    {
      title: 'resolves YAML merge keys',
      definition:
        'defaults: &defaults\n  duration: 1h\nkind: Dashboard\nmetadata:\n  name: test\nspec:\n  <<: *defaults\n',
      expected: { ...PERSES_DASHBOARD, defaults: { duration: '1h' } },
    },
    { title: 'unwraps a YAML list with a single dashboard', definition: `- ${PERSES_YAML.replaceAll('\n', '\n  ')}` },
    { title: 'unwraps a JSON list with a single dashboard', definition: JSON.stringify([PERSES_DASHBOARD]) },
    { title: 'ignores empty YAML documents', definition: `---\n${PERSES_YAML}---\n# end\n` },
  ])('$title', ({ definition, expected = PERSES_DASHBOARD }) => {
    expect(parseDashboard(definition)).toEqual({ kind: 'perses', data: expected });
  });

  it('keeps the YAML 1.2 scalars when resolving merge keys', () => {
    expect(parseDashboard('kind: Dashboard\nmetadata:\n  name: "on"\nspec:\n  display: on\n')).toEqual({
      kind: 'perses',
      data: { kind: 'Dashboard', metadata: { name: 'on' }, spec: { display: 'on' } },
    });
  });

  it.each([
    { title: 'an empty definition', definition: '' },
    { title: 'blank lines', definition: '\n  \n' },
    { title: 'only comments', definition: '# nothing here\n' },
  ])('returns undefined for $title', ({ definition }) => {
    expect(parseDashboard(definition)).toBeUndefined();
  });

  it.each([
    { title: 'invalid YAML', definition: ':invalid: yaml: [broken', message: /neither valid JSON nor valid YAML/ },
    { title: 'invalid JSON', definition: '{not valid', message: /neither valid JSON nor valid YAML/ },
    { title: 'a scalar', definition: 'just a string', message: /must be a dashboard object/ },
    { title: 'a list of scalars', definition: '- a\n', message: /must be a dashboard object/ },
    { title: 'a list of several dashboards', definition: `- ${'{}'}\n- ${'{}'}\n`, message: /list of 2 items/ },
    { title: 'an empty list', definition: '[]', message: /list of 0 items/ },
    { title: 'several YAML documents', definition: `${PERSES_YAML}---\n${PERSES_YAML}`, message: /2 YAML documents/ },
    {
      title: 'an operator resource',
      definition: 'apiVersion: perses.dev/v1alpha2\nkind: PersesDashboard\nmetadata:\n  name: test\nspec: {}\n',
      message: /PersesDashboard resources of the Perses operator are not supported/,
    },
    { title: 'another kind of resource', definition: 'kind: Datasource\nmetadata: {}\n', message: /kind "Datasource"/ },
    { title: 'a dashboard without metadata', definition: 'kind: Dashboard\nspec: {}\n', message: /no metadata/ },
  ])('reports $title as invalid', ({ definition, message }) => {
    const dashboard = parseDashboard(definition);
    expect(dashboard?.kind).toBe('invalid');
    expect(dashboard?.kind === 'invalid' && dashboard.message).toMatch(message);
  });

  it('does not log YAML warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseDashboard('kind: Dashboard\nmetadata: !foo {}\n')).toMatchObject({ kind: 'perses' });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
