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
export function clearHighlightedSeries(chart: EChartsInstance, totalSeries: number) {
  if (chart.dispatchAction !== undefined) {
    for (let i = 0; i < totalSeries; i++) {
      chart.dispatchAction({
        type: 'downplay',
        seriesIndex: i,
      });
    }
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
