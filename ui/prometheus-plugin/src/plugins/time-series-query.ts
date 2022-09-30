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

import { DurationString } from '@perses-dev/core';
import { TimeSeriesData, TimeSeriesQueryPlugin } from '@perses-dev/plugin-system';
import { fromUnixTime } from 'date-fns';
import { RangeQueryRequestParameters } from '../model/api-types';
import { parseValueTuple } from '../model/parse-sample-values';
import {
  PrometheusDatasourceSpec,
  QueryOptions,
  rangeQuery,
  PrometheusDatasourceSelector,
} from '../model/prometheus-client';
import { TemplateString } from '../model/templating';
import { getDurationStringSeconds, getPrometheusTimeRange, getRangeStep } from '../model/time';
import { replaceTemplateVariables } from '../model/utils';

interface PrometheusTimeSeriesQuerySpec {
  query: TemplateString;
  min_step?: DurationString;
  resolution?: number;
  datasource?: PrometheusDatasourceSelector;
}

const getTimeSeriesData: TimeSeriesQueryPlugin<PrometheusTimeSeriesQuerySpec>['getTimeSeriesData'] = async (
  spec,
  context
) => {
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
  const datasourceSelector = spec.datasource ?? { kind: 'PrometheusDatasource' };
  const datasource = await context.datasourceStore.getDatasource(datasourceSelector);
  const queryOptions: QueryOptions = {
    datasource: datasource.plugin.spec as PrometheusDatasourceSpec,
  };

  // Make the request to Prom
  const request: RangeQueryRequestParameters = {
    query,
    start,
    end,
    step,
  };
  const response = await rangeQuery(request, queryOptions);

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

      // Name the series after the metric labels or if no metric, just use the
      // overall query
      let name = Object.entries(metric)
        .map(([labelName, labelValue]) => `${labelName}="${labelValue}"`)
        .join(', ');
      if (name === '') name = query;

      return {
        name,
        values: values.map(parseValueTuple),
      };
    }),
  };
  return chartData;
};

/**
 * The core Prometheus TimeSeriesQuery plugin for Perses.
 */
export const PrometheusTimeSeriesQuery: TimeSeriesQueryPlugin<PrometheusTimeSeriesQuerySpec> = {
  getTimeSeriesData,
};
