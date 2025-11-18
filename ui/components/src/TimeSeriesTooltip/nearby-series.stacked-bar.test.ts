import { TimeSeries } from '@perses-dev/core';
import type { ECharts as EChartsInstance } from 'echarts/core';
import { TimeChartSeriesMapping } from '../model';
import { checkforNearbyTimeSeries } from './nearby-series';

test('selects correct series for stacked bar at timestamp', () => {
  const data: TimeSeries[] = [
    { name: 'A', values: [[1000, 2]] },
    { name: 'B', values: [[1000, 3]] },
  ];

  const seriesMapping: TimeChartSeriesMapping = [
    { type: 'bar', id: 's1', datasetIndex: 0, name: 'A', stack: 'all', label: { show: false } },
    { type: 'bar', id: 's2', datasetIndex: 1, name: 'B', stack: 'all', label: { show: false } },
  ];

  const pointInGrid = [1000, 4];
  const yBuffer = 0.1;
  const chart = { dispatchAction: () => {} } as unknown as EChartsInstance;

  const res = checkforNearbyTimeSeries(data, seriesMapping, pointInGrid, yBuffer, chart);
  expect(res.length).toBeGreaterThan(0);
  const selected = res.find((r) => r.isClosestToCursor);
  expect(selected?.seriesName).toBe('B');
});
