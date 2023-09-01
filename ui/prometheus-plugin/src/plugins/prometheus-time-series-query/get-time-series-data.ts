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

import {
  DatasourceSpec,
  formatDuration,
  msToPrometheusDuration,
  Notice,
  parseDurationString,
  TimeSeriesData,
} from '@perses-dev/core';
import { TimeSeriesQueryPlugin, replaceTemplateVariables, replaceTemplateVariable } from '@perses-dev/plugin-system';
import { fromUnixTime, milliseconds } from 'date-fns';
import {
  parseValueTuple,
  PrometheusClient,
  getDurationStringSeconds,
  getPrometheusTimeRange,
  getRangeStep,
  DEFAULT_PROM,
} from '../../model';
import { getFormattedPrometheusSeriesName } from '../../utils';
import { DEFAULT_SCRAPE_INTERVAL, PrometheusDatasourceSpec } from '../PrometheusDatasourceEditor';
import { PrometheusTimeSeriesQuerySpec } from './time-series-query-model';

export const getTimeSeriesData: TimeSeriesQueryPlugin<PrometheusTimeSeriesQuerySpec>['getTimeSeriesData'] = async (
  spec,
  context
) => {
  if (spec.query === undefined || spec.query === null || spec.query === '') {
    // Do not make a request to the backend, instead return an empty TimeSeriesData
    return { series: [] };
  }

  const datasource = (await context.datasourceStore.getDatasource(
    spec.datasource ?? DEFAULT_PROM
  )) as DatasourceSpec<PrometheusDatasourceSpec>;
  const datasourceScrapeInterval = Math.trunc(
    milliseconds(parseDurationString(datasource.plugin.spec.scrape_interval ?? DEFAULT_SCRAPE_INTERVAL)) / 1000
  );

  const minStep = getDurationStringSeconds(spec.min_step) ?? datasourceScrapeInterval;
  const timeRange = getPrometheusTimeRange(context.timeRange);
  const step = getRangeStep(timeRange, minStep, undefined, context.suggestedStepMs); // TODO: resolution

  // Align the time range so that it's a multiple of the step
  let { start, end } = timeRange;
  const utcOffsetSec = new Date().getTimezoneOffset() * 60;

  const alignedEnd = Math.floor((end + utcOffsetSec) / step) * step - utcOffsetSec;
  const alignedStart = Math.floor((start + utcOffsetSec) / step) * step - utcOffsetSec;
  start = alignedStart;
  end = alignedEnd;

  // Replace template variable placeholders in PromQL query
  const intervalMs = context.suggestedStepMs ?? step * 1000; // Step is in seconds
  let query = replaceTemplateVariable(spec.query, '__interval_ms', intervalMs.toString());
  query = replaceTemplateVariable(spec.query, '__interval', formatDuration(msToPrometheusDuration(intervalMs)));

  const scrapeIntervalMs = minStep * 1000;
  // The $__rate_interval variable is meant to be used in the rate function.
  // It is defined as max($__interval + Scrape interval, 4 * Scrape interval), where Scrape interval is the Min step setting (a setting per PromQL query),
  // if any is set, and otherwise the Scrape interval as set in the Prometheus datasource
  const rateIntervalMs = Math.max(intervalMs + scrapeIntervalMs, 4 * scrapeIntervalMs);
  query = replaceTemplateVariable(query, '__rate_interval', formatDuration(msToPrometheusDuration(rateIntervalMs)));
  query = replaceTemplateVariables(query, context.variableState);

  let seriesNameFormat = spec.series_name_format;
  // if series name format is defined, replace template variable placeholders in series name format
  if (seriesNameFormat) {
    seriesNameFormat = replaceTemplateVariables(seriesNameFormat, context.variableState);
  }

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

      // Account for series_name_format from query editor when determining name to show in legend, tooltip, etc.
      const { name, formattedName } = getFormattedPrometheusSeriesName(query, metric, seriesNameFormat);

      return {
        name,
        values: values.map(parseValueTuple),
        formattedName,
        labels: metric,
      };
    }),
    metadata: {
      notices,
      executedQueryString: query,
    },
  };

  return chartData;
};
