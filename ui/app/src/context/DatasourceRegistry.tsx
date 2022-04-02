// Copyright 2021 The Perses Authors
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

import { useCallback, useMemo, useRef } from 'react';
import { fetchJson, GlobalDatasourceResource, DatasourceSelector } from '@perses-dev/core';
import { DatasourcesContext, Datasources, Datasource } from '@perses-dev/plugin-system';
import { parse } from 'jsonref';
import buildURL from '../model/url-builder';

const DEFAULT_DATASOURCE_CACHE_KEY = '__DEFAULT_DATASOURCE__';

export interface DatasourceRegistryProps {
  children: React.ReactNode;
}

/**
 * Makes DataSource resources available to children.
 */
export function DatasourceRegistry(props: DatasourceRegistryProps) {
  const { children } = props;

  const getDatasourceImpl = useCallback(async (selector?: DatasourceSelector): Promise<Datasource> => {
    // For specific datasource refs, use jsonref to resolve/parse the ref
    if (selector !== undefined) {
      // Clone selector because jsonref has a side-effect in parse that modifies the provided object
      selector = { ...selector };
      const datasource: Datasource = await parse(selector, { retriever: fetchJson, scope: window.location.origin });
      return datasource;
    }

    // For the overall global default datasource, fetch the list and find the one marked with "default"
    const resource = 'globaldatasources';
    const url = buildURL({ resource });
    const datasources = await fetchJson<GlobalDatasourceResource[]>(url);
    const defaultDatasource = datasources.find((ds) => ds.spec.default);
    if (defaultDatasource === undefined) {
      throw new Error('No default Datasource is configured');
    }
    return defaultDatasource;
  }, []);

  // Cached values for datasources
  const datasourcePromises = useRef(new Map<string, Promise<Datasource>>());

  // Use the cache when getting Datasources
  const getDatasource: Datasources['getDatasource'] = useCallback(
    (selector?: DatasourceSelector) => {
      // Kick off the fetch if we haven't already done it and it's cached
      const cacheKey = selector?.$ref ?? DEFAULT_DATASOURCE_CACHE_KEY;
      let promise = datasourcePromises.current.get(cacheKey);
      if (promise === undefined) {
        promise = getDatasourceImpl(selector).catch((err) => {
          // Reset the cache but propagate the error if promise fails
          datasourcePromises.current.delete(cacheKey);
          throw err;
        });
        datasourcePromises.current.set(cacheKey, promise);
      }

      return promise;
    },
    [getDatasourceImpl]
  );

  const context = useMemo(() => ({ getDatasource }), [getDatasource]);
  return <DatasourcesContext.Provider value={context}>{children}</DatasourcesContext.Provider>;
}
