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

import { DatasourceResource, DatasourceSelector, GlobalDatasourceResource } from '@perses-dev/core';
import { useCallback } from 'react';
import { useDatasourceList } from './datasource-client';
import { useGlobalDatasourceList } from './global-datasource-client';
import { getBasePathName } from './route';

export type BuildDatasourceProxyUrlParams = {
  project?: string;
  dashboard?: string;
  name: string;
};

export type BuildDatasourceProxyUrlFunc = (p: BuildDatasourceProxyUrlParams) => string;

export interface AppDatasourceApi {
  buildProxyUrl?: BuildDatasourceProxyUrlFunc;
  getDatasource: (project: string, selector: DatasourceSelector) => Promise<DatasourceResource | undefined>;
  getGlobalDatasource: (selector: DatasourceSelector) => Promise<GlobalDatasourceResource | undefined>;
  listDatasources: (project: string, pluginKind?: string) => Promise<DatasourceResource[]>;
  listGlobalDatasources: (pluginKind?: string) => Promise<GlobalDatasourceResource[]>;
  listAllDatasources: () => Array<GlobalDatasourceResource | DatasourceResource>;
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

export function useDatasourceApi(): AppDatasourceApi {
  const { data: globalDatasources, isLoading: isGlobalDatasourcesPending } = useGlobalDatasourceList();
  const { data: datasources, isLoading: isDatasourcesPending } = useDatasourceList({});

  const getDatasource = useCallback(
    async (project: string, selector: DatasourceSelector) => {
      if (isDatasourcesPending || !datasources) {
        return undefined;
      }
      return datasources.find((datasource) => {
        if (datasource.metadata.project !== project) {
          return false;
        }
        if (selector.kind !== datasource.spec.plugin.kind) {
          return false;
        }
        if (!selector.name) {
          return datasource.spec.default;
        }
        return datasource.metadata.name.toLowerCase() === selector.name.toLowerCase();
      });
    },
    [datasources, isDatasourcesPending]
  );

  const getGlobalDatasource = useCallback(
    async (selector: DatasourceSelector) => {
      if (isGlobalDatasourcesPending || !globalDatasources) {
        return undefined;
      }
      return globalDatasources.find((datasource) => {
        if (selector.kind !== datasource.spec.plugin.kind) {
          return false;
        }
        if (!selector.name) {
          return datasource.spec.default;
        }
        return datasource.metadata.name.toLowerCase() === selector.name.toLowerCase();
      });
    },
    [globalDatasources, isGlobalDatasourcesPending]
  );

  const listDatasources = useCallback(
    async (project: string, pluginKind?: string) => {
      if (isDatasourcesPending || !datasources) {
        return [];
      }
      return datasources.filter((datasource) => {
        if (datasource.metadata.project !== project) {
          return false;
        }
        if (pluginKind && datasource.spec.plugin.kind !== pluginKind) {
          return false;
        }
        return true;
      });
    },
    [datasources, isDatasourcesPending]
  );

  const listGlobalDatasources = useCallback(
    async (pluginKind?: string) => {
      if (isGlobalDatasourcesPending || !globalDatasources) {
        return [];
      }
      return globalDatasources.filter((datasource) => {
        if (pluginKind && datasource.spec.plugin.kind !== pluginKind) {
          return false;
        }
        return true;
      });
    },
    [globalDatasources, isGlobalDatasourcesPending]
  );

  const listAllDatasources = useCallback(() => {
    if (isDatasourcesPending || isGlobalDatasourcesPending) {
      return [];
    }
    return [...(datasources || []), ...(globalDatasources || [])];
  }, [datasources, globalDatasources, isDatasourcesPending, isGlobalDatasourcesPending]);

  return {
    getDatasource,
    getGlobalDatasource,
    listDatasources,
    listGlobalDatasources,
    buildProxyUrl: buildProxyUrl,
    listAllDatasources,
  };
}
