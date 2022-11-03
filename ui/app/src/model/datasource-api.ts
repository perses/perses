// Copyright 2022 The Perses Authors
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

import { Datasource, GlobalDatasource } from '@perses-dev/core';
import { DatasourceApi } from '@perses-dev/dashboards';
import { fetchDatasourceList, fetchGlobalDatasourceList } from './datasource-client';

export function useDatasourceApi(): DatasourceApi {
  return {
    getDatasource: async (project, selector) => {
      return fetchDatasourceList(project, selector.kind, selector.name ? undefined : true, selector.name).then(
        (list) => {
          // hopefully it should return at most one element even
          if (list.length > 0 && list[0] !== undefined) {
            return {
              resource: list[0],
              proxyUrl: getProxyUrl(list[0]),
            };
          }
        }
      );
    },
    getGlobalDatasource: async (selector) => {
      return fetchGlobalDatasourceList(selector.kind, selector.name ? undefined : true, selector.name).then((list) => {
        // hopefully it should return at most one element even
        if (list.length > 0 && list[0] !== undefined) {
          return {
            resource: list[0],
            proxyUrl: getProxyUrl(list[0]),
          };
        }
      });
    },

    listDatasources: async (project, pluginKind) => {
      return fetchDatasourceList(project, pluginKind);
    },

    listGlobalDatasources: async (pluginKind) => {
      return fetchGlobalDatasourceList(pluginKind);
    },
  };
}

// Helper function for getting a proxy URL from a datasource or global datasource
function getProxyUrl(datasource: Datasource | GlobalDatasource) {
  let url = `/proxy`;
  if (datasource.kind === 'Datasource') {
    url += `/projects/${encodeURIComponent(datasource.metadata.project)}`;
  }
  url += `/${datasource.kind.toLowerCase()}s/${encodeURIComponent(datasource.metadata.name)}`;
  return url;
}
