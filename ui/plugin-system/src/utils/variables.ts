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

import { VariableValue } from '@perses-dev/core';
import { VariableStateMap } from '@perses-dev/plugin-system';

export function replaceVariables(text: string, variableState: VariableStateMap): string {
  const variablesMap = parseVariablesAndFormat(text);
  const variables = Array.from(variablesMap.keys());
  let finalText = text;
  variables
    // Sorting variables by their length.
    // In order to not have a variable name have contained in another variable name.
    // i.e.: $__range replacing $__range_ms => '3600_ms' instead of '3600000'
    .sort((a, b) => b.length - a.length)
    .forEach((v) => {
      const variable = variableState[v];
      if (variable && variable.value !== undefined) {
        finalText = replaceVariable(finalText, v, variable?.value, variablesMap.get(v));
      }
    });

  return finalText;
}

export enum InterpolationFormat {
  CSV = 'csv',
  DISTRIBUTED = 'distributed',
  DOUBLEQUOTE = 'doublequote',
  GLOB = 'glob',
  JSON = 'json',
  LUCENE = 'lucene',
  PERCENTENCODE = 'percentencode',
  PIPE = 'pipe',
  PROMETHEUS = 'prometheus',
  RAW = 'raw',
  REGEX = 'regex',
  SINGLEQUOTE = 'singlequote',
  SQLSTRING = 'sqlstring',
  TEXT = 'text',
  QUERYPARAM = 'queryparam',
}

function stringToFormat(val: string | undefined): InterpolationFormat | undefined {
  if (!val) return undefined;

  const lowerVal = val.toLowerCase();
  return Object.values(InterpolationFormat).find((format) => format === lowerVal) || undefined;
}

export function interpolate(values: string[], name: string, format: InterpolationFormat): string {
  switch (format) {
    case InterpolationFormat.CSV:
    case InterpolationFormat.RAW:
      return values.join(',');
    case InterpolationFormat.DISTRIBUTED: {
      const [first, ...rest] = values;
      return `${[first, ...rest.map((v) => `${name}=${v}`)].join(',')}`;
    }
    case InterpolationFormat.DOUBLEQUOTE:
      return values.map((v) => `"${v}"`).join(',');
    case InterpolationFormat.GLOB:
      return `{${values.join(',')}}`;
    case InterpolationFormat.JSON:
      return JSON.stringify(values);
    case InterpolationFormat.LUCENE:
      return `(${values.map((v) => `"${v}"`).join(' OR ')})`;
    case InterpolationFormat.PERCENTENCODE:
      return encodeURIComponent(values.join(','));
    case InterpolationFormat.PIPE:
      return values.join('|');
    case InterpolationFormat.REGEX: {
      const escapedRegex = values.map((v) => v.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
      return `(${escapedRegex.join('|')})`;
    }
    case InterpolationFormat.SINGLEQUOTE:
      return values.map((v) => `'${v}'`).join(',');
    case InterpolationFormat.SQLSTRING:
      return values.map((v) => `'${v.replace(/'/g, "''")}'`).join(',');
    case InterpolationFormat.TEXT:
      return values.join(' + ');
    case InterpolationFormat.QUERYPARAM:
      return values.map((v) => `${name}=${encodeURIComponent(v)}`).join('&');
    case InterpolationFormat.PROMETHEUS:
    default:
      return `(${values.join('|')})`;
  }
}

export function replaceVariable(
  text: string,
  varName: string,
  variableValue: VariableValue,
  varFormat?: InterpolationFormat
): string {
  const variableSyntax = '$' + varName;
  const alternativeVariableSyntax = '${' + varName + (varFormat ? ':' + varFormat : '') + '}';

  let replaceString = '';
  if (Array.isArray(variableValue)) {
    replaceString = interpolate(variableValue, varName, varFormat || InterpolationFormat.PROMETHEUS);
  }
  if (typeof variableValue === 'string') {
    replaceString = interpolate([variableValue], varName, varFormat || InterpolationFormat.RAW);
  }

  text = text.replaceAll(variableSyntax, replaceString);
  return text.replaceAll(alternativeVariableSyntax, replaceString);
}

// This regular expression is designed to identify variable references in a string.
// It supports two formats for referencing variables:
// 1. $variableName - This is a simpler format, and the regular expression captures the variable name (\w+ matches one or more word characters).
// 2. ${variableName} - This is a more complex format and the regular expression captures the variable name (\w+ matches one or more word characters) in the curly braces.
// 3. ${variableName:format} - This is a more complex format that allows specifying a format interpolation.

const VARIABLE_REGEX = /\$(\w+)|\${(\w+)(?:\.([^:^}]+))?(?::([^}]+))?}/gm;

/**
 * Returns a list of variables
 */
export function parseVariables(text: string): string[] {
  const matches = new Set<string>();
  let match;

  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    if (match) {
      if (match[1]) {
        // \$(\w+)\
        matches.add(match[1]);
      } else if (match[2]) {
        // \${(\w+)}\
        matches.add(match[2]);
      }
    }
  }
  // return unique matches
  return Array.from(matches.values());
}

/**
 * Returns a map of variable names and its format. If no format is specified, it will be undefined.
 */
export function parseVariablesAndFormat(text: string): Map<string, InterpolationFormat | undefined> {
  const matches = new Map<string, InterpolationFormat | undefined>();
  let match;

  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    if (match) {
      let format = undefined;
      if (match[4]) {
        format = match[4];
      }
      if (match[1]) {
        // \$(\w+)\
        matches.set(match[1], stringToFormat(format));
      } else if (match[2]) {
        // \${(\w+)}\
        matches.set(match[2], stringToFormat(format));
      }
    }
  }
  return matches;
}
