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

import { Alert, Box } from '@mui/material';
import type { Resource } from '@perses-dev/client';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import { useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';

import { useDashboardList, useImportantDashboardList } from '../../../model/dashboard-client';
import type { ResourceListProps } from './model';
import { SearchList } from './SearchList';

export function SearchDashboardList(props: ResourceListProps): ReactElement | null {
  const {
    data: dashboardList,
    isLoading: dashboardListLoading,
    error: dashboardListError,
  } = useDashboardList({
    metadataOnly: true,
    refetchOnMount: false,
  });
  const {
    data: importantDashboards,
    isLoading: importantDashboardsLoading,
    error: importantDashboardsError,
  } = useImportantDashboardList();

  const { query, isResources, onClick } = props;
  const handleIsResource = useCallback(
    (isAvailable: boolean): void => isResources?.('dashboards', isAvailable),
    [isResources],
  );

  const list: Array<Resource & { highlight: boolean }> = useMemo(() => {
    if (query.length && dashboardList) {
      const importantDashboardKeys = new Set(
        importantDashboards.map(
          (importantDashboard) => `${importantDashboard.metadata.project}/${importantDashboard.metadata.name}`,
        ),
      );
      return dashboardList.map((d) => {
        const highlight = importantDashboardKeys.has(`${d.metadata.project}/${d.metadata.name}`);
        return { ...d, highlight };
      });
    } else {
      return importantDashboards.map((imp) => ({ ...imp, highlight: true }));
    }
  }, [importantDashboards, dashboardList, query]);

  if (dashboardListError || importantDashboardsError)
    return (
      <Box sx={{ margin: 1 }}>
        <Alert severity="error">
          <p>Failed to load dashboards! Error:</p>
          {importantDashboardsError?.message && <p>{importantDashboardsError.message}</p>}
          {dashboardListError?.message && <p>{dashboardListError.message}</p>}
        </Alert>
      </Box>
    );

  return dashboardListLoading || importantDashboardsLoading ? null : (
    <SearchList
      list={list}
      query={query}
      onClick={onClick}
      icon={ViewDashboardIcon}
      chip={true}
      isResource={handleIsResource}
    />
  );
}
