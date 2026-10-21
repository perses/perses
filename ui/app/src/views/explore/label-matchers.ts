// Copyright The Perses Authors
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

export type MatchOperator = '=' | '!=';

const METRIC_NAME_REGEX = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;

function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function formatLabelMatcher(label: string, value: string, operator: MatchOperator = '='): string {
  return `${label}${operator}"${escapeLabelValue(value)}"`;
}

/** Index of the `}` closing the selector opened at `openIndex`, ignoring braces inside quoted label values. */
function findSelectorEnd(query: string, openIndex: number): number {
  let quote: string | undefined;
  for (let i = openIndex + 1; i < query.length; i++) {
    const char = query[i];
    if (quote) {
      if (char === '\\') {
        i++;
      } else if (char === quote) {
        quote = undefined;
      }
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (char === '}') {
      return i;
    }
  }
  return -1;
}

/**
 * Adds a label matcher to the first selector of a PromQL or LogQL query.
 * Returns undefined when the query has no selector the matcher can safely be added to.
 */
export function addLabelMatcher(
  query: string,
  label: string,
  value: string,
  operator: MatchOperator = '=',
): string | undefined {
  const matcher = formatLabelMatcher(label, value, operator);
  const trimmed = query.trim();

  if (trimmed === '') {
    return `{${matcher}}`;
  }

  const openIndex = trimmed.indexOf('{');
  if (openIndex === -1) {
    // A bare metric name, such as `up`, can take a selector directly.
    return METRIC_NAME_REGEX.test(trimmed) ? `${trimmed}{${matcher}}` : undefined;
  }

  const closeIndex = findSelectorEnd(trimmed, openIndex);
  if (closeIndex === -1) {
    return undefined;
  }

  const existing = trimmed.slice(openIndex + 1, closeIndex).trim();
  if (existing.split(',').some((part) => part.trim() === matcher)) {
    return trimmed;
  }

  const selector = existing === '' ? matcher : `${existing.replace(/,\s*$/, '')}, ${matcher}`;
  return `${trimmed.slice(0, openIndex + 1)}${selector}${trimmed.slice(closeIndex)}`;
}
