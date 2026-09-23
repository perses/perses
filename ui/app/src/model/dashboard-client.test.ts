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

import type { DashboardResource } from '@perses-dev/client';

import type { ImportantDashboardGroupConfig } from './config-client';
import { resolveImportantDashboardGroups, resolveImportantDashboardList } from './dashboard-client';

function buildDashboard(project: string, name: string): DashboardResource {
  return {
    kind: 'Dashboard',
    metadata: {
      name,
      project,
    },
    spec: {},
  } as DashboardResource;
}

describe('resolveImportantDashboardList', () => {
  it('expands project entries and preserves explicitly configured duplicates', () => {
    const dashboards = [buildDashboard('perses', 'Demo'), buildDashboard('perses', 'Benchmark')];
    const groups: ImportantDashboardGroupConfig[] = [
      {
        dashboards: [{ project: 'perses' }, { project: 'perses', dashboard: 'Demo' }],
      },
    ];

    expect(
      resolveImportantDashboardList(dashboards, groups, false).map((dashboard) => dashboard.metadata.name),
    ).toEqual(['Demo', 'Benchmark', 'Demo']);
  });
});

describe('resolveImportantDashboardGroups', () => {
  it('matches dashboard selectors case-insensitively when resource names are normalized', () => {
    const dashboards = [buildDashboard('Perses', 'Demo')];
    const groups: ImportantDashboardGroupConfig[] = [
      {
        title: 'Main',
        dashboards: [{ project: 'perses', dashboard: 'demo' }, { project: 'perses' }],
      },
    ];

    const resolvedGroups = resolveImportantDashboardGroups(dashboards, groups, true);

    expect(resolvedGroups).toHaveLength(1);
    expect(resolvedGroups[0]?.entries).toEqual([
      { kind: 'dashboard', dashboard: dashboards[0] },
      { kind: 'project', project: 'perses', dashboards },
    ]);
  });
});
