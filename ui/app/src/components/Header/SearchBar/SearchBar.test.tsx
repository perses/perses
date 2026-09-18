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

import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { StatusError } from '@perses-dev/client';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

const { authState, listState } = vi.hoisted(() => ({
  authState: {
    dashboards: true,
    projects: true,
    datasources: true,
    globalDatasources: true,
  },
  listState: {
    dashboards: {
      data: [] as unknown[],
      isLoading: false,
      error: null as StatusError | null,
    },
    importantDashboards: {
      data: [] as unknown[],
      isLoading: false,
      error: null as StatusError | null,
    },
    projects: {
      data: [] as unknown[],
      error: null as StatusError | null,
    },
    datasources: {
      data: [] as unknown[],
      error: null as StatusError | null,
    },
    globalDatasources: {
      data: [] as unknown[],
      error: null as StatusError | null,
    },
    globalDatasourceListCalls: 0,
  },
}));

vi.mock('@perses-dev/dashboards', () => ({
  formatForDisplay: (key: string): string => key,
  OPEN_SEARCH_EVENT: 'perses:open-search',
}));

vi.mock('../../../utils/browser-size', () => ({
  useIsMobileSize: (): boolean => false,
}));

vi.mock('../../../context/Authorization', () => ({
  GlobalProject: '*',
  useHasPermission: (_action: string, _project: string, scope: string): boolean => {
    return scope === 'GlobalDatasource' ? authState.globalDatasources : true;
  },
  useHasPermissionInAnyProject: (_action: string, scope: string): boolean => {
    if (scope === 'Dashboard') {
      return authState.dashboards;
    }
    if (scope === 'Project') {
      return authState.projects;
    }
    if (scope === 'Datasource') {
      return authState.datasources;
    }
    return true;
  },
}));

vi.mock('../../../model/dashboard-client', () => ({
  useDashboardList: (): typeof listState.dashboards => listState.dashboards,
  useImportantDashboardList: (): typeof listState.importantDashboards => listState.importantDashboards,
}));

vi.mock('../../../model/project-client', () => ({
  useProjectList: (): typeof listState.projects => listState.projects,
}));

vi.mock('../../../model/datasource-client', () => ({
  useDatasourceList: (): typeof listState.datasources => listState.datasources,
}));

vi.mock('../../../model/global-datasource-client', () => ({
  useGlobalDatasourceList: (): typeof listState.globalDatasources => {
    listState.globalDatasourceListCalls += 1;
    return listState.globalDatasources;
  },
}));

import { SearchBar } from './SearchBar';

const theme = createTheme();

function renderSearchBar(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <SearchBar />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

async function openSearch(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: /search/i }));
}

function resetState(): void {
  authState.dashboards = true;
  authState.projects = true;
  authState.datasources = true;
  authState.globalDatasources = true;
  listState.dashboards = { data: [], isLoading: false, error: null };
  listState.importantDashboards = { data: [], isLoading: false, error: null };
  listState.projects = { data: [], error: null };
  listState.datasources = { data: [], error: null };
  listState.globalDatasources = { data: [], error: null };
  listState.globalDatasourceListCalls = 0;
}

describe('SearchBar', () => {
  beforeEach(() => {
    resetState();
  });

  it('shows a shared error alert when a resource list fails to load', async () => {
    listState.projects = {
      data: [],
      error: { message: 'network down', status: 500 } as StatusError,
    };

    renderSearchBar();
    await openSearch();

    expect(screen.getByText('Failed to load projects: network down')).toBeInTheDocument();
  });

  it('does not leak RBAC scope names when a list request is forbidden', async () => {
    listState.globalDatasources = {
      data: [],
      error: {
        message: "forbidden access: missing 'read' global permission for 'GlobalDatasource' kind",
        status: 403,
      } as StatusError,
    };

    renderSearchBar();
    await openSearch();

    expect(
      screen.getByText('Failed to load global datasources: you do not have permission to view this'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/GlobalDatasource/)).not.toBeInTheDocument();
  });

  it('does not search global datasources the user cannot read', async () => {
    authState.globalDatasources = false;
    listState.globalDatasources = {
      data: [],
      error: {
        message: "forbidden access: missing 'read' global permission for 'GlobalDatasource' kind",
        status: 403,
      } as StatusError,
    };

    renderSearchBar();
    await openSearch();

    expect(listState.globalDatasourceListCalls).toBe(0);
    expect(screen.queryByText(/Failed to load global datasources/)).not.toBeInTheDocument();
    expect(screen.queryByText(/GlobalDatasource/)).not.toBeInTheDocument();
  });

  it('lists matching resources when APIs succeed', async () => {
    listState.projects = {
      data: [
        {
          kind: 'Project',
          metadata: { name: 'demo', createdAt: '', updatedAt: '', version: 0 },
        },
      ],
      error: null,
    };

    renderSearchBar();
    await openSearch();
    await userEvent.type(screen.getByPlaceholderText('What are you looking for?'), 'demo');

    expect(screen.getByRole('link', { name: /demo/i })).toBeInTheDocument();
  });
});
