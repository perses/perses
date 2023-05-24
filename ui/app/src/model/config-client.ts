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

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { DashboardSelector, fetchJson } from '@perses-dev/core';
import { useMemo } from 'react';
import { marked } from 'marked';
import * as DOMPurify from 'dompurify';
import { useSnackbar } from '@perses-dev/components';
import buildURL from './url-builder';

const resource = 'config';

export interface ConfigSchemasModel {
  panels_path: string;
  queries_path: string;
  datasources_path: string;
  variables_path: string;
  interval: string;
}

export interface ConfigModel {
  readonly: boolean;
  schemas: ConfigSchemasModel;
  important_dashboards: DashboardSelector[];
  information: string;
}

type ConfigOptions = Omit<UseQueryOptions<ConfigModel, Error>, 'queryKey' | 'queryFn'>;

export function useConfig(options?: ConfigOptions) {
  return useQuery<ConfigModel, Error>(
    [resource],
    () => {
      const url = buildURL({ resource: resource, apiPrefix: '/api' });
      return fetchJson<ConfigModel>(url);
    },
    options
  );
}

export function useIsReadonly() {
  const { exceptionSnackbar } = useSnackbar();
  const { data, isLoading } = useConfig({ onError: exceptionSnackbar });
  if (isLoading || data === undefined) {
    return undefined;
  }
  return data.readonly;
}

export function useImportantDashboardSelectors() {
  const { exceptionSnackbar } = useSnackbar();
  const { data, isLoading } = useConfig({ onError: exceptionSnackbar });
  return { data: data?.important_dashboards || [], isLoading: isLoading };
}

export function useInformation() {
  const { exceptionSnackbar } = useSnackbar();
  const { data, isLoading } = useConfig({ onError: exceptionSnackbar });

  const html = useMemo(() => marked.parse(data?.information || '', { gfm: true }), [data?.information]);
  const sanitizedHTML = useMemo(() => DOMPurify.sanitize(html), [html]);

  return { data: sanitizedHTML, isLoading: isLoading };
}
