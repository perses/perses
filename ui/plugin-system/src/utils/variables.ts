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
  const variables = parseVariables(text);
  let finalText = text;
  variables
    // Sorting variables by their length.
    // In order to not have a variable name have contained in another variable name.
    // i.e.: $__range replacing $__range_ms => '3600_ms' instead of '3600000'
    .sort((a, b) => b.length - a.length)
    .forEach((v) => {
      const variable = variableState[v];
      if (variable && variable.value !== undefined) {
        finalText = replaceVariable(finalText, v, variable?.value);
      }
    });

  return finalText;
}

export function replaceVariable(text: string, varName: string, variableValue: VariableValue) {
  const variableSyntax = '$' + varName;
  const alternativeVariableSyntax = '${' + varName + '}';

  let replaceString = '';
  if (Array.isArray(variableValue)) {
    replaceString = `(${variableValue.join('|')})`; // regex style
  }
  if (typeof variableValue === 'string') {
    replaceString = variableValue;
  }

  text = text.replaceAll(variableSyntax, replaceString);
  return text.replaceAll(alternativeVariableSyntax, replaceString);
}

// This regular expression is designed to identify variable references in a string.
// It supports two formats for referencing variables:
// 1. $variableName - This is a simpler format, and the regular expression captures the variable name (\w+ matches one or more word characters).
// 2. ${variableName} - This is a more complex format and the regular expression captures the variable name (\w+ matches one or more word characters) in the curly braces.
// 3. [COMING SOON] ${variableName:value} - This is a more complex format that allows specifying a format function as well.
// TODO: Fix this lint error
// eslint-disable-next-line no-useless-escape
const VARIABLE_REGEX = /\$(\w+)|\${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}/gm;

/**
 * Returns a list of variables
 */
export const parseVariables = (text: string) => {
  const regex = VARIABLE_REGEX;
  const matches = new Set<string>();
  let match;

  while ((match = regex.exec(text)) !== null) {
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
};
