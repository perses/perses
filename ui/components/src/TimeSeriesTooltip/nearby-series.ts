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

import flatMap from 'lodash/flatMap';
import groupBy from 'lodash/groupBy';
import { ECharts as EChartsInstance } from 'echarts/core';
import { LineSeriesOption } from 'echarts/charts';
import { formatValue, TimeSeriesValueTuple, UnitOptions, TimeSeries } from '@perses-dev/core';
import { EChartsDataFormat, OPTIMIZED_MODE_SERIES_LIMIT, TimeChartSeriesMapping } from '../model';
import { getPointInGrid, restoreChart } from '../utils';
import { CursorCoordinates, CursorData } from './tooltip-model';

// increase multipliers to show more series in tooltip
export const INCREASE_NEARBY_SERIES_MULTIPLIER = 5.5; // adjusts how many series show in tooltip (higher == more series shown)
export const DYNAMIC_NEARBY_SERIES_MULTIPLIER = 30; // used for adjustment after series number divisor
export const SHOW_FEWER_SERIES_LIMIT = 5;

export interface NearbySeriesInfo {
  seriesIdx: number | null;
  datumIdx: number | null;
  seriesName: string;
  date: number;
  markerColor: string;
  x: number;
  y: number;
  formattedY: string;
  isClosestToCursor: boolean;
}

export type NearbySeriesArray = NearbySeriesInfo[];

export interface DatapointInfo {
  dataIndex: number;
  seriesIndex: number;
  seriesName: string;
  yValue: number;
}

/**
 * Returns formatted series data for the points that are close to the user's cursor.
 * Adjust xBuffer and yBuffer to increase or decrease number of series shown.
 */
