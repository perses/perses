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

import { DatasourceSpec } from '@perses-dev/core';
import { TraceQueryContext } from '@perses-dev/plugin-system';
import { MOCK_ENRICHED_TRACE_QUERY_RESPONSE, MOCK_TRACE_DATA } from '../test';
import { TempoDatasourceSpec } from './tempo-datasource-types';
import { TempoDatasource } from './tempo-datasource';
import { TempoTraceQuery } from './TempoTraceQuery';

jest.mock('echarts/core');

const datasource: TempoDatasourceSpec = {
  directUrl: '/test',
};

const tempoStubClient = TempoDatasource.createClient(datasource, {});

tempoStubClient.getEnrichedTraceQuery = jest.fn(async () => {
  const stubResponse = MOCK_ENRICHED_TRACE_QUERY_RESPONSE;
  return stubResponse;
});

const getDatasourceClient: jest.Mock = jest.fn(() => {
  return tempoStubClient;
});

const getDatasource: jest.Mock = jest.fn((): DatasourceSpec<TempoDatasourceSpec> => {
  return {
    default: false,
    plugin: {
      kind: 'TempoDatasource',
      spec: datasource,
    },
  };
});

const stubTempoContext: TraceQueryContext = {
  datasourceStore: {
    getDatasource: getDatasource,
    getDatasourceClient: getDatasourceClient,
    listDatasourceSelectItems: jest.fn(),
    getLocalDatasources: jest.fn(),
    setLocalDatasources: jest.fn(),
    getSavedDatasources: jest.fn(),
    setSavedDatasources: jest.fn(),
  },
};

describe('TempoTraceQuery', () => {
  it('should return trace query results', async () => {
    const results = await TempoTraceQuery.getTraceData(
      {
        query: 'duration > 900ms',
      },
      stubTempoContext
    );
    expect(results).toEqual(MOCK_TRACE_DATA);
  });
});
