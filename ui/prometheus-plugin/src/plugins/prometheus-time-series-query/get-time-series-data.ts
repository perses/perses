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

import { TimeSeriesData, TimeSeriesQueryPlugin } from '@perses-dev/plugin-system';
import { fromUnixTime } from 'date-fns';
import {
  parseValueTuple,
  PrometheusClient,
  getDurationStringSeconds,
  getPrometheusTimeRange,
  getRangeStep,
  getUniqueKeyForPrometheusResult,
  replaceTemplateVariables,
  DEFAULT_PROM,
  formatSeriesName,
} from '../../model';
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

  // Transform response
  const chartData: TimeSeriesData = {
    // Return the time range and step we actually used for the query
    timeRange: { start: fromUnixTime(start), end: fromUnixTime(end) },
    stepMs: step * 1000,

    // TODO: Maybe do a proper Iterable implementation that defers some of this
    // processing until its needed
    series: result.map((value) => {
      const { metric, values } = value;

      let name = getUniqueKeyForPrometheusResult(metric, false);
      if (name === '') {
        name = query;
      }

      // query editor allows you to define an optional series_name_format
      // property to customize legend and tooltip display
      const formattedName = spec.series_name_format ? formatSeriesName(spec.series_name_format, metric) : name;

      return {
        name,
        values: values.map(parseValueTuple),
        formattedName,
      };
    }),
  };

  return chartData;
};
