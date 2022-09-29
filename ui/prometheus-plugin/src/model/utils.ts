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

import { VariableValue } from '@perses-dev/core';
import { VariableStateMap } from '@perses-dev/plugin-system';

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

// TODO: Fix this lint eror
// eslint-disable-next-line no-useless-escape
const TEMPLATE_VARIABLE_REGEX = /\$(\w+)|\${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}/gm;

/**
 * Returns a list of template variables
 */
export const parseTemplateVariables = (text: string) => {
  const regex = TEMPLATE_VARIABLE_REGEX;
  const matches = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match) {
      if (match && match.length > 1 && match[1]) {
        matches.push(match[1]);
      }
    }
  }
  // return unique matches
  return Array.from(new Set(matches));
};

export function replaceTemplateVariablesInObject(obj: object, variables: VariableStateMap) {
  // TODO: This is a simple way of interpolating. Technically, this will interpolate property names as well
  // but this shouldn't happen since no properties should have a $ in them. If this is the case,
  // we should modify this function to only interpolate allowed values.
  const str = JSON.stringify(obj);
  const interpolatedStr = replaceTemplateVariables(str, variables);
  return JSON.parse(interpolatedStr);
}
