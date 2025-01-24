// Copyright 2024 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain TQueryFnData extends any = unknownany = unknown at
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
  InstantQueryResponse,
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

// TODO replace setter by return val
export function useInstantQuery(
  content: string,
  datasource: DatasourceSelector,
  enabled?: boolean,
  recordResponseTime?: (time: number) => void
): UseQueryResult<InstantQueryResponse, StatusError> {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  return useQuery<InstantQueryResponse, StatusError>({
    enabled: !!client && enabled,
    queryKey: ['instantQuery', content, 'datasource', datasource],
    queryFn: async () => {
      const params: InstantQueryRequestParameters = { query: content };
      const startTime = performance.now();
      const response = await client!.instantQuery(params);
      recordResponseTime && recordResponseTime(performance.now() - startTime);
      return response;
    },
  });
}
