// Copyright 2021 The Perses Authors
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

import { Duration, parser, StringLiteral } from 'lezer-promql';
import { useMemoized, useDashboardVariables, VariableState } from '@perses-dev/core';
import { DEFAULT_ALL_VALUE } from '@perses-dev/plugin-system';

const REPLACE_IN_NODE_TYPES = new Set([StringLiteral, Duration]);

/**
 * Type alias to indicate what parts of the API support template variables.
 */
export type TemplateString = string;

/**
 * Replaces template variable placeholders with variable values from the current
 * dashbboard in multiple template strings. Since template strings are often
 * used as request parameters, the results are memoized and only recalculated
 * if the templateStrings or variable values change.
 */
export function useReplaceTemplateStrings(templateStrings?: TemplateString[]) {
  const variablesState = useDashboardVariables();

  // Replace template string placeholders with variable values
  return useMemoized(() => {
    const result: string[] = [];
    const needsVariableValuesFor = new Set<string>();

    for (const templateString of templateStrings ?? []) {
      const replaced = replaceTemplateVariables(templateString, variablesState);
      result.push(replaced.result);

      for (const varName of replaced.needsVariableValuesFor) {
        needsVariableValuesFor.add(varName);
      }
    }
    return { result, needsVariableValuesFor };
  }, [templateStrings, variablesState]);
}

/**
 * Replaces template variable placeholders with variable values from the current
 * dashboard in a single template string. Since template strings are often
 * used as request parameters, the results are memoized and only recalculated
 * if the templateString or variable values change.
 */
export function useReplaceTemplateString(templateString?: TemplateString) {
  const variablesState = useDashboardVariables();

  // Replace template string placeholders with variable values
  return useMemoized(() => {
    if (templateString === undefined) {
      return { result: '', needsVariableValuesFor: new Set<string>() };
    }

    return replaceTemplateVariables(templateString, variablesState);
  }, [templateString, variablesState]);
}

interface ReplaceVariablesResult {
  result: string;
  needsVariableValuesFor: Set<string>;
}

/**
 * Replace template variable placeholders with variable values.
 */
function replaceTemplateVariables(
  templateString: TemplateString,
  variablesState: Record<string, VariableState>
): ReplaceVariablesResult {
  const needsVariableValuesFor = new Set<string>();

  let indexAdjustment = 0;
  const tree = parser.parse(templateString);
  const cursor = tree.cursor();
  do {
    // Only replace variables in string literals for now
    if (REPLACE_IN_NODE_TYPES.has(cursor.node.type.id)) continue;

    let { from, to } = cursor.node;
    from += indexAdjustment;
    to += indexAdjustment;

    let nodeText = templateString.substring(from, to);

    nodeText = nodeText.replaceAll(/\$([a-zA-Z0-9_-]+)/g, (match, variableName) => {
      const state = variablesState[variableName];
      if (state === undefined) {
        throw new Error(`Unknown variable '${variableName}'`);
      }

      const { value, options } = state;
      let replacement: string;
      if (Array.isArray(value)) {
        let selectedValues = value;
        // Is the default ALL value?
        if (value.length === 1 && value[0] === DEFAULT_ALL_VALUE) {
          // For the default ALL value, we want to use all options as the
          // selected values
          if (options === undefined) {
            // Wait until options are loaded before we do replacement
            needsVariableValuesFor.add(variableName);
            return match;
          }
          selectedValues = options;
        }

        // TODO: Escape v for regex
        replacement = selectedValues.map((v) => v).join('|');
      } else {
        replacement = escapeVariableValue(value);
      }

      return replacement;
    });

    // Replace the string literal with the new one and since that may change the
    // overall length of the string, keep track of an "index adjustment" so we
    // can shift positions in the tree accordingly
    const oldLength = to - from;
    indexAdjustment += nodeText.length - oldLength;

    templateString = templateString.substring(0, from) + nodeText + templateString.substring(from + oldLength);
  } while (cursor.next());

  return {
    result: templateString,
    needsVariableValuesFor,
  };
}

const SINGLE_BACKSLASH = '\\';
const DOUBLE_BACKSLASH = '\\\\';

function escapeVariableValue(value: string) {
  // TODO: What about ["'`]? Do we need to know what kind of quotes the
  // string literal is using?
  return value.replaceAll(SINGLE_BACKSLASH, DOUBLE_BACKSLASH);
}
