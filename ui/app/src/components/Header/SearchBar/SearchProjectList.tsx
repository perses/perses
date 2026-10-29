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

import { useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';

import { useDashboardList } from '../../../model/dashboard-client';
import { useDatasourceList } from '../../../model/datasource-client';
import { useProjectList } from '../../../model/project-client';
import type { ResourceListProps } from './model';
import { SearchList } from './SearchList';

function countByProject(resources: Array<{ metadata: { project: string } }> | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { metadata } of resources ?? []) {
    counts.set(metadata.project, (counts.get(metadata.project) ?? 0) + 1);
  }
  return counts;
}

export function SearchProjectList(props: ResourceListProps): ReactElement | null {
  const projectsQueryResult = useProjectList({ refetchOnMount: false });
  // Dashboards and datasources are only needed to display the counts next to each project.
  const { data: dashboardList } = useDashboardList({ metadataOnly: true, staleTime: Infinity });
  const { data: datasourceList } = useDatasourceList({ staleTime: Infinity });
  const dashboardCounts = useMemo(() => countByProject(dashboardList), [dashboardList]);
  const datasourceCounts = useMemo(() => countByProject(datasourceList), [datasourceList]);
  const { query, handleClose, isResources } = props;
  const handleIsResource = useCallback(
    (isAvailable: boolean): void => isResources?.('projects', isAvailable),
    [isResources],
  );

  return (
    <SearchList
      list={projectsQueryResult.data ?? []}
      query={query}
      handleClose={handleClose}
      isResource={handleIsResource}
      dashboardCounts={dashboardCounts}
      datasourceCounts={datasourceCounts}
    />
  );
}
