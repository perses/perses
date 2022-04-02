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
import { DatasourcesContext, Datasources } from '@perses-dev/plugin-system';
import { parse } from 'jsonref';
import buildURL from '../model/url-builder';
import { useSnackbar } from './SnackbarProvider';

export interface DatasourceRegistryProps {
  children: React.ReactNode;
}

/**
 * Makes DataSource resources available to children.
 */
export function DatasourceRegistry(props: DatasourceRegistryProps) {
  const { children } = props;
  const { exceptionSnackbar } = useSnackbar();

  const defaultDatasourcePromise = useRef<Promise<GlobalDatasourceResource> | undefined>(undefined);

  // Callback for fetching the list of Global Datasources and selecting the default one in the list
  const getDefaultDatasource = useCallback(async () => {
    try {
      const resource = 'globaldatasources';
      const url = buildURL({ resource });
      const datasources = await fetchJson<GlobalDatasourceResource[]>(url);
      const defaultDatasource = datasources.find((ds) => ds.spec.default);
      if (defaultDatasource === undefined) {
        throw new Error('No default Datasource is configured');
      }
      return defaultDatasource;
    } catch (err) {
      exceptionSnackbar(err);
      throw err;
    }
  }, [exceptionSnackbar]);

  // Registry for jsonref parsing which basically acts like a cache
  const registry = useRef({});

  const getDatasource: Datasources['getDatasource'] = useCallback(
    (selector?: DatasourceSelector) => {
      if (selector !== undefined) {
        return parse(selector, { retriever: fetchJson, scope: window.location.origin, registry: registry.current });
      }

      // Kick off the fetch for the default if we haven't yet
      if (defaultDatasourcePromise.current === undefined) {
        defaultDatasourcePromise.current = getDefaultDatasource().catch((err) => {
          // If the fetch errors out, reset to allow it to be retried, but still propagate the error
          defaultDatasourcePromise.current = undefined;
          throw err;
        });
      }

      return defaultDatasourcePromise.current;
    },
    [getDefaultDatasource]
  );

  const context = useMemo(() => ({ getDatasource }), [getDatasource]);
  return <DatasourcesContext.Provider value={context}>{children}</DatasourcesContext.Provider>;
}
