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

import { TimeSeriesQueryContext } from '@perses-dev/plugin-system';
import { PrometheusTimeSeriesQuery } from './';

// TODO: This should be fixed globally in the test setup
jest.mock('echarts/core');

const stubTimeSeriesContext: TimeSeriesQueryContext = {
  datasourceStore: {
    getDatasource: jest.fn(),
    getDatasourceClient: jest.fn(),
    listDatasourceMetadata: jest.fn(),
  },
  refreshKey: 'test',
  timeRange: {
    end: new Date('01-01-2023'),
    start: new Date('01-02-2023'),
  },
  variableState: {},
};

describe('PrometheusTimeSeriesQuery', () => {
  it('should properly resolve variable dependencies', () => {
    if (!PrometheusTimeSeriesQuery.dependsOn) throw new Error('dependsOn is not defined');
    const { variables } = PrometheusTimeSeriesQuery.dependsOn(
      {
        query: 'sum(up{job="$job"}) by ($instance)',
        series_name_format: `$foo - label`,
      },
      stubTimeSeriesContext
    );
    expect(variables).toEqual(['job', 'instance', 'foo']);
  });
});
