// Copyright 2023 The Perses Authors
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

import { useMemo } from 'react';
import {
  DashboardResource,
  DatasourceResource,
  EphemeralDashboardResource,
  GenericDatasourceResource,
  GenericMetadata,
  GlobalDatasourceResource,
} from '@perses-dev/core';
import { useDatasourceList } from './datasource-client';
import { useGlobalDatasourceList } from './global-datasource-client';
import { getBasePathName } from './route';
import { useDashboard } from './dashboard-client';
import { useEphemeralDashboard } from './ephemeral-dashboard-client';

interface DataSourceFilter {
  project?: string;
  dashboard?: string;
}

interface ProxyBuilderParam {
  project?: string;
  dashboard?: string;
  name: string;
}

export interface AllDatasources {
  datasources: GenericDatasourceResource[];
  isLoading: boolean;
}

export const buildProxyUrl = ({ project, dashboard, name }: ProxyBuilderParam): string => {
  const basePath = getBasePathName();
  let url = `${!project && !dashboard ? 'globaldatasources' : 'datasources'}/${encodeURIComponent(name)}`;
  if (dashboard) {
    url = `dashboards/${encodeURIComponent(dashboard)}/${url}`;
  }
  if (project) {
    url = `projects/${encodeURIComponent(project)}/${url}`;
  }
  return `${basePath}/proxy/${url}`;
};

/**
 * Retrieves and returns all global and projects datasource resources. An option filter param can be passed
 * to filter the projects datasources
 * @param filter Filters the project datasources
 */
export const useAllDatasourceResources = (filter?: DataSourceFilter): AllDatasources => {
  const { project, dashboard } = filter || {};

  const { data: datasources, isLoading: isDatasourceLoading, error: datasourceError } = useDatasourceList({ project });
  const {
    data: globalDatasources,
    isLoading: isGlobalDatasourceLoading,
    error: globalDatasourceError,
  } = useGlobalDatasourceList();

  const {
    data: dashboardResource,
    isLoading: isDashboardRecourseLoading,
    error: dashboardResourceError,
  } = useDashboard(project || '', dashboard || '');

  const {
    data: ephemeralResource,
    isLoading: isEphemeralLoading,
    error: ephemeralError,
  } = useEphemeralDashboard(project || '', dashboard || '');

  /*
    It is likely that for a combination of input filters either of 401, 403, and 404 is thrown. Remember this hook is TRYING to get all datasources.
    Therefore, these exception are expected, and should not stop the process. 
  */
  const anyError = [datasourceError, globalDatasourceError, dashboardResourceError, ephemeralError]
    .filter((err) => err)
    .map((err) => err?.status)
    .filter((status) => status && ![401, 403, 404].includes(status))
    .some((status) => status && status >= 400);
  if (anyError) throw new Error('Critical error occurred while fetching datasource resources');

  const allDatasources = useMemo((): AllDatasources => {
    if (isGlobalDatasourceLoading || isDashboardRecourseLoading || isEphemeralLoading || isDatasourceLoading) {
      return { isLoading: true, datasources: [] };
    }

    const processGlobalDatasources = (globalDatasources: GlobalDatasourceResource[]): GenericDatasourceResource[] => {
      return (globalDatasources || []).map<GenericDatasourceResource>((gds) => ({
        ...(gds as GenericDatasourceResource),
        spec: { ...gds.spec, proxyUrl: buildProxyUrl({ name: gds.metadata.name }) },
      }));
    };

    const processProjectDatasources = (datasources: DatasourceResource[]): GenericDatasourceResource[] => {
      return (datasources || []).map<GenericDatasourceResource>((ds) => ({
        ...ds,
        spec: { ...ds.spec, proxyUrl: buildProxyUrl({ name: ds.metadata.name, project: ds.metadata.project }) },
        metadata: {
          ...ds.metadata,
          project: ds.metadata.project,
        } as unknown as GenericMetadata,
      }));
    };

    const processDashboardDatasources = (
      dashboardResource?: DashboardResource,
      ephemeralResource?: EphemeralDashboardResource
    ): GenericDatasourceResource[] => {
      const allDashboardDatasources = [
        ...Object.entries(dashboardResource?.spec?.datasources || []).map<GenericDatasourceResource>(
          ([name, spec]) =>
            ({
              kind: 'Dashboard',
              metadata: { name },
              spec,
            }) as GenericDatasourceResource
        ),
        ...Object.entries(ephemeralResource?.spec?.datasources || []).map<GenericDatasourceResource>(
          ([name, spec]) =>
            ({
              kind: 'Dashboard',
              metadata: { name },
              spec,
            }) as GenericDatasourceResource
        ),
      ];

      return allDashboardDatasources;
    };

    return {
      isLoading: false,
      datasources: [
        ...processGlobalDatasources(globalDatasources || []),
        ...processProjectDatasources(datasources || []),
        ...processDashboardDatasources(dashboardResource, ephemeralResource),
      ],
    };
  }, [
    datasources,
    isDatasourceLoading,
    globalDatasources,
    isGlobalDatasourceLoading,
    dashboardResource,
    isDashboardRecourseLoading,
    ephemeralResource,
    isEphemeralLoading,
  ]);

  return allDatasources;
};
