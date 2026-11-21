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

export const LABEL_OPERATORS = ['=', '!=', '=~', '!~'] as const;
export type LabelOperator = (typeof LABEL_OPERATORS)[number];

/**
 * A label filter of the label explorer: the values selected for a label with one operator. A label has at most one
 * filter per operator. Regex operators can hold several values, which are written as an alternation of literals
 * (`label=~"a|b"`). `!=` can hold several values, written as one matcher each. `=` holds a single value.
 */
export interface LabelFilter {
  label: string;
  operator: LabelOperator;
  values: string[];
}

/** A LogQL query split into the stream selector filters and the rest of the query (the pipeline). */
export interface ParsedLogQuery {
  filters: LabelFilter[];
  pipeline: string;
}

const LABEL_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*/;
const REGEX_META_CHARS = '.^$*+?()[]{}|\\';
const STRING_ESCAPES: Record<string, string> = { n: '\n', t: '\t' };

export function isLabelOperator(value: unknown): value is LabelOperator {
  return LABEL_OPERATORS.some((operator) => operator === value);
}

export function isRegexOperator(operator: LabelOperator): boolean {
  return operator === '=~' || operator === '!~';
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Splits a regex made only of an alternation of literals (e.g. `a|b\.c`) into its literals. */
function splitLiteralAlternation(regex: string): string[] | undefined {
  const values: string[] = [];
  let current = '';
  for (let i = 0; i < regex.length; i++) {
    const char = regex.charAt(i);
    if (char === '\\') {
      const next = regex.charAt(i + 1);
      if (next === '' || !REGEX_META_CHARS.includes(next)) return undefined;
      current += next;
      i++;
    } else if (char === '|') {
      values.push(current);
      current = '';
    } else if (REGEX_META_CHARS.includes(char)) {
      return undefined;
    } else {
      current += char;
    }
  }
  values.push(current);
  return values.includes('') ? undefined : values;
}

interface RawMatcher {
  label: string;
  operator: LabelOperator;
  value: string;
}

/** Reads a quoted string starting at `start`. Returns the unescaped value and the index after the closing quote. */
function readString(query: string, start: number): { value: string; end: number } | undefined {
  const quoteChar = query.charAt(start);
  if (quoteChar === '`') {
    const close = query.indexOf('`', start + 1);
    return close === -1 ? undefined : { value: query.slice(start + 1, close), end: close + 1 };
  }
  if (quoteChar !== '"') return undefined;

  let value = '';
  for (let i = start + 1; i < query.length; i++) {
    const char = query.charAt(i);
    if (char === '"') return { value, end: i + 1 };
    if (char === '\\') {
      const next = query.charAt(i + 1);
      value += STRING_ESCAPES[next] ?? next;
      i++;
    } else {
      value += char;
    }
  }
  return undefined;
}

/** Parses the matchers of the stream selector at the start of the query, and returns the index after it. */
function readSelector(query: string): { matchers: RawMatcher[]; end: number } | undefined {
  const matchers: RawMatcher[] = [];
  let pos = 1;
  const skipSpaces = (): void => {
    while (/\s/.test(query.charAt(pos))) pos++;
  };

  skipSpaces();
  if (query.charAt(pos) === '}') return { matchers, end: pos + 1 };

  while (pos < query.length) {
    skipSpaces();
    const label = LABEL_NAME_REGEX.exec(query.slice(pos))?.[0];
    if (!label) return undefined;
    pos += label.length;
    skipSpaces();

    const operator = (['=~', '!~', '!=', '='] as const).find((op) => query.startsWith(op, pos));
    if (!operator) return undefined;
    pos += operator.length;
    skipSpaces();

    const str = readString(query, pos);
    if (!str) return undefined;
    matchers.push({ label, operator, value: str.value });
    pos = str.end;
    skipSpaces();

    const separator = query.charAt(pos);
    pos++;
    if (separator === '}') return { matchers, end: pos };
    if (separator !== ',') return undefined;
  }
  return undefined;
}

/**
 * Parses a LogQL query into label filters and its pipeline.
 * Returns undefined when the label explorer cannot represent the query (a custom query).
 */
export function parseLogQuery(query: string): ParsedLogQuery | undefined {
  const trimmed = query.trim();
  if (trimmed === '') return { filters: [], pipeline: '' };
  if (!trimmed.startsWith('{')) return undefined;

  const selector = readSelector(trimmed);
  if (!selector) return undefined;

  const filters: LabelFilter[] = [];
  for (const { label, operator, value } of selector.matchers) {
    const existing = filters.find((filter) => filter.label === label && filter.operator === operator);
    if (existing) {
      // Several `!=` matchers on a label are the only repeated matchers the label explorer can represent.
      if (operator !== '!=') return undefined;
      existing.values.push(value);
      continue;
    }
    const values = isRegexOperator(operator) ? splitLiteralAlternation(value) : [value];
    if (!values) return undefined;
    filters.push({ label, operator, values });
  }

  return { filters, pipeline: trimmed.slice(selector.end).trim() };
}

/** Builds a LogQL query from label filters and a pipeline. */
export function formatLogQuery({ filters, pipeline }: ParsedLogQuery): string {
  const matchers = filters.flatMap(({ label, operator, values }) => {
    if (values.length === 0) return [];
    if (isRegexOperator(operator)) return [`${label}${operator}${quote(values.map(escapeRegex).join('|'))}`];
    return values.map((value) => `${label}${operator}${quote(value)}`);
  });
  if (matchers.length === 0 && pipeline === '') return '';
  return [`{${matchers.join(', ')}}`, pipeline].filter(Boolean).join(' ');
}

function removeValue(filters: LabelFilter[], label: string, value: string): LabelFilter[] {
  return filters
    .map((filter) =>
      filter.label === label ? { ...filter, values: filter.values.filter((v) => v !== value) } : filter,
    )
    .filter((filter) => filter.values.length > 0);
}

function addValue(filters: LabelFilter[], label: string, value: string, operator: LabelOperator): LabelFilter[] {
  const existing = filters.find((filter) => filter.label === label && filter.operator === operator);
  if (!existing) return [...filters, { label, operator, values: [value] }];
  // `=` holds a single value, so a new value replaces it.
  const values = operator === '=' ? [value] : [...existing.values, value];
  return filters.map((filter) => (filter === existing ? { ...filter, values } : filter));
}

/** Returns the operator a label value is selected with, if it is selected. */
export function getValueOperator(filters: LabelFilter[], label: string, value: string): LabelOperator | undefined {
  return filters.find((filter) => filter.label === label && filter.values.includes(value))?.operator;
}

/** Selects a label value with the given operator, or deselects it when it is already selected. */
export function toggleLabelValue(
  filters: LabelFilter[],
  label: string,
  value: string,
  operator: LabelOperator,
): LabelFilter[] {
  if (getValueOperator(filters, label, value) !== undefined) return removeValue(filters, label, value);
  return addValue(filters, label, value, operator);
}

/** Changes the operator of a selected label value. */
export function setValueOperator(
  filters: LabelFilter[],
  label: string,
  value: string,
  operator: LabelOperator,
): LabelFilter[] {
  if (getValueOperator(filters, label, value) === undefined) return filters;
  return addValue(removeValue(filters, label, value), label, value, operator);
}

/** Labels and label values listed by the label explorer. Undefined entries are still loading. */
export interface LabelCatalog {
  labels?: string[];
  values: Record<string, string[] | undefined>;
}

/**
 * Returns the filters the label explorer shows for a parsed query, or undefined when the query is a custom query. A
 * query is custom when it could not be parsed, has anything besides the stream selector (e.g. a pipeline), or uses a
 * label or value the label explorer does not list. Labels and values that are still loading are not checked yet.
 */
export function getSidebarFilters(
  parsed: ParsedLogQuery | undefined,
  catalog: LabelCatalog,
): LabelFilter[] | undefined {
  if (!parsed || parsed.pipeline !== '') return undefined;
  for (const { label, values } of parsed.filters) {
    if (catalog.labels && !catalog.labels.includes(label)) return undefined;
    const listedValues = catalog.values[label];
    if (listedValues && values.some((value) => !listedValues.includes(value))) return undefined;
  }
  return parsed.filters;
}
