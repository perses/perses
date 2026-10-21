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

import type { LabelFilter } from './log-selector';
import { formatLogQuery, parseLogQuery, setValueOperator, toggleLabelValue } from './log-selector';

describe('parseLogQuery', () => {
  it('parses an empty query', () => {
    expect(parseLogQuery('  ')).toEqual({ filters: [], pipeline: '' });
  });

  it('parses matchers of every operator and keeps the pipeline', () => {
    expect(
      parseLogQuery('{app="web", env!="dev", env!="qa", svc=~"a|b\\\\.c", level!~`debug`} |= "error" | json'),
    ).toEqual({
      filters: [
        { label: 'app', operator: '=', values: ['web'] },
        { label: 'env', operator: '!=', values: ['dev', 'qa'] },
        { label: 'svc', operator: '=~', values: ['a', 'b.c'] },
        { label: 'level', operator: '!~', values: ['debug'] },
      ],
      pipeline: '|= "error" | json',
    });
  });

  it('parses different operators on one label', () => {
    expect(parseLogQuery('{app="a", app!="b", app!~"c"}')?.filters).toEqual([
      { label: 'app', operator: '=', values: ['a'] },
      { label: 'app', operator: '!=', values: ['b'] },
      { label: 'app', operator: '!~', values: ['c'] },
    ]);
  });

  it('unescapes quoted values', () => {
    expect(parseLogQuery('{msg="say \\"hi\\" }"}')?.filters).toEqual([
      { label: 'msg', operator: '=', values: ['say "hi" }'] },
    ]);
  });

  it.each([
    ['a metric query', 'sum(count_over_time({app="web"}[5m]))'],
    ['a regex that is not a list of literals', '{app=~"web.*"}'],
    ['two equality matchers on one label', '{app="a", app="b"}'],
    ['an unclosed selector', '{app="web"'],
    ['an unquoted value', '{app=web}'],
  ])('treats %s as a custom query', (_, query) => {
    expect(parseLogQuery(query)).toBeUndefined();
  });
});

describe('formatLogQuery', () => {
  it('writes filters and the pipeline', () => {
    const filters: LabelFilter[] = [
      { label: 'app', operator: '=', values: ['we"b'] },
      { label: 'env', operator: '!=', values: ['dev', 'qa'] },
      { label: 'svc', operator: '=~', values: ['a', 'b.c'] },
    ];
    expect(formatLogQuery({ filters, pipeline: '|= "error"' })).toBe(
      '{app="we\\"b", env!="dev", env!="qa", svc=~"a|b\\\\.c"} |= "error"',
    );
  });

  it('returns an empty query without filters or pipeline', () => {
    expect(formatLogQuery({ filters: [], pipeline: '' })).toBe('');
  });

  it('round-trips through parseLogQuery', () => {
    const query = '{app="web", svc=~"a|b\\\\.c"} | json';
    expect(formatLogQuery(parseLogQuery(query)!)).toBe(query);
  });
});

describe('toggleLabelValue', () => {
  const app: LabelFilter = { label: 'app', operator: '=', values: ['web'] };

  it('adds a filter for a new label', () => {
    expect(toggleLabelValue([], 'app', 'web', '=')).toEqual([app]);
  });

  it('removes a selected value, and the filter once empty', () => {
    expect(toggleLabelValue([app], 'app', 'web', '=')).toEqual([]);
    const regex: LabelFilter = { label: 'app', operator: '=~', values: ['a', 'b'] };
    expect(toggleLabelValue([regex], 'app', 'a', '=~')).toEqual([{ ...regex, values: ['b'] }]);
  });

  it('replaces the value of an equality filter', () => {
    expect(toggleLabelValue([app], 'app', 'api', '=')).toEqual([{ ...app, values: ['api'] }]);
  });

  it('appends values for operators accepting several values', () => {
    const regex: LabelFilter = { label: 'app', operator: '=~', values: ['a'] };
    expect(toggleLabelValue([regex], 'app', 'b', '=~')).toEqual([{ ...regex, values: ['a', 'b'] }]);
  });

  it('keeps a filter per operator on one label', () => {
    expect(toggleLabelValue([app], 'app', 'api', '!=')).toEqual([
      app,
      { label: 'app', operator: '!=', values: ['api'] },
    ]);
  });
});

describe('setValueOperator', () => {
  it('moves a selected value to the filter of the new operator', () => {
    const filters: LabelFilter[] = [{ label: 'app', operator: '=~', values: ['a', 'b'] }];
    expect(setValueOperator(filters, 'app', 'b', '!=')).toEqual([
      { label: 'app', operator: '=~', values: ['a'] },
      { label: 'app', operator: '!=', values: ['b'] },
    ]);
  });

  it('ignores values that are not selected', () => {
    const filters: LabelFilter[] = [{ label: 'app', operator: '=', values: ['a'] }];
    expect(setValueOperator(filters, 'app', 'b', '!=')).toBe(filters);
  });
});
