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
import { GenericDatasourceResource } from '@perses-dev/core';
import { useDatasourceList } from './datasource-client';
import { useGlobalDatasourceList } from './global-datasource-client';
import { getBasePathName } from './route';

interface DataSourceFilter {
  project?: string;
}

export function buildProxyUrl({
  project,
  dashboard,
  name,
}: {
  project?: string;
  dashboard?: string;
  name: string;
}): string {
  const basePath = getBasePathName();
  let url = `${!project && !dashboard ? 'globaldatasources' : 'datasources'}/${encodeURIComponent(name)}`;
  if (dashboard) {
    url = `dashboards/${encodeURIComponent(dashboard)}/${url}`;
  }
  if (project) {
    url = `projects/${encodeURIComponent(project)}/${url}`;
  }
  return `${basePath}/proxy/${url}`;
}

/**
 * Retrieves and returns all global and projects datasource resources. An option filter param can be passed
 * to filter the projects datasources
 * @param filter Filters the project datasources
 */
export const useAllDatasourceResources = (filter?: DataSourceFilter): GenericDatasourceResource[] => {
  const { project } = filter || {};

  const { data: datasources, isLoading: isDatasourceLoading, error: datasourceError } = useDatasourceList({ project });
  const {
    data: globalDatasources,
    isLoading: isGlobalDatasourceLoading,
    error: globalDatasourceError,
  } = useGlobalDatasourceList();

  if (globalDatasourceError || datasourceError) {
    throw new Error('Could not fetch all datasources');
  }

  const allDatasources = useMemo(() => {
    if (isDatasourceLoading || isGlobalDatasourceLoading) return [];
    return [...(datasources || []), ...(globalDatasources || [])];
  }, [datasources, globalDatasources, isDatasourceLoading, isGlobalDatasourceLoading]);

  return allDatasources as GenericDatasourceResource[];
};
