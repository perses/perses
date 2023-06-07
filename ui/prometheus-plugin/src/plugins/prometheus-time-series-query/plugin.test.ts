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
