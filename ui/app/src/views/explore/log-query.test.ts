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

import { getLogQuery, toEditorValue, toLokiSpec, toQueryDefinition } from './log-query';

const lokiQuery = {
  kind: 'LogQuery',
  spec: { plugin: { kind: 'LokiLogQuery', spec: { query: '{app="web"}' } } },
};

describe('getLogQuery', () => {
  it('returns the first log query', () => {
    const timeSeriesQuery = {
      kind: 'TimeSeriesQuery',
      spec: { plugin: { kind: 'PrometheusTimeSeriesQuery', spec: {} } },
    };
    expect(getLogQuery({ queries: [timeSeriesQuery, lokiQuery] })).toEqual(lokiQuery);
  });

  it.each([
    ['no data', undefined],
    ['queries that are not a list', { queries: 'nope' }],
    ['a query without plugin', { queries: [{ kind: 'LogQuery', spec: {} }] }],
    ['a plugin without kind', { queries: [{ kind: 'LogQuery', spec: { plugin: { spec: {} } } }] }],
  ])('ignores %s', (_, data) => {
    expect(getLogQuery(data)).toBeUndefined();
  });
});

describe('toLokiSpec', () => {
  it('keeps valid fields', () => {
    const spec = { query: '{a="b"}', datasource: { kind: 'LokiDatasource', name: 'loki' }, direction: 'forward' };
    expect(toLokiSpec(spec)).toEqual(spec);
  });

  it('drops fields with an unexpected type', () => {
    expect(toLokiSpec({ query: 42, datasource: 'loki', direction: 'up' })).toEqual({ query: '' });
  });
});

describe('editor value', () => {
  it('defaults to an empty Loki query', () => {
    expect(toEditorValue(undefined)).toEqual({
      selection: { type: 'LogQuery', kind: 'LokiLogQuery' },
      spec: { query: '' },
    });
  });

  it('round-trips a query definition', () => {
    expect(toQueryDefinition(toEditorValue(lokiQuery))).toEqual(lokiQuery);
  });
});
