// Copyright 2025 The Perses Authors
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

import { useDatasourceClient } from '@perses-dev/plugin-system';
import { DatasourceSelector, StatusError } from '@perses-dev/core';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  InstantQueryRequestParameters,
  MonitoredInstantQueryResponse,
  ParseQueryRequestParameters,
  ParseQueryResponse,
  PrometheusClient,
} from '../model';

export function useParseQuery(
  content: string,
  datasource: DatasourceSelector,
  enabled?: boolean
): UseQueryResult<ParseQueryResponse, StatusError> {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  return useQuery<ParseQueryResponse, StatusError>({
    enabled: !!client && enabled,
    queryKey: ['parseQuery', content, 'datasource', datasource],
    queryFn: async () => {
      const params: ParseQueryRequestParameters = { query: content };

      return await client!.parseQuery(params);
    },
  });
}

export function useInstantQuery(
  content: string,
  datasource: DatasourceSelector,
  enabled?: boolean
): UseQueryResult<MonitoredInstantQueryResponse, StatusError> {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  return useQuery<MonitoredInstantQueryResponse, StatusError>({
    enabled: !!client && enabled,
    // TODO: for some reason the caching is not working: identical nodes still fire their requests after each change made to the promQL
    queryKey: ['instantQuery', content, 'datasource', datasource.kind],
    queryFn: async () => {
      const params: InstantQueryRequestParameters = { query: content };
      const startTime = performance.now();
      const response = await client!.instantQuery(params);
      const responseTime = performance.now() - startTime;

      return { ...response, responseTime };
    },
  });
}
