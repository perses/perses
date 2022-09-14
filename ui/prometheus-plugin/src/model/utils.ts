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

import { VariablesState, VariableValue } from '@perses-dev/core';

export function replaceTemplateVariables(text: string, variableState: VariablesState): string {
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

const TEMPLATE_VARIABLE_REGEX = /\$(\w+)|\${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}/gm;

/**
 * Returns a list of template variables
 */
export const parseTemplateVariables = (text: string) => {
  const regex = TEMPLATE_VARIABLE_REGEX;
  let m;
  const matches = [];
  // find all matches in regex and return them
  do {
    m = regex.exec(text);
    if (m) {
      if (m && m.length > 1 && m[1]) {
        matches.push(m[1]);
      }
    }
  } while (m);

  // return unique matches
  return Array.from(new Set(matches));
};
