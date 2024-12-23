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

// TODO: This should be fixed globally in the test setup
import { DatasourceSpec } from '@perses-dev/core';

jest.mock('echarts/core');

import { TimeSeriesQueryContext } from '@perses-dev/plugin-system';
import { RangeQueryResponse } from '../../model';
import { PrometheusDatasource } from '../prometheus-datasource';
import { PrometheusDatasourceSpec } from '../types';
import { PrometheusTimeSeriesQuery } from './';

const datasource: PrometheusDatasourceSpec = {
  directUrl: '/test',
  scrapeInterval: '1m',
};

const promStubClient = PrometheusDatasource.createClient(datasource, {});

// Mock range query
promStubClient.rangeQuery = jest.fn(async () => {
  const stubRepsonse: RangeQueryResponse = {
    status: 'success',
    data: {
      resultType: 'matrix',
      result: [
        {
          metric: {
            __name__: 'up',
          },
          values: [[1686141338.877, '10']],
        },
      ],
    },
  };
  return stubRepsonse;
});

const getDatasourceClient: jest.Mock = jest.fn(() => {
  return promStubClient;
});

const getDatasource: jest.Mock = jest.fn((): DatasourceSpec<PrometheusDatasourceSpec> => {
  return {
    default: false,
    plugin: {
      kind: 'PrometheusDatasource',
      spec: datasource,
    },
  };
});

const createStubContext = (): TimeSeriesQueryContext => {
  const stubTimeSeriesContext: TimeSeriesQueryContext = {
    datasourceStore: {
      getDatasource: getDatasource,
      getDatasourceClient: getDatasourceClient,
      listDatasourceSelectItems: jest.fn(),
      getLocalDatasources: jest.fn(),
      setLocalDatasources: jest.fn(),
      getSavedDatasources: jest.fn(),
      setSavedDatasources: jest.fn(),
    },
    refreshKey: 'test',
    timeRange: {
      end: new Date('01-01-2023'),
      start: new Date('01-02-2023'),
    },
    variableState: {},
  };
  return stubTimeSeriesContext;
};

describe('PrometheusTimeSeriesQuery', () => {
  it('should properly resolve variable dependencies', () => {
    if (!PrometheusTimeSeriesQuery.dependsOn) throw new Error('dependsOn is not defined');
    const { variables } = PrometheusTimeSeriesQuery.dependsOn(
      {
        query: 'sum(up{job="$job"}) by ($instance)',
        seriesNameFormat: `$foo - label`,
      },
      createStubContext()
    );
    expect(variables).toEqual(['job', 'instance', 'foo']);
  });

  it('should replace variables in seriesNameFormat', async () => {
    const ctx = createStubContext();
    ctx.variableState = {
      foo: {
        value: 'bar',
        loading: false,
      },
    };

    const results = await PrometheusTimeSeriesQuery.getTimeSeriesData(
      {
        query: 'sum(up{job="$job"}) by ($instance)',
        seriesNameFormat: `$foo - format`,
      },
      ctx
    );

    expect(results.series[0]?.formattedName).toEqual('bar - format');
  });
});
