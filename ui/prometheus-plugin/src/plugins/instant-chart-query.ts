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

import {
  UseChartQueryHook,
  ChartQueryDefinition,
  useDashboardSpec,
  JsonObject,
} from '@perses-ui/core';
import { useMemo } from 'react';
import { InstantQueryRequestParameters } from '../model/api-types';
import { createDataFrames } from '../model/data-frames';
import { useInstantQuery } from '../model/prometheus-client';
import { TemplateString, useReplaceTemplateString } from '../model/templating';
import { useDashboardPrometheusTimeRange } from '../model/time';

export const PrometheusInstantChartQueryKind =
  'PrometheusInstantChartQuery' as const;

type PrometheusInstantChartQuery = ChartQueryDefinition<
  InstantChartQueryKind,
  InstantChartQueryOptions
>;

type InstantChartQueryKind = typeof PrometheusInstantChartQueryKind;

interface InstantChartQueryOptions extends JsonObject {
  query: TemplateString;
}

export function usePrometheusInstantChartQuery(
  definition: PrometheusInstantChartQuery
): ReturnType<
  UseChartQueryHook<InstantChartQueryKind, InstantChartQueryOptions>
> {
  const spec = useDashboardSpec();
  const dataSource = definition.datasource ?? spec.datasource;

  const { end } = useDashboardPrometheusTimeRange();
  const { result: query, needsVariableValuesFor } = useReplaceTemplateString(
    definition.options.query
  );

  const request: InstantQueryRequestParameters = {
    query,
    time: end,
  };

  const { response, loading, error } = useInstantQuery(dataSource, request, {
    pause: needsVariableValuesFor.size > 0,
  });

  const data = useMemo(() => createDataFrames(response), [response]);
  return { data, loading, error };
}