export function checkforNearbyTimeSeries(
  data: TimeSeries[],
  seriesMapping: TimeChartSeriesMapping,
  pointInGrid: number[],
  yBuffer: number,
  chart: EChartsInstance,
  unit?: UnitOptions
): NearbySeriesArray {
  const currentNearbySeriesData: NearbySeriesArray = [];
  const cursorX: number | null = pointInGrid[0] ?? null;
  const cursorY: number | null = pointInGrid[1] ?? null;

  if (cursorX === null || cursorY === null) return currentNearbySeriesData;

  if (chart.dispatchAction === undefined) return currentNearbySeriesData;

  if (!Array.isArray(data)) return currentNearbySeriesData;
  const nearbySeriesIndexes: number[] = [];
  const emphasizedSeriesIndexes: number[] = [];
  const nonEmphasizedSeriesIndexes: number[] = [];
  const emphasizedDatapoints: DatapointInfo[] = [];

  const totalSeries = data.length;

  let closestTimestamp = null;
  let closestDistance = Infinity;

  // find the timestamp with data that is closest to cursorX
  for (let seriesIdx = 0; seriesIdx < totalSeries; seriesIdx++) {
    const currentSeries = seriesMapping[seriesIdx];
    if (currentSeries === undefined) break;

    const currentDataset = totalSeries > 0 ? data[seriesIdx] : null;
    if (currentDataset == null) break;

    const currentDatasetValues: TimeSeriesValueTuple[] = currentDataset.values;

    // Determine closestTimestamp before checking whether it is equal to xValue. Consolidating
    // with second currentDatasetValues loop below would result in duplicate nearby series
    for (const [timestamp] of currentDatasetValues) {
      const distance = Math.abs(timestamp - cursorX);
      if (distance < closestDistance) {
        closestTimestamp = timestamp;
        closestDistance = distance;
      }
    }

    if (currentDatasetValues === undefined || !Array.isArray(currentDatasetValues)) break;
    const lineSeries = currentSeries as LineSeriesOption;
    const currentSeriesName = lineSeries.name ? lineSeries.name.toString() : '';
    const markerColor = lineSeries.color ?? '#000';
    if (Array.isArray(data)) {
      for (let datumIdx = 0; datumIdx < currentDatasetValues.length; datumIdx++) {
        const nearbyTimeSeries = currentDatasetValues[datumIdx];
        if (nearbyTimeSeries === undefined || !Array.isArray(nearbyTimeSeries)) break;

        const xValue = nearbyTimeSeries[0];
        const yValue = nearbyTimeSeries[1];

        // TODO: ensure null values not displayed in tooltip
        if (yValue !== undefined && yValue !== null) {
          if (closestTimestamp === xValue) {
            if (cursorY <= yValue + yBuffer && cursorY >= yValue - yBuffer) {
              // show fewer bold series in tooltip when many total series
              const minPercentRange = totalSeries > SHOW_FEWER_SERIES_LIMIT ? 2 : 5;
              const percentRangeToCheck = Math.max(minPercentRange, 100 / totalSeries);
              const isClosestToCursor = isWithinPercentageRange({
                valueToCheck: cursorY,
                baseValue: yValue,
                percentage: percentRangeToCheck,
              });
              if (isClosestToCursor) {
                // shows as bold in tooltip, customize 'emphasis' options in getTimeSeries util
                emphasizedSeriesIndexes.push(seriesIdx);

                // keep track of all bold datapoints in tooltip so that 'select' state only applied to topmost
                emphasizedDatapoints.push({
                  seriesIndex: seriesIdx,
                  dataIndex: datumIdx,
                  seriesName: currentSeriesName,
                  yValue: yValue,
                });
              } else {
                nonEmphasizedSeriesIndexes.push(seriesIdx);
                // ensure series far away from cursor are not highlighted
                chart.dispatchAction({
                  type: 'downplay',
                  seriesIndex: seriesIdx,
                });
              }
              const formattedY = formatValue(yValue, unit);
              currentNearbySeriesData.push({
                seriesIdx: seriesIdx,
                datumIdx: datumIdx,
                seriesName: currentSeriesName,
                date: closestTimestamp,
                x: xValue,
                y: yValue,
                formattedY: formattedY,
                markerColor: markerColor.toString(),
                isClosestToCursor,
              });
              nearbySeriesIndexes.push(seriesIdx);
            }
          }
        }
      }
    }
  }

  // Accounts for multiple series that are rendered direct on top of eachother.
  // Only applies select state to the datapoint that is visible to avoid color mismatch.
  const duplicateDatapoints = findDuplicateDatapoints(emphasizedDatapoints);
  const lastEmphasizedDatapoint =
    duplicateDatapoints.length > 0
      ? duplicateDatapoints[duplicateDatapoints.length - 1]
      : emphasizedDatapoints[emphasizedDatapoints.length - 1];
  if (lastEmphasizedDatapoint !== undefined) {
    // corresponds to select options inside getTimeSeries util
    // https://echarts.apache.org/en/option.html#series-line.select.itemStyle
    chart.dispatchAction({
      type: 'select',
      seriesIndex: lastEmphasizedDatapoint.seriesIndex,
      dataIndex: lastEmphasizedDatapoint.dataIndex,
    });
  }

  // Clears emphasis state of all lines that are not emphasized.
  // Emphasized is a subset of just the nearby series that are closest to cursor.
  chart.dispatchAction({
    type: 'downplay',
    seriesIndex: nonEmphasizedSeriesIndexes,
  });

  // https://echarts.apache.org/en/api.html#action.highlight
  if (emphasizedSeriesIndexes.length > 0) {
    // Fadeout opacity of all series not closest to cursor.
    chart.dispatchAction({
      type: 'highlight',
      seriesIndex: emphasizedSeriesIndexes,
      notBlur: false, // ensure blur IS triggered, this is default but setting so it is explicit
      escapeConnect: true, // shared crosshair should not emphasize series on adjacent charts
    });
  } else {
    // When no emphasized series with bold text, notBlur allows opacity fadeout to not trigger.
    chart.dispatchAction({
      type: 'highlight',
      seriesIndex: nearbySeriesIndexes,
      notBlur: true, // do not trigger blur state when cursor is not immediately close to any series
      escapeConnect: true, // shared crosshair should not emphasize series on adjacent charts
    });

    // Clears datapoint select options
    restoreChart(chart);
  }

  return currentNearbySeriesData;
}

/*
 * Which datapoint to apply select styles to should be the line rendered on top
 */
export function findDuplicateDatapoints(data: DatapointInfo[]): DatapointInfo[] {
  const groupedData = groupBy(data, 'yValue');
  return flatMap(groupedData, (group) => (group.length > 1 ? group : []));
}

/**
 * [DEPRECATED] Returns formatted series data for the points that are close to the user's cursor
 * Adjust yBuffer to increase or decrease number of series shown
 */
