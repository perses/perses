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

import { UserFriendlyError } from '@perses-dev/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { useHasPermission } from '../../../context/Authorization';
import type * as Authorization from '../../../context/Authorization';
import { ConfigContextProvider } from '../../../context/Config';
import { useConfig } from '../../../model/config-client';
import type * as ConfigClient from '../../../model/config-client';
import { useDashboardList } from '../../../model/dashboard-client';
import type * as DashboardClient from '../../../model/dashboard-client';
import type * as DatasourceClient from '../../../model/datasource-client';
import { useDatasourceList } from '../../../model/datasource-client';
import { useGlobalDatasourceList } from '../../../model/global-datasource-client';
import type * as GlobalDatasourceClient from '../../../model/global-datasource-client';
import type * as ProjectClient from '../../../model/project-client';
import { useProjectList } from '../../../model/project-client';
import { ALL_RESOURCE_TYPES_TITLES } from './model';
import { SEARCH_BAR_DATA_TEST_ID as TEST_IDS, SearchBar as SearchBarInput } from './SearchBar';
import { DASHBOARD_ITEM_DATA_TEST_IDS } from './SearchDashboardItem';
import { DATASOURCE_TEST_IDS } from './SearchDatasourceItem';
import { GLOBAL_DATASOURCE_RESOURCE_TEST_IDS } from './SearchGlobalDatasourceItem';
import { PROJECT_DATA_TEST_IDS } from './SearchProjectItem';
import {
  DASHBOARDS_RESOURCES,
  DATASOURCE_RESOURCE,
  GLOBAL_DATASOURCE_RESOURCE,
  IMPORTANT_DASHBOARDS_RESOURCES,
  MOCK_CLIENT_CONFIG,
  PROJECT_RESOURCE,
} from './test_mock_data';

vi.mock('../../../context/Authorization', async (importOriginal) => {
  const actual = await importOriginal<typeof Authorization>();
  return { ...actual, useHasPermission: vi.fn() };
});

vi.mock('../../../model/config-client', async (importOriginal) => {
  const actual = await importOriginal<typeof ConfigClient>();
  return { ...actual, useConfig: vi.fn() };
});

vi.mock('../../../model/dashboard-client', async (importOriginal) => {
  const actual = await importOriginal<typeof DashboardClient>();
  return { ...actual, useDashboardList: vi.fn() };
});

vi.mock('../../../model/datasource-client', async (importOriginal) => {
  const actual = await importOriginal<typeof DatasourceClient>();
  return { ...actual, useDatasourceList: vi.fn() };
});

vi.mock('../../../model/global-datasource-client', async (importOriginal) => {
  const actual = await importOriginal<typeof GlobalDatasourceClient>();
  return { ...actual, useGlobalDatasourceList: vi.fn() };
});

vi.mock('../../../model/project-client', async (importOriginal) => {
  const actual = await importOriginal<typeof ProjectClient>();
  return { ...actual, useProjectList: vi.fn() };
});

const SearchBar = (): ReactElement => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigContextProvider>
          <SearchBarInput />
        </ConfigContextProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

// The hooks are always called: a list is only fetched when its hook is called with `enabled: true`.
const expectNeverFetched = (hook: unknown): void => {
  expect(hook).not.toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
};

