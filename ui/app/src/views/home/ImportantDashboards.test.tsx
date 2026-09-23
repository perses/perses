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
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { ImportantDashboards } from './ImportantDashboards';

function buildDashboard(project: string, name: string, displayName = name): DashboardResource {
  return {
    kind: 'Dashboard',
    metadata: {
      name,
      project,
      createdAt: '2024-01-01T00:00:00Z',
    },
    spec: {
      display: {
        name: displayName,
      },
      panels: {
        first: {},
      },
    },
  } as unknown as DashboardResource;
}

vi.mock('../../context/Config', () => ({
  useImportantDashboardGroups: (): Array<{
    title: string;
    description: string;
    dashboards: Array<{ project: string; dashboard?: string }>;
  }> => [
    {
      title: 'Operations',
      description: 'Key dashboards and projects',
      dashboards: [{ project: 'perses', dashboard: 'demo' }, { project: 'testing' }],
    },
  ],
}));

vi.mock('../../model/dashboard-client', () => ({
  useImportantDashboardGroupsData: (): {
    isLoading: boolean;
    data: Array<{
      title: string;
      description: string;
      entries: Array<
        | { kind: 'dashboard'; dashboard: DashboardResource }
        | { kind: 'project'; project: string; dashboards: DashboardResource[] }
      >;
    }>;
    error: null;
  } => ({
    isLoading: false,
    data: [
      {
        title: 'Operations',
        description: 'Key dashboards and projects',
        entries: [
          {
            kind: 'dashboard',
            dashboard: buildDashboard('perses', 'demo', 'Demo dashboard'),
          },
          {
            kind: 'project',
            project: 'testing',
            dashboards: [buildDashboard('testing', 'defaults')],
          },
        ],
      },
    ],
    error: null,
  }),
}));

describe('ImportantDashboards', () => {
  it('renders grouped dashboard and project shortcuts', () => {
    render(
      <MemoryRouter>
        <ImportantDashboards />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Operations')).not.toBeNull();
    expect(screen.queryByText('Key dashboards and projects')).not.toBeNull();

    const dashboardLink = screen.getByRole('link', { name: 'perses demo' });
    expect(dashboardLink.getAttribute('href')).toBe('/projects/perses/dashboards/demo');
    expect(screen.queryByText('Demo dashboard')).not.toBeNull();

    const projectLink = screen.getByRole('link', { name: 'testing' });
    expect(projectLink.getAttribute('href')).toBe('/projects/testing');
    expect(screen.queryByText('1 dashboard in project')).not.toBeNull();
  });
});
