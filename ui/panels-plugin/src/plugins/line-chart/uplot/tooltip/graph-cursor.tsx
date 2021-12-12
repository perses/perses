// Copyright 2021 The Perses Authors
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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AlignedData, Series } from 'uplot';
import { usePlotContext } from '../UPlotContext';
import { TooltipSeriesInfo } from './graph-tooltip';

interface Coordinate {
  x: number;
  y: number;
}

export interface GraphCursorPositionValues {
  focusedSeriesIdx: number | null;
  focusedPointIdx: number | null;

  coords: {
    plotCanvas: Coordinate; // coords relative to plot canvas, css px
    viewport: Coordinate; // coords relative to viewport , css px
  };
}

/**
 * Exposes API for the Graph cursor position
 */
export function useGraphCursorPosition(): GraphCursorPositionValues | null {
  const { plotCanvas, addPlotEventListeners } = usePlotContext();
  const plotCanvasBBox = useRef({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
  });

  // nearest time series to the cursor
  const [focusedSeriesIdx, setFocusedSeriesIdx] = useState<number | null>(null);
  // nearest x-value to the cursor
  const [focusedPointIdx, setFocusedPointIdx] = useState<number | null>(null);
  const [coords, setCoords] = useState<{
    viewport: Coordinate;
    plotCanvas: Coordinate;
  } | null>(null);

  const clearCoords = useCallback(() => {
    setCoords(null);
  }, [setCoords]);

  useEffect(() => {
    const onMouseCapture = (e: MouseEvent) => {
      setCoords({
        plotCanvas: {
          x: e.clientX - plotCanvasBBox.current.left,
          y: e.clientY - plotCanvasBBox.current.top,
        },
        viewport: {
          x: e.clientX,
          y: e.clientY,
        },
      });
    };

    if (plotCanvas) {
      plotCanvasBBox.current = plotCanvas.getBoundingClientRect();
      plotCanvas.addEventListener('mousemove', onMouseCapture);
      plotCanvas.addEventListener('mouseleave', clearCoords);
    }

    return () => {
      if (plotCanvas) {
        plotCanvas.removeEventListener('mousemove', onMouseCapture);
      }
    };
  }, [plotCanvas, clearCoords]);

  // on mount - initialize plugin listeners
  useEffect(() => {
    const unregister = addPlotEventListeners('cursor', {
      // What is the nearest x value to the cursor
      setCursor: ({ cursor }) => {
        setFocusedPointIdx(cursor.idx === undefined ? null : cursor.idx);
      },
      // What is the nearest y-value and what series is it in
      setSeries: (u, index) => {
        setFocusedSeriesIdx(index);
      },
    });

    return () => {
      unregister();
    };
  }, [addPlotEventListeners]);

  // only render children if we are interacting with the canvas
  return coords
    ? {
        focusedSeriesIdx,
        focusedPointIdx,
        coords,
      }
    : null;
}

/**
 * Since the uPlot only finds a single series, this method finds
 * all values that are equal to the cursor's focused value.
 *
 * @param focusedSeriesIdx The index of the series that is focused by the cursor
 * @param focusedPointIdx The current index along the x axis
 */
export function getOverlappingSeriesIndices(
  focusedSeriesIdx: number | null,
  focusedPointIdx: number | null,
  data: AlignedData
) {
  const overlappingIndices: number[] = [];

  if (focusedSeriesIdx === null || focusedPointIdx === null) {
    return overlappingIndices;
  }

  const dataFocusedSeriesIdx = data[focusedSeriesIdx];
  if (dataFocusedSeriesIdx) {
    const focusedValue = dataFocusedSeriesIdx[focusedPointIdx];
    for (let seriesIdx = 0; seriesIdx < data.length; seriesIdx++) {
      const dataSeriesIdx = data[seriesIdx];
      if (dataSeriesIdx && dataSeriesIdx[focusedPointIdx] === focusedValue) {
        overlappingIndices.push(seriesIdx);
      }
    }
  }

  return overlappingIndices;
}

export function getFocusedSeriesInfo(
  overlappingIndices: number[],
  focusedPointIdx: number | null,
  series: Series[],
  data: AlignedData
) {
  const focusedSeries: TooltipSeriesInfo[] = [];
  if (focusedPointIdx === null) {
    return focusedSeries;
  }
  for (const seriesIdx of overlappingIndices) {
    const overlapSeries = series[seriesIdx];
    const label = overlapSeries && overlapSeries.label !== undefined ? overlapSeries.label : '';

    let y = 0;
    if (data[seriesIdx]) {
      const seriesData = data[seriesIdx] ?? [];
      y = seriesData[focusedPointIdx] ?? 0;
    }

    focusedSeries.push({ y, name: label ?? '', seriesId: label ?? '' });
  }
  return focusedSeries;
}

export function useOverlappingSeries(cursor: GraphCursorPositionValues | null, series: Series[], data: AlignedData) {
  return useMemo(() => {
    if (cursor === null || cursor?.focusedPointIdx === null || cursor?.focusedSeriesIdx === null) return [];
    const { focusedSeriesIdx, focusedPointIdx } = cursor;
    const overlappingSeriesIndices = getOverlappingSeriesIndices(focusedSeriesIdx, focusedPointIdx, data);
    return getFocusedSeriesInfo(overlappingSeriesIndices, focusedPointIdx, series, data);
  }, [data, cursor, series]);
}
