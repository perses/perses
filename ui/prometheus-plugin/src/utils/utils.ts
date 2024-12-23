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
function stringifyPrometheusMetricLabels(labels: { [key: string]: unknown }, removeExprWrap?: boolean): string {
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
): string {
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
export function getFormattedPrometheusSeriesName(
  query: string,
  metric: Metric,
  formatter?: string
): {
  name: string;
  formattedName: string;
} {
  // Name the series after the metric labels by default.
  const name = getUniqueKeyForPrometheusResult(metric);

  // Query editor allows you to define an optional seriesNameFormat property.
  // This controls the regex used to customize legend and tooltip display.
  const formattedName = formatter ? formatSeriesName(formatter, metric) : name;
  return { name, formattedName };
}
