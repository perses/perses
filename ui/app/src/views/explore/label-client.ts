// Copyright The Perses Authors
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

import { useDatasourceClient, useTimeRange } from '@perses-dev/plugin-system';
import type { DatasourceSelector } from '@perses-dev/spec';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { LabelCatalog } from './log-selector';

export interface LabelRequestParams {
  start: string;
  end: string;
}

export interface LabelResponse {
  data?: string[];
}

/** The label endpoints of the Loki datasource client. */
export interface LabelClient {
  labels: (params: LabelRequestParams) => Promise<LabelResponse>;
  labelValues: (params: LabelRequestParams & { labelName: string }) => Promise<LabelResponse>;
}

/** Time range of the label requests, following the explorer time range. */
export function useLabelRequestParams(): LabelRequestParams {
  const { absoluteTimeRange } = useTimeRange();
  return useMemo(
    () => ({ start: absoluteTimeRange.start.toISOString(), end: absoluteTimeRange.end.toISOString() }),
    [absoluteTimeRange],
  );
}

function selectLabels(response: LabelResponse): string[] {
  return response.data ?? [];
}

/** Label names of a datasource for the explorer time range. */
export function useLabelNames(
  datasource: DatasourceSelector,
  client: LabelClient | undefined,
  params: LabelRequestParams,
): UseQueryResult<string[], Error> {
  return useQuery<LabelResponse, Error, string[]>({
    queryKey: ['explore-label-names', datasource, params],
    queryFn: () => (client ? client.labels(params) : Promise.reject(new Error('Datasource client is not ready'))),
    enabled: client !== undefined,
    select: selectLabels,
  });
}

/** Values of a label for the explorer time range, fetched when enabled. */
export function useLabelValues(
  datasource: DatasourceSelector,
  client: LabelClient,
  params: LabelRequestParams,
  label: string,
  enabled: boolean,
): UseQueryResult<string[], Error> {
  return useQuery<LabelResponse, Error, string[]>({
    queryKey: ['explore-label-values', datasource, label, params],
    queryFn: () => client.labelValues({ ...params, labelName: label }),
    enabled,
    select: selectLabels,
  });
}

/**
 * Label names of a datasource, and the values of the given labels, as listed by the label explorer. Shares its
 * requests with the label explorer.
 */
export function useLabelCatalog(datasource: DatasourceSelector, labels: string[], enabled: boolean): LabelCatalog {
  const params = useLabelRequestParams();
  const { data: client } = useDatasourceClient<LabelClient>(datasource);
  const activeClient = enabled ? client : undefined;
  const { data: labelNames } = useLabelNames(datasource, activeClient, params);
  const valueResults = useQueries({
    queries: labels.map((label) => ({
      queryKey: ['explore-label-values', datasource, label, params],
      queryFn: (): Promise<LabelResponse> =>
        activeClient
          ? activeClient.labelValues({ ...params, labelName: label })
          : Promise.reject(new Error('Datasource client is not ready')),
      enabled: activeClient !== undefined,
      select: selectLabels,
    })),
  });

  const values: LabelCatalog['values'] = {};
  labels.forEach((label, index) => {
    values[label] = valueResults[index]?.data;
  });
  return { labels: labelNames, values };
}
