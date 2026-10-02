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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { ConfigContextProvider } from '../../../context/Config';
import { useConfig } from '../../../model/config-client';
import type * as ConfigClient from '../../../model/config-client';
import { useDashboardList, useImportantDashboardList } from '../../../model/dashboard-client';
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

vi.mock('../../../model/config-client', async (importOriginal) => {
  const actual = await importOriginal<typeof ConfigClient>();
  return { ...actual, useConfig: vi.fn() };
});

vi.mock('../../../model/dashboard-client', async (importOriginal) => {
  const actual = await importOriginal<typeof DashboardClient>();
  return { ...actual, useDashboardList: vi.fn(), useImportantDashboardList: vi.fn() };
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

describe('SearchBar', () => {
  beforeEach(() => {
    vi.mocked(useConfig).mockReturnValue({ data: MOCK_CLIENT_CONFIG, isLoading: false } as ReturnType<
      typeof useConfig
    >);

    vi.mocked(useDashboardList).mockReturnValue({
      data: DASHBOARDS_RESOURCES,
      isLoading: false,
      isSuccess: true,
    } as ReturnType<typeof useDashboardList>);

    vi.mocked(useImportantDashboardList).mockReturnValue({
      data: IMPORTANT_DASHBOARDS_RESOURCES,
      isLoading: false,
      isSuccess: true,
      error: null,
    } as ReturnType<typeof useImportantDashboardList>);

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

    render(<SearchBar />);
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
    GLOBAL_DATASOURCE_RESOURCE.forEach(({ spec: { display } }) => {
      it(`should find ${display!.name} when input is GDS`, () => {
        const searchButton = screen.getByTestId(TEST_IDS.searchButton);
        fireEvent.click(searchButton);
        const textField = screen.getByRole('textbox');
        fireEvent.change(textField, { target: { value: 'GDS' } });
        const row = screen.getByTestId(`${GLOBAL_DATASOURCE_RESOURCE_TEST_IDS.dsName}-${display!.name}`);
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
            const row = screen.queryByTestId(`${DATASOURCE_TEST_IDS.dsName}-${ds.spec.display!.name}`);
            expect(row).not.toBeInTheDocument();
          });
          fireEvent.click(filterButton);
          DATASOURCE_RESOURCE.forEach((ds) => {
            const row = screen.queryByTestId(`${DATASOURCE_TEST_IDS.dsName}-${ds.spec.display!.name}`);
            expect(row).toBeInTheDocument();
          });
        } else if (value === 'Global Datasources') {
          fireEvent.change(textField, { target: { value: 'GDS' } });
          GLOBAL_DATASOURCE_RESOURCE.forEach((gds) => {
            const row = screen.queryByTestId(`${GLOBAL_DATASOURCE_RESOURCE_TEST_IDS.dsName}-${gds.spec.display!.name}`);
            expect(row).not.toBeInTheDocument();
          });
          fireEvent.click(filterButton);
          GLOBAL_DATASOURCE_RESOURCE.forEach((ds) => {
            const row = screen.queryByTestId(`${GLOBAL_DATASOURCE_RESOURCE_TEST_IDS.dsName}-${ds.spec.display!.name}`);
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
  });
});
