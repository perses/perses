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
import { DatasourceStoreProviderProps } from '@perses-dev/dashboards';

export function useDatasourceApi(): DatasourceStoreProviderProps['datasourceApi'] {
  return {
    getDatasource: async (/*project, selector*/) => {
      // TODO: Convert selector to appropriate request params and fetchJson to get it from backend using project
      // argument passed in
      return undefined;
    },
    getGlobalDatasource: async (selector) => {
      // TODO: Convert selector to appropriate request params and fetchJson to get it from backend

      // Just resolve a default PrometheusDatasource right now
      if (
        selector.kind === tempDatasource.spec.plugin.kind &&
        (selector.name === undefined || selector.name === tempDatasource.metadata.name)
      ) {
        return {
          resource: tempDatasource,
          proxyUrl: getProxyUrl(tempDatasource),
        };
      }
      return undefined;
    },

    listDatasources: async (/*project, pluginKind*/) => {
      return [];
    },

    listGlobalDatasources: async (pluginKind) => {
      if (pluginKind === tempDatasource.spec.plugin.kind) {
        return [tempDatasource];
      }
      return [];
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

// Just a temporary datasource while we're working on connecting to a real backend API
const tempDatasource: GlobalDatasource = {
  kind: 'GlobalDatasource',
  metadata: {
    name: 'PrometheusDemo',
    created_at: '',
    updated_at: '',
    version: 0,
  },
  spec: {
    default: true,
    display: {
      name: 'Prometheus Demo',
    },
    plugin: {
      kind: 'PrometheusDatasource',
      spec: {
        direct_url: 'https://prometheus.demo.do.prometheus.io',
      },
    },
  },
};
