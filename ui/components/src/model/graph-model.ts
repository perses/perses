import { LineSeriesOption } from 'echarts/charts';
// import { getUniqueKeyForPrometheusResult } from '../../model/prom-datasource';
// import { getRandomColor } from '../../styles';
// import { ModifiedPromQueryResult } from '../../utils';

/**
 * Normalized format for rendering time series in an ECharts graph
 */
export type GraphSeriesValueTuple = [timestamp: number, value: number];

export type EChartsValues = number | null | '-';

export interface EChartsTimeSeries extends Omit<LineSeriesOption, 'data'> {
  // TODO: support dataset and both category / time xAxis types
  data: Iterable<GraphSeriesValueTuple> | EChartsValues[];
}

export type EChartsDataFormat = {
  timeSeries: EChartsTimeSeries[];
  xAxis: number[];
};

export const ECHARTS_OPTIMIZED_MODE_SERIES_LIMIT = 500;

/**
 * Tooltip specific types
 */
export interface Coordinate {
  x: number;
  y: number;
}

/**
 * Transforms metrics response into format expected by ECharts
 * Notes:
 * function formatMetricsForEChartsGraph(queryResult: ModifiedPromQueryResult, ...)
 * const name = getUniqueKeyForPrometheusResult(result.metric, true);
 * getRandomColor(name)
 */
// TODO (sjcobb): update LineChartPanel with formatMetricsForEChartsGraph customizations like abbreviateLargeNumber

// Take a large number and abbreviate
/**
 * Takes large numbers and abbreviates them with the appropriate suffix
 * 10000 -> 10k
 * 1000000 -> 1M
 */
export function abbreviateLargeNumber(num: number) {
  return num >= 1e12
    ? num / 1e12 + 'T'
    : num >= 1e9
    ? num / 1e9 + 'B'
    : num >= 1e6
    ? num / 1e6 + 'M'
    : num >= 1e3
    ? num / 1e3 + 'k'
    : num;
}
