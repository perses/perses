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

import { isEmptyObject, VariableValue } from '@perses-dev/core';
import { VariableStateMap } from '@perses-dev/plugin-system';
import { Metric } from '../model/api-types';

export function replaceTemplateVariables(text: string, variableState: VariableStateMap): string {
  const variables = parseTemplateVariables(text);
  let finalText = text;
  variables.forEach((v) => {
    const variable = variableState[v];
    if (variable && variable?.value) {
      finalText = replaceTemplateVariable(finalText, v, variable?.value);
    }
  });

  return finalText;
}

export function replaceTemplateVariable(text: string, varName: string, templateVariableValue: VariableValue) {
  const variableTemplate = '$' + varName;
  let replaceString = '';
  if (Array.isArray(templateVariableValue)) {
    replaceString = `(${templateVariableValue.join('|')})`; // regex style
  }
  if (typeof templateVariableValue === 'string') {
    replaceString = templateVariableValue;
  }

  return text.replaceAll(variableTemplate, replaceString);
}

// TODO: Fix this lint error
// eslint-disable-next-line no-useless-escape
const TEMPLATE_VARIABLE_REGEX = /\$(\w+)|\${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}/gm;

/**
 * Returns a list of template variables
 */
export const parseTemplateVariables = (text: string) => {
  const regex = TEMPLATE_VARIABLE_REGEX;
  const matches = new Set<string>();
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match && match.length > 1 && match[1]) {
      matches.add(match[1]);
    }
  }
  // return unique matches
  return Array.from(matches.values());
};

/**
 * Types for metric labels, used in series_name_format implementation
 */
export type SeriesLabels = Record<string, string>;

/*
 * Formatter used for series name display in legends and tooltips.
 * Regex replaces label {{ name }} with resolved label value.
 * If no resolved value, return empty string instead of the token inside double curly braces.
 */
export function formatSeriesName(inputFormat: string, seriesLabels: SeriesLabels): string {
  const resolveLabelsRegex = /\{\{\s*(.+?)\s*\}\}/g;
  return inputFormat.replace(resolveLabelsRegex, (_match, g1) => {
    if (seriesLabels[g1]) {
      return seriesLabels[g1] ?? '';
    }
    return '';
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
 * Metric labels formattter which checks for __name__ and outputs valid PromQL for series name
 */
export function getUniqueKeyForPrometheusResult(
  metricLabels: {
    [key: string]: string;
  },
  { removeExprWrap }: { removeExprWrap?: boolean } = {}
) {
  const metricNameKey = '__name__';
  if (metricLabels) {
    if (Object.prototype.hasOwnProperty.call(metricLabels, metricNameKey)) {
      const stringifiedLabels = stringifyPrometheusMetricLabels(
        {
          ...metricLabels,
          [metricNameKey]: undefined,
        },
        removeExprWrap
      );
      if (removeExprWrap === true) {
        return `${stringifiedLabels}`;
      } else {
        return `${metricLabels[metricNameKey]}${stringifiedLabels}`;
      }
    }
    return stringifyPrometheusMetricLabels(metricLabels, removeExprWrap);
  }
  return '';
}

/*
 * Determine human-readable series name to be used in legend and tooltip
 */
export function getFormattedPrometheusSeriesName(query: string, metric: Metric, formatter?: string) {
  // Name the series after the metric labels by default.
  // Use the query if no metric or metric labels are empty.
  let name = getUniqueKeyForPrometheusResult(metric);
  if (name === '' || isEmptyObject(metric)) {
    name = query;
  }

  // Query editor allows you to define an optional series_name_format property.
  // This controls the regex used to customize legend and tooltip display.
  const formattedName = formatter ? formatSeriesName(formatter, metric) : name;
  return { name, formattedName };
}