describe('SearchBar', () => {
  let rerenderSearchBar: () => void;

  beforeEach(() => {
    vi.mocked(useHasPermission).mockReturnValue(true);

    vi.mocked(useConfig).mockReturnValue({ data: MOCK_CLIENT_CONFIG, isLoading: false } as ReturnType<
      typeof useConfig
    >);

    vi.mocked(useDashboardList).mockReturnValue({
      data: DASHBOARDS_RESOURCES,
      isLoading: false,
      isSuccess: true,
    } as ReturnType<typeof useDashboardList>);

    vi.mocked(useDatasourceList).mockReturnValue({
      data: DATASOURCE_RESOURCE,
      isLoading: false,
      isSuccess: true,
    } as ReturnType<typeof useDatasourceList>);

    vi.mocked(useGlobalDatasourceList).mockReturnValue({
      data: GLOBAL_DATASOURCE_RESOURCE,
      isLoading: false,
      isSuccess: true,
      error: null,
    } as ReturnType<typeof useGlobalDatasourceList>);

    vi.mocked(useProjectList).mockReturnValue({
      data: PROJECT_RESOURCE,
      isLoading: false,
      isSuccess: true,
    } as ReturnType<typeof useProjectList>);

    const { rerender } = render(<SearchBar />);
    rerenderSearchBar = (): void => rerender(<SearchBar />);
  });
  describe('search controls', () => {
    test('search controls should be available', () => {
      const searchButton = screen.getByTestId(TEST_IDS.searchButton);
      let textField = screen.queryByTestId(TEST_IDS.searchTextfield);

      expect(searchButton).toBeInTheDocument();
      expect(textField).not.toBeInTheDocument();

      fireEvent.click(searchButton);
      textField = screen.queryByTestId(TEST_IDS.searchTextfield);
      expect(textField).toBeInTheDocument();
    });
  });

  describe('finding dashboard resource', () => {
    const allDashboards: string[] = [];

    DASHBOARDS_RESOURCES.forEach((d) => {
      allDashboards.push(d.metadata.name);
    });

    IMPORTANT_DASHBOARDS_RESOURCES.forEach((d) => {
      allDashboards.push(d.metadata.name);
    });

    allDashboards.forEach((dashboard) => {
      it(`should find ${dashboard} when the input is DASH`, () => {
        const searchButton = screen.getByTestId(TEST_IDS.searchButton);
        fireEvent.click(searchButton);
        const textField = screen.getByRole('textbox');
        fireEvent.change(textField, { target: { value: 'DASH' } });
        const row = screen.getByTestId(`${DASHBOARD_ITEM_DATA_TEST_IDS.dashboardRowName}-${dashboard}`);
        expect(row).toBeInTheDocument();
      });
    });
  });

  describe('finding datasource resource', () => {
    DATASOURCE_RESOURCE.forEach(({ spec: { display } }) => {
      it(`should find ${display!.name} when input is DS`, () => {
        const searchButton = screen.getByTestId(TEST_IDS.searchButton);
        fireEvent.click(searchButton);
        const textField = screen.getByRole('textbox');
        fireEvent.change(textField, { target: { value: 'DS' } });
        const row = screen.getByTestId(`${DATASOURCE_TEST_IDS.dsName}-${display!.name}`);
        expect(row).toBeInTheDocument();
      });
    });
  });

  describe('finding global datasource resource', () => {
    GLOBAL_DATASOURCE_RESOURCE.forEach(({ metadata: { name }, spec: { display } }) => {
      it(`should find ${display?.name || name} when input is GDS`, () => {
        const searchButton = screen.getByTestId(TEST_IDS.searchButton);
        fireEvent.click(searchButton);
        const textField = screen.getByRole('textbox');
        fireEvent.change(textField, { target: { value: 'GDS' } });
        const row = screen.getByTestId(`${GLOBAL_DATASOURCE_RESOURCE_TEST_IDS.dsName}-${display?.name || name}`);
        expect(row).toBeInTheDocument();
      });
    });
  });

  describe('finding project resource', () => {
    PROJECT_RESOURCE.forEach((pr) => {
      it(`should find ${pr.metadata.name} when input is PR`, () => {
        const searchButton = screen.getByTestId(TEST_IDS.searchButton);
        fireEvent.click(searchButton);
        const textField = screen.getByRole('textbox');
        fireEvent.change(textField, { target: { value: 'PR' } });
        const row = screen.getByTestId(`${PROJECT_DATA_TEST_IDS.projectName}-${pr.metadata.name}`);
        expect(row).toBeInTheDocument();
      });
    });
  });

  describe('filtering resources', () => {
    Object.entries(ALL_RESOURCE_TYPES_TITLES).forEach(([_, value]) => {
      it(`should find the ${value} button`, () => {
        const searchButton = screen.getByTestId(TEST_IDS.searchButton);
        fireEvent.click(searchButton);
        const filterButton = screen.getByRole('button', { name: value });
        expect(filterButton).toBeInTheDocument();
      });
    });

    Object.entries(ALL_RESOURCE_TYPES_TITLES).forEach(([_, value]) => {
      it(`should exclude then include ${value}`, async () => {
        const searchButton = screen.getByTestId(TEST_IDS.searchButton);
        fireEvent.click(searchButton);
        const filterButton = screen.getByRole('button', { name: value });
        fireEvent.click(filterButton);
        const textField = screen.getByRole('textbox');

        if (value === 'Dashboards') {
          fireEvent.change(textField, { target: { value: 'DASH' } });
          DASHBOARDS_RESOURCES.forEach((dashboard) => {
            const row = screen.queryByTestId(
              `${DASHBOARD_ITEM_DATA_TEST_IDS.dashboardRowName}-${dashboard.metadata.name}`,
            );
            expect(row).not.toBeInTheDocument();
          });
          fireEvent.click(filterButton);
          DASHBOARDS_RESOURCES.forEach((dashboard) => {
            const row = screen.queryByTestId(
              `${DASHBOARD_ITEM_DATA_TEST_IDS.dashboardRowName}-${dashboard.metadata.name}`,
            );
            expect(row).toBeInTheDocument();
          });
        } else if (value === 'Projects') {
          fireEvent.change(textField, { target: { value: 'PR' } });
          PROJECT_RESOURCE.forEach((pr) => {
            const row = screen.queryByTestId(`${PROJECT_DATA_TEST_IDS.projectName}-${pr.metadata.name}`);
            expect(row).not.toBeInTheDocument();
          });
          fireEvent.click(filterButton);
          PROJECT_RESOURCE.forEach((pr) => {
            const row = screen.queryByTestId(`${PROJECT_DATA_TEST_IDS.projectName}-${pr.metadata.name}`);
            expect(row).toBeInTheDocument();
          });
        } else if (value === 'Datasources') {
          fireEvent.change(textField, { target: { value: 'DS' } });
          DATASOURCE_RESOURCE.forEach((ds) => {
            const row = screen.queryByTestId(
              `${DATASOURCE_TEST_IDS.dsName}-${ds.spec.display?.name || ds.metadata.name}`,
            );
            expect(row).not.toBeInTheDocument();
          });
          fireEvent.click(filterButton);
          DATASOURCE_RESOURCE.forEach((ds) => {
            const row = screen.queryByTestId(
              `${DATASOURCE_TEST_IDS.dsName}-${ds.spec.display?.name || ds.metadata.name}`,
            );
            expect(row).toBeInTheDocument();
          });
        } else if (value === 'Global Datasources') {
          fireEvent.change(textField, { target: { value: 'GDS' } });
          GLOBAL_DATASOURCE_RESOURCE.forEach((gds) => {
            const row = screen.queryByTestId(
              `${GLOBAL_DATASOURCE_RESOURCE_TEST_IDS.dsName}-${gds.spec.display?.name || gds.metadata.name}`,
            );
            expect(row).not.toBeInTheDocument();
          });
          fireEvent.click(filterButton);
          GLOBAL_DATASOURCE_RESOURCE.forEach((gds) => {
            const row = screen.queryByTestId(
              `${GLOBAL_DATASOURCE_RESOURCE_TEST_IDS.dsName}-${gds.spec.display?.name || gds.metadata.name}`,
            );
            expect(row).toBeInTheDocument();
          });
        }
      });
    });
  });

  describe('no records', () => {
    it('should show no records found', () => {
      const searchButton = screen.getByTestId(TEST_IDS.searchButton);
      fireEvent.click(searchButton);
      const textField = screen.getByRole('textbox');
      fireEvent.change(textField, { target: { value: 'XYZ' } });
      const noRecords = screen.getByTestId(TEST_IDS.noRecordContainer);
      expect(noRecords).toBeInTheDocument();
    });

    it('should not show no records found while a list is loading', () => {
      vi.mocked(useProjectList).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as ReturnType<typeof useProjectList>);

      fireEvent.click(screen.getByTestId(TEST_IDS.searchButton));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'XYZ' } });

      expect(screen.queryByTestId(TEST_IDS.noRecordContainer)).not.toBeInTheDocument();
    });
  });

  describe('section title', () => {
    it('should title each section with its resource type and number of results', () => {
      fireEvent.click(screen.getByTestId(TEST_IDS.searchButton));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'GDS' } });

      expect(
        screen.getByRole('heading', { name: `Global Datasources (${GLOBAL_DATASOURCE_RESOURCE.length})` }),
      ).toBeInTheDocument();
    });
  });

  describe('project counts', () => {
    it('should display the number of dashboards and datasources of a project', () => {
      vi.mocked(useProjectList).mockReturnValue({
        data: [{ kind: 'Project', metadata: { name: 'P1' } }],
        isLoading: false,
        isSuccess: true,
      } as ReturnType<typeof useProjectList>);

      fireEvent.click(screen.getByTestId(TEST_IDS.searchButton));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'P1' } });

      expect(screen.getByLabelText('2 dashboards in P1')).toBeInTheDocument();
      expect(screen.getByLabelText('2 datasources in P1')).toBeInTheDocument();
    });

    it('should not fetch dashboards and datasources when only global datasources are searched', () => {
      vi.mocked(useDashboardList).mockClear();
      vi.mocked(useDatasourceList).mockClear();

      fireEvent.click(screen.getByTestId(TEST_IDS.searchButton));
      for (const name of ['Dashboards', 'Projects', 'Datasources']) {
        fireEvent.click(screen.getByRole('button', { name }));
      }
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'GDS' } });

      expect(screen.getByTestId(`${GLOBAL_DATASOURCE_RESOURCE_TEST_IDS.dsName}-GDS1`)).toBeInTheDocument();
      expectNeverFetched(useDashboardList);
      expectNeverFetched(useDatasourceList);
    });
  });

  describe('fetching', () => {
    it('should not fetch anything until a query is typed', () => {
      for (const hook of [useDashboardList, useProjectList, useGlobalDatasourceList, useDatasourceList]) {
        vi.mocked(hook).mockClear();
      }
      rerenderSearchBar();
      fireEvent.click(screen.getByTestId(TEST_IDS.searchButton));

      for (const hook of [useDashboardList, useProjectList, useGlobalDatasourceList, useDatasourceList]) {
        expectNeverFetched(hook);
      }

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'DASH' } });
      expect(useDashboardList).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    });
  });

  describe('error handling', () => {
    it('should display the error instead of "no records found" when a list fails to load', () => {
      vi.mocked(useProjectList).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new UserFriendlyError('internal server error', 500),
      } as ReturnType<typeof useProjectList>);

      fireEvent.click(screen.getByTestId(TEST_IDS.searchButton));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'XYZ' } });

      expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
      expect(screen.getByText('internal server error')).toBeInTheDocument();
      expect(screen.queryByTestId(TEST_IDS.noRecordContainer)).not.toBeInTheDocument();
    });

    it('should display the dashboard error once', () => {
      const error = new UserFriendlyError('database unavailable', 500);
      vi.mocked(useDashboardList).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error,
      } as ReturnType<typeof useDashboardList>);

      fireEvent.click(screen.getByTestId(TEST_IDS.searchButton));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'DASH' } });

      expect(screen.getByText('Failed to load dashboards')).toBeInTheDocument();
      expect(screen.getAllByText('database unavailable')).toHaveLength(1);
    });
  });

  describe('unavailable resources', () => {
    it('should not search global datasources without the global read permission', () => {
      vi.mocked(useHasPermission).mockImplementation((_action, _project, scope) => scope !== 'GlobalDatasource');
      vi.mocked(useGlobalDatasourceList).mockClear();
      rerenderSearchBar();

      fireEvent.click(screen.getByTestId(TEST_IDS.searchButton));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'GDS' } });

      const chip = screen.getByRole('button', { name: 'Global Datasources' });
      expect(chip).toHaveAttribute('aria-disabled', 'true');
      expect(chip).toHaveAccessibleDescription("You don't have permission to read global datasources");
      expectNeverFetched(useGlobalDatasourceList);
    });

    it('should let keyboard users focus an unavailable filter to display its explanation', () => {
      vi.mocked(useHasPermission).mockImplementation((_action, _project, scope) => scope !== 'GlobalDatasource');
      rerenderSearchBar();

      fireEvent.click(screen.getByTestId(TEST_IDS.searchButton));
      const chip = screen.getByRole('button', { name: 'Global Datasources' });

      // The chip must be reachable with the Tab key, not only focusable programmatically.
      expect(chip.tabIndex).toBe(0);
      chip.focus();
      expect(chip).toHaveFocus();
      fireEvent.click(chip);
      expect(chip).toHaveAttribute('aria-pressed', 'false');
    });

    it('should search every available type when none of the selected types is available anymore', () => {
      fireEvent.click(screen.getByTestId(TEST_IDS.searchButton));
      for (const name of ['Dashboards', 'Projects', 'Datasources']) {
        fireEvent.click(screen.getByRole('button', { name }));
      }
      expect(screen.getByRole('button', { name: 'Global Datasources' })).toHaveAttribute('aria-pressed', 'true');

      // The permission to read the global datasources is removed while only them are selected.
      vi.mocked(useHasPermission).mockImplementation((_action, _project, scope) => scope !== 'GlobalDatasource');
      rerenderSearchBar();

      for (const name of ['Dashboards', 'Projects', 'Datasources']) {
        expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
      }
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'DASH' } });
      expect(screen.getByTestId(`${DASHBOARD_ITEM_DATA_TEST_IDS.dashboardRowName}-DASH1`)).toBeInTheDocument();

      // Deselecting a type only deselects this one.
      fireEvent.click(screen.getByRole('button', { name: 'Dashboards' }));
      expect(screen.getByRole('button', { name: 'Dashboards' })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: 'Projects' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Datasources' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('should not search datasources when they are disabled', () => {
      vi.mocked(useConfig).mockReturnValue({
        data: {
          ...MOCK_CLIENT_CONFIG,
          datasource: { ...MOCK_CLIENT_CONFIG.datasource, global: { disable: true }, project: { disable: true } },
        },
        isLoading: false,
      } as ReturnType<typeof useConfig>);
      vi.mocked(useGlobalDatasourceList).mockClear();
      vi.mocked(useDatasourceList).mockClear();
      rerenderSearchBar();

      fireEvent.click(screen.getByTestId(TEST_IDS.searchButton));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'DS' } });

      const globalDatasourcesChip = screen.getByRole('button', { name: 'Global Datasources' });
      const datasourcesChip = screen.getByRole('button', { name: 'Datasources' });
      expect(globalDatasourcesChip).toHaveAttribute('aria-disabled', 'true');
      expect(globalDatasourcesChip).toHaveAccessibleDescription(
        'Global datasources are disabled in the server configuration',
      );
      expect(datasourcesChip).toHaveAttribute('aria-disabled', 'true');
      expect(datasourcesChip).toHaveAccessibleDescription(
        'Project datasources are disabled in the server configuration',
      );
      expectNeverFetched(useGlobalDatasourceList);
      expectNeverFetched(useDatasourceList);
    });
  });
});