export function legacyCheckforNearbySeries(
  data: EChartsDataFormat,
  pointInGrid: number[],
  yBuffer: number,
  chart?: EChartsInstance,
  unit?: UnitOptions
): NearbySeriesArray {
  const currentNearbySeriesData: NearbySeriesArray = [];
  const cursorX: number | null = pointInGrid[0] ?? null;
  const cursorY: number | null = pointInGrid[1] ?? null;

  if (cursorX === null || cursorY === null) {
    return currentNearbySeriesData;
  }

  const nearbySeriesIndexes: number[] = [];
  const emphasizedSeriesIndexes: number[] = [];
  const nonEmphasizedSeriesIndexes: number[] = [];
  const totalSeries = data.timeSeries.length;
  if (Array.isArray(data.xAxis) && Array.isArray(data.timeSeries)) {
    for (let seriesIdx = 0; seriesIdx < totalSeries; seriesIdx++) {
      const currentSeries = data.timeSeries[seriesIdx];
      if (currentNearbySeriesData.length >= OPTIMIZED_MODE_SERIES_LIMIT) break;
      if (currentSeries !== undefined) {
        const currentSeriesName = currentSeries.name ? currentSeries.name.toString() : '';
        const markerColor = currentSeries.color ?? '#000';
        if (Array.isArray(currentSeries.data)) {
          for (let datumIdx = 0; datumIdx < currentSeries.data.length; datumIdx++) {
            const xValue = data.xAxis[datumIdx] ?? 0;
            const yValue = currentSeries.data[datumIdx];
            // ensure null values not displayed in tooltip
            if (yValue !== undefined && yValue !== null && cursorX === datumIdx) {
              if (yValue !== '-' && cursorY <= yValue + yBuffer && cursorY >= yValue - yBuffer) {
                // show fewer bold series in tooltip when many total series
                const minPercentRange = totalSeries > SHOW_FEWER_SERIES_LIMIT ? 2 : 5;
                const percentRangeToCheck = Math.max(minPercentRange, 100 / totalSeries);
                const isClosestToCursor = isWithinPercentageRange({
                  valueToCheck: cursorY,
                  baseValue: yValue,
                  percentage: percentRangeToCheck,
                });
                if (isClosestToCursor) {
                  emphasizedSeriesIndexes.push(seriesIdx);
                } else {
                  nonEmphasizedSeriesIndexes.push(seriesIdx);
                  // ensure series not close to cursor are not highlighted
                  if (chart?.dispatchAction !== undefined) {
                    chart.dispatchAction({
                      type: 'downplay',
                      seriesIndex: seriesIdx,
                    });
                  }
                }

                // determine whether to convert timestamp to ms, see: https://stackoverflow.com/a/23982005/17575201
                const xValueMilliSeconds = xValue > 99999999999 ? xValue : xValue * 1000;
                const formattedY = formatValue(yValue, unit);
                currentNearbySeriesData.push({
                  seriesIdx: seriesIdx,
                  datumIdx: datumIdx,
                  seriesName: currentSeriesName,
                  date: xValueMilliSeconds,
                  x: xValue,
                  y: yValue,
                  formattedY: formattedY,
                  markerColor: markerColor.toString(),
                  isClosestToCursor,
                });
                nearbySeriesIndexes.push(seriesIdx);
              }
            }
          }
        }
      }
    }
  }
  if (chart?.dispatchAction !== undefined) {
    // Clears emphasis state of all lines that are not emphasized.
    // Emphasized is a subset of just the nearby series that are closest to cursor.
    chart.dispatchAction({
      type: 'downplay',
      seriesIndex: nonEmphasizedSeriesIndexes,
    });

    // https://echarts.apache.org/en/api.html#action.highlight
    if (emphasizedSeriesIndexes.length > 0) {
      // Fadeout opacity of all series not closest to cursor.
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: emphasizedSeriesIndexes,
        notBlur: false, // ensure blur IS triggered, this is default but setting so it is explicit
        escapeConnect: true, // shared crosshair should not emphasize series on adjacent charts
      });
    } else {
      // When no emphasized series with bold text, notBlur allows opacity fadeout to not trigger.
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: nearbySeriesIndexes,
        notBlur: true, // do not trigger blur state when cursor is not immediately close to any series
        escapeConnect: true, // shared crosshair should not emphasize series on adjacent charts
      });
    }
  }

  return currentNearbySeriesData;
}

/**
 * Uses mouse position to determine whether user is hovering over a chart canvas
 * If yes, convert from pixel values to logical cartesian coordinates and return all nearby series
 */
