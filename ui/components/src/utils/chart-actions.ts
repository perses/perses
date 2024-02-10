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

import { ECharts as EChartsInstance } from 'echarts/core';
import { TimeSeries, TimeSeriesValueTuple } from '@perses-dev/core';
import { DatapointInfo, PINNED_CROSSHAIR_SERIES_NAME, TimeChartSeriesMapping } from '../model';

export interface ZoomEventData {
  start: number;
  end: number;
  // TODO: remove startIndex and endIndex once LineChart is deprecated
  startIndex?: number;
  endIndex?: number;
}

/**
 * Enable dataZoom without requring user to click toolbox icon.
 * https://stackoverflow.com/questions/57183297/is-there-a-way-to-use-zoom-of-type-select-without-showing-the-toolbar
 */
export function enableDataZoom(chart: EChartsInstance) {
  const chartModel = chart['_model'];
  if (chartModel === undefined) return;
  if (chartModel.option.toolbox !== undefined && chartModel.option.toolbox.length > 0) {
    // check if hidden data zoom icon is unselected (if selected it would be 'emphasis' instead of 'normal')
    if (chartModel.option.toolbox[0].feature.dataZoom.iconStatus.zoom === 'normal') {
      chart.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'dataZoomSelect',
        dataZoomSelectActive: true,
      });
    }
  }
}

/**
 * Restore chart to original state before zoom or other actions were dispatched
 */
export function restoreChart(chart: EChartsInstance) {
  // TODO: support incremental unzoom instead of restore to original state
  chart.dispatchAction({
    type: 'restore', // https://echarts.apache.org/en/api.html#events.restore
  });
}

/*
 * Clear all highlighted series when cursor exits canvas
 * https://echarts.apache.org/en/api.html#action.downplay
 */
export function clearHighlightedSeries(chart: EChartsInstance) {
  if (chart.dispatchAction !== undefined) {
    // Clear any selected data points
    chart.dispatchAction({
      type: 'unselect',
    });

    // Clear any highlighted series
    chart.dispatchAction({
      type: 'downplay',
    });
  }
}

/*
 * Convert a point from pixel coordinate to logical coordinate.
 * Used to determine if cursor is over chart canvas and closest datapoint.
 * https://echarts.apache.org/en/api.html#echartsInstance.convertFromPixel
 */
export function getPointInGrid(cursorCoordX: number, cursorCoordY: number, chart?: EChartsInstance) {
  if (chart === undefined) {
    return null;
  }

  const pointInPixel = [cursorCoordX, cursorCoordY];
  if (!chart.containPixel('grid', pointInPixel)) {
    return null;
  }

  const pointInGrid: number[] = chart.convertFromPixel('grid', pointInPixel);
  return pointInGrid;
}

/*
 * TimeSeriesChart tooltip is built custom to support finding nearby series instead of single or all series.
 * This means ECharts actions need to be dispatched manually for series highlighting, datapoint select state, etc.
 * More info: https://echarts.apache.org/en/api.html#action
 */
export function batchDispatchNearbySeriesActions(
  chart: EChartsInstance,
  nearbySeriesIndexes: number[],
  emphasizedSeriesIndexes: number[],
  nonEmphasizedSeriesIndexes: number[],
  emphasizedDatapoints: DatapointInfo[],
  duplicateDatapoints: DatapointInfo[]
) {
  // Accounts for multiple series that are rendered direct on top of eachother.
  // Only applies select state to the datapoint that is visible to avoid color mismatch.
  const lastEmphasizedDatapoint =
    duplicateDatapoints.length > 0
      ? duplicateDatapoints[duplicateDatapoints.length - 1]
      : emphasizedDatapoints[emphasizedDatapoints.length - 1];
  if (lastEmphasizedDatapoint !== undefined) {
    // Corresponds to select options inside getTimeSeries util.
    // https://echarts.apache.org/en/option.html#series-line.select.itemStyle
    chart.dispatchAction({
      type: 'select',
      seriesIndex: lastEmphasizedDatapoint.seriesIndex,
      dataIndex: lastEmphasizedDatapoint.dataIndex,
      // Shared crosshair should not emphasize datapoints on adjacent charts.
      escapeConnect: true, // TODO: try to remove escapeConnect and match by seriesName for cross panel correlation
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

    // Clears selected datapoints since no bold series in tooltip, restore does not impact highlighting
    chart.dispatchAction({
      type: 'toggleSelect', // https://echarts.apache.org/en/api.html#action.toggleSelect
    });
  }
}

/*
 * Determine whether a markLine was pushed into the final series, which means crosshair was already pinned onClick
 */
export function checkCrosshairPinnedStatus(seriesMapping: TimeChartSeriesMapping) {
  const isCrosshairPinned = seriesMapping[seriesMapping.length - 1]?.name === PINNED_CROSSHAIR_SERIES_NAME;
  return isCrosshairPinned;
}

/*
 * Find closest timestamp to logical x coordinate returned from echartsInstance.convertFromPixel
 * Used to find nearby series in time series tooltip.
 */
export function getClosestTimestamp(timeSeriesValues?: TimeSeriesValueTuple[], cursorX?: number): number | null {
  if (timeSeriesValues === undefined || cursorX === undefined) {
    return null;
  }

  let currentClosestTimestamp: number | null = null;
  let currentClosestDistance = Infinity;

  for (const [timestamp] of timeSeriesValues) {
    const distance = Math.abs(timestamp - cursorX);
    if (distance < currentClosestDistance) {
      currentClosestTimestamp = timestamp;
      currentClosestDistance = distance;
    }
  }
  return currentClosestTimestamp;
}

/*
 * Find closest timestamp in full dataset, used to snap crosshair into place onClick when tooltip is pinned.
 */
export function getClosestTimestampInFullDataset(data: TimeSeries[], cursorX?: number): number | null {
  if (cursorX === undefined) {
    return null;
  }
  const totalSeries = data.length;
  let closestTimestamp = null;
  for (let seriesIdx = 0; seriesIdx < totalSeries; seriesIdx++) {
    const currentDataset = totalSeries > 0 ? data[seriesIdx] : null;
    if (currentDataset == null) break;
    const currentValues: TimeSeriesValueTuple[] = currentDataset.values;
    closestTimestamp = getClosestTimestamp(currentValues, cursorX);
  }
  return closestTimestamp;
}
