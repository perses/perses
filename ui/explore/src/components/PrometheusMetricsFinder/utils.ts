// Copyright 2024 The Perses Authors
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

import { encodeQueryParams, JsonParam, StringParam } from 'use-query-params';
import queryString from 'query-string';
import { DatasourceSelector } from '@perses-dev/core';
import { useMemo } from 'react';
import {
  LabelNamesRequestParameters,
  LabelValuesRequestParameters,
  LabelValuesResponse,
  Metric,
  MetricMetadata,
  MetricMetadataRequestParameters,
  MetricMetadataResponse,
  PrometheusClient,
  SeriesRequestParameters,
  SeriesResponse,
} from '@perses-dev/prometheus-plugin';
import { useQuery } from '@tanstack/react-query';
import { useDatasourceClient } from '@perses-dev/plugin-system';
import { computeFilterExpr, FinderQueryParams, LabelFilter, LabelValueCounter } from './types';

export function encodeQueryData(data: FinderQueryParams): string {
  return queryString.stringify(
    encodeQueryParams({ explorer: StringParam, data: JsonParam }, { explorer: 'metric', data: { ...data, tab: 2 } })
  );
}

// Retrieve metric metadata from the Prometheus API
export function useMetricMetadata(metricName: string, datasource: DatasourceSelector, enabled?: boolean) {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  const { data, isLoading } = useQuery<MetricMetadataResponse>({
    enabled: !!client && enabled,
    queryKey: ['metricMetadata', metricName], // Not indexed on datasource, assuming a metric metadata should be similar across datasources
    queryFn: async () => {
      const params: MetricMetadataRequestParameters = { metric: metricName };

      return await client!.metricMetadata(params);
    },
  });

  // Find the first result with help text
  const metadata: MetricMetadata | undefined = useMemo(() => {
    for (const metric of data?.data?.[metricName] ?? []) {
      if (metric.help.length > 0) {
        return metric;
      }
    }
    return undefined;
  }, [data, metricName]);

  return { metadata, isLoading };
}

export function useLabels(filters: LabelFilter[], datasource: DatasourceSelector) {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  return useQuery<LabelValuesResponse>({
    enabled: !!client,
    queryKey: ['labels', 'datasource', datasource.name, 'filters', ...filters],
    queryFn: async () => {
      const params: LabelNamesRequestParameters = {};
      if (filters.length) {
        params['match[]'] = [`{${computeFilterExpr(filters)}}`];
      }

      return await client!.labelNames(params);
    },
  });
}

// Retrieve label values from the Prometheus API for a given label name and filters
export function useLabelValues(labelName: string, filters: LabelFilter[], datasource: DatasourceSelector) {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  return useQuery<LabelValuesResponse>({
    enabled: !!client,
    queryKey: ['labelValues', labelName, 'datasource', datasource.name, 'filters', ...filters],
    queryFn: async () => {
      const params: LabelValuesRequestParameters = { labelName: labelName };
      if (filters.length) {
        params['match[]'] = [`{${computeFilterExpr(filters)}}`];
      }

      return await client!.labelValues(params);
    },
  });
}

// Retrieve series from the Prometheus API for a given metric name and filters
// Also computes the number of times a label value appears in a series
export function useSeriesStates(
  metricName: string,
  filters: LabelFilter[],
  datasource: DatasourceSelector
): {
  series: Metric[] | undefined;
  labelValueCounters: Map<string, Array<{ labelValue: string; counter: number }>>;
  isLoading: boolean;
} {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  const { data: seriesData, isLoading } = useQuery<SeriesResponse>({
    enabled: !!client,
    queryKey: ['series', metricName, 'filters', ...filters],
    queryFn: async () => {
      const params: SeriesRequestParameters = { 'match[]': [`{${computeFilterExpr(filters)}}`] };

      return await client!.series(params);
    },
  });

  const labelValueCounters: Map<string, Array<{ labelValue: string; counter: number }>> = useMemo(() => {
    const result = new Map<string, LabelValueCounter[]>();
    if (seriesData?.data === undefined) {
      return result;
    }

    for (const series of seriesData.data) {
      for (const [label, value] of Object.entries(series)) {
        const labelCounters = result.get(label);
        if (labelCounters === undefined) {
          result.set(label, [{ labelValue: value, counter: 1 }]);
          continue;
        }

        const labelValueCounter = labelCounters.find((counter) => counter.labelValue === value);
        if (labelValueCounter === undefined) {
          labelCounters.push({ labelValue: value, counter: 1 });
        } else {
          labelValueCounter.counter += 1;
        }
      }
    }

    return result;
  }, [seriesData]);

  return { series: seriesData?.data, labelValueCounters, isLoading };
}
