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

import { Notice, TimeSeriesData } from '@perses-dev/core';
import { TimeSeriesQueryPlugin } from '@perses-dev/plugin-system';
import { fromUnixTime } from 'date-fns';
import {
  parseValueTuple,
  PrometheusClient,
  getDurationStringSeconds,
  getPrometheusTimeRange,
  getRangeStep,
  DEFAULT_PROM,
} from '../../model';
import { getUniqueKeyForPrometheusResult, replaceTemplateVariables, formatSeriesName } from '../../utils';
import { PrometheusTimeSeriesQuerySpec } from './time-series-query-model';

export const getTimeSeriesData: TimeSeriesQueryPlugin<PrometheusTimeSeriesQuerySpec>['getTimeSeriesData'] = async (
  spec,
  context
) => {
  if (spec.query === undefined || spec.query === null || spec.query === '') {
    // Do not make a request to the backend, instead return an empty TimeSeriesData
    return { series: [] };
  }

  const minStep = getDurationStringSeconds(spec.min_step);
  const timeRange = getPrometheusTimeRange(context.timeRange);
  const step = getRangeStep(timeRange, minStep, undefined, context.suggestedStepMs);

  // Align the time range so that it's a multiple of the step
  let { start, end } = timeRange;
  const utcOffsetSec = new Date().getTimezoneOffset() * 60;

  const alignedEnd = Math.floor((end + utcOffsetSec) / step) * step - utcOffsetSec;
  const alignedStart = Math.floor((start + utcOffsetSec) / step) * step - utcOffsetSec;
  start = alignedStart;
  end = alignedEnd;

  // Replace template variable placeholders in PromQL query
  let query = spec.query.replace('$__rate_interval', `15s`);
  query = replaceTemplateVariables(query, context.variableState);

  // Get the datasource, using the default Prom Datasource if one isn't specified in the query
  const client: PrometheusClient = await context.datasourceStore.getDatasourceClient(spec.datasource ?? DEFAULT_PROM);

  // Make the request to Prom
  const response = await client.rangeQuery({
    query,
    start,
    end,
    step,
  });

  // TODO: What about error responses from Prom that have a response body?
  const result = response.data?.result ?? [];

  // Custom display for response header warnings, configurable error responses display coming next
  const notices: Notice[] = [];
  if (response.status === 'success') {
    const warnings = response.warnings ?? [];
    const warningMessage = warnings[0] ?? '';
    if (warningMessage !== '') {
      notices.push({
        type: 'warning',
        message: warningMessage,
      });
    }
  }

  // Transform response
  const chartData: TimeSeriesData = {
    // Return the time range and step we actually used for the query
    timeRange: { start: fromUnixTime(start), end: fromUnixTime(end) },
    stepMs: step * 1000,

    series: result.map((value) => {
      const { metric, values } = value;

      // Name the series after the metric labels or if no metric, use the query
      let name = getUniqueKeyForPrometheusResult(metric);
      if (name === '') {
        name = query;
      }

      // Query editor allows you to define an optional series_name_format
      // property to customize legend and tooltip display
      const formattedName = spec.series_name_format ? formatSeriesName(spec.series_name_format, metric) : name;

      return {
        name,
        values: values.map(parseValueTuple),
        formattedName,
        labels: metric,
      };
    }),
    metadata: {
      notices,
    },
  };

  return chartData;
};
