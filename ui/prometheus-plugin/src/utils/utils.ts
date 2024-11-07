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

import { replaceVariable } from '@perses-dev/plugin-system';
import { formatDuration, msToPrometheusDuration } from '@perses-dev/core';
import { Metric } from '../model/api-types';

/**
 * Types for metric labels, used in seriesNameFormat implementation
 */
export type SeriesLabels = Record<string, string>;

/*
 * Formatter used for series name display in legends and tooltips.
 * Regex replaces label {{ name }} with resolved label value.
 * If no resolved value, return empty string instead of the token inside double curly braces.
 */
export function formatSeriesName(inputFormat: string, seriesLabels: SeriesLabels): string {
  const resolveLabelsRegex = /\{\{\s*(.+?)\s*\}\}/g;
  return inputFormat.replace(resolveLabelsRegex, (_match, token) => {
    const resolvedValue = seriesLabels[token] ?? '';
    return resolvedValue;
  });
}

/*
 * Stringifies object of labels into valid PromQL for querying metric by label
 */
function stringifyPrometheusMetricLabels(labels: { [key: string]: unknown }, removeExprWrap?: boolean) {
  const labelStrings: string[] = [];
  Object.keys(labels)
    .sort()
    .forEach((labelName) => {
      const labelValue = labels[labelName];
      if (labelValue !== undefined) {
        if (removeExprWrap) {
          labelStrings.push(`"${labelName}":"${labelValue}"`);
        } else {
          labelStrings.push(`${labelName}="${labelValue}"`);
        }
      }
    });
  return `{${labelStrings.join(',')}}`;
}

/*
 * Metric labels formatter which checks for __name__ and outputs valid PromQL for series name
 */
export function getUniqueKeyForPrometheusResult(
  metricLabels: {
    [key: string]: string;
  },
  { removeExprWrap }: { removeExprWrap?: boolean } = {}
) {
  const metricNameKey = '__name__';
  if (Object.prototype.hasOwnProperty.call(metricLabels, metricNameKey)) {
    const stringifiedLabels = stringifyPrometheusMetricLabels(
      {
        ...metricLabels,
        [metricNameKey]: undefined,
      },
      removeExprWrap
    );
    if (removeExprWrap) {
      return `${stringifiedLabels}`;
    } else {
      return `${metricLabels[metricNameKey]}${stringifiedLabels}`;
    }
  }
  return stringifyPrometheusMetricLabels(metricLabels, removeExprWrap);
}

/*
 * Determine human-readable series name to be used in legend and tooltip
 */
export function getFormattedPrometheusSeriesName(query: string, metric: Metric, formatter?: string) {
  // Name the series after the metric labels by default.
  const name = getUniqueKeyForPrometheusResult(metric);

  // Query editor allows you to define an optional seriesNameFormat property.
  // This controls the regex used to customize legend and tooltip display.
  const formattedName = formatter ? formatSeriesName(formatter, metric) : name;
  return { name, formattedName };
}

/*
 * Replace variable placeholders in a PromQL query

 * @param query The base promQL expression that contains variable placeholders
 * @param minStepMs the lower bound of the interval between data points, in milliseconds
 * @param intervalMs the actual interval between data points, in milliseconds
 * 
 * @returns a PromQL expression with variable placeholders replaced by their values
 */
export function replacePromBuiltinVariables(query: string, minStepMs: number, intervalMs: number): string {
  let updatedQuery = replaceVariable(query, '__interval_ms', intervalMs.toString());
  updatedQuery = replaceVariable(updatedQuery, '__interval', formatDuration(msToPrometheusDuration(intervalMs)));

  // The $__rate_interval variable is meant to be used with the rate() promQL function.
  // It is defined as max($__interval + Min step, 4 * Min step)
  const rateIntervalMs = Math.max(intervalMs + minStepMs, 4 * minStepMs);
  updatedQuery = replaceVariable(
    updatedQuery,
    '__rate_interval',
    formatDuration(msToPrometheusDuration(rateIntervalMs))
  );

  return updatedQuery;
}