export function getNearbySeriesData({
  mousePos,
  pinnedPos,
  data,
  seriesMapping,
  chart,
  unit,
  showAllSeries = false,
}: {
  mousePos: CursorData['coords'];
  pinnedPos: CursorCoordinates | null;
  data: TimeSeries[];
  seriesMapping: TimeChartSeriesMapping;
  chart?: EChartsInstance;
  unit?: UnitOptions;
  showAllSeries?: boolean;
}) {
  if (chart === undefined || mousePos === null) return [];

  // prevents multiple tooltips showing from adjacent charts unless tooltip is pinned
  let cursorTargetMatchesChart = false;
  if (mousePos.target !== null) {
    const currentParent = (<HTMLElement>mousePos.target).parentElement;
    if (currentParent !== null) {
      const currentGrandparent = currentParent.parentElement;
      if (currentGrandparent !== null) {
        const chartDom = chart.getDom();
        if (chartDom === currentGrandparent) {
          cursorTargetMatchesChart = true;
        }
      }
    }
  }

  // allows moving cursor inside tooltip without it fading away
  if (pinnedPos !== null) {
    mousePos = pinnedPos;
    cursorTargetMatchesChart = true;
  }

  if (cursorTargetMatchesChart === false) return [];

  if (chart['_model'] === undefined || data === null) return [];

  const pointInGrid = getPointInGrid(mousePos.plotCanvas.x, mousePos.plotCanvas.y, chart);
  if (pointInGrid !== null) {
    const chartModel = chart['_model'];
    const yInterval = chartModel.getComponent('yAxis').axis.scale._interval;
    const totalSeries = data.length;
    const yBuffer = getYBuffer({ yInterval, totalSeries, showAllSeries });
    return checkforNearbyTimeSeries(data, seriesMapping, pointInGrid, yBuffer, chart, unit);
  }

  return [];
}

/**
 * [DEPRECATED] Uses mouse position to determine whether user is hovering over a chart canvas
 * If yes, convert from pixel values to logical cartesian coordinates and return all nearby series
 */
export function legacyGetNearbySeriesData({
  mousePos,
  pinnedPos,
  chartData,
  chart,
  unit,
  showAllSeries = false,
}: {
  mousePos: CursorData['coords'];
  pinnedPos: CursorCoordinates | null;
  chartData: EChartsDataFormat;
  chart?: EChartsInstance;
  unit?: UnitOptions;
  showAllSeries?: boolean;
}) {
  if (chart === undefined || mousePos === null) return [];

  // prevents multiple tooltips showing from adjacent charts unless tooltip is pinned
  let cursorTargetMatchesChart = false;
  if (mousePos.target !== null) {
    const currentParent = (<HTMLElement>mousePos.target).parentElement;
    if (currentParent !== null) {
      const currentGrandparent = currentParent.parentElement;
      if (currentGrandparent !== null) {
        const chartDom = chart.getDom();
        if (chartDom === currentGrandparent) {
          cursorTargetMatchesChart = true;
        }
      }
    }
  }

  // allows moving cursor inside tooltip without it fading away
  if (pinnedPos !== null) {
    mousePos = pinnedPos;
    cursorTargetMatchesChart = true;
  }

  if (cursorTargetMatchesChart === false) return [];

  if (chart['_model'] === undefined) return [];
  const chartModel = chart['_model'];
  const yInterval = chartModel.getComponent('yAxis').axis.scale._interval;
  const totalSeries = chartData.timeSeries.length;
  const yBuffer = getYBuffer({ yInterval, totalSeries, showAllSeries });
  const pointInPixel = [mousePos.plotCanvas.x ?? 0, mousePos.plotCanvas.y ?? 0];
  if (chart.containPixel('grid', pointInPixel)) {
    const pointInGrid = chart.convertFromPixel('grid', pointInPixel);
    if (pointInGrid[0] !== undefined && pointInGrid[1] !== undefined) {
      return legacyCheckforNearbySeries(chartData, pointInGrid, yBuffer, chart, unit);
    }
  }

  return [];
}

/*
 * Check if two numbers are within a specified percentage range
 */
export function isWithinPercentageRange({
  valueToCheck,
  baseValue,
  percentage,
}: {
  valueToCheck: number;
  baseValue: number;
  percentage: number;
}): boolean {
  const range = (percentage / 100) * baseValue;
  const lowerBound = baseValue - range;
  const upperBound = baseValue + range;
  return valueToCheck >= lowerBound && valueToCheck <= upperBound;
}

/*
 * Get range to check within for nearby series to show in tooltip.
 */
export function getYBuffer({
  yInterval,
  totalSeries,
  showAllSeries = false,
}: {
  yInterval: number;
  totalSeries: number;
  showAllSeries?: boolean;
}) {
  if (showAllSeries) {
    return yInterval * 10; // roughly correlates with grid so entire canvas is searched
  }

  // never let nearby series range be less than roughly the size of a single tick
  const yBufferMin = yInterval * 0.3;

  // tooltip trigger area gets smaller with more series
  if (totalSeries > SHOW_FEWER_SERIES_LIMIT) {
    const adjustedBuffer = (yInterval * DYNAMIC_NEARBY_SERIES_MULTIPLIER) / totalSeries;
    return Math.max(yBufferMin, adjustedBuffer);
  }

  // increase multiplier to expand nearby series range
  return Math.max(yBufferMin, yInterval * INCREASE_NEARBY_SERIES_MULTIPLIER);
}
