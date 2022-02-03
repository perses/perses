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

import { FocusedSeriesArray } from '../utils/focused-series';

export const TOOLTIP_MAX_WIDTH = 700;
export const TOOLTIP_MAX_HEIGHT = 600;

export const TOOLTIP_MAX_ITEMS = 50;

export const TOOLTIP_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: true,
});

export const defaultCursorData = {
  coords: {
    plotCanvas: {
      x: 0,
      y: 0,
    },
    viewport: {
      x: 0,
      y: 0,
    },
  },
  chartWidth: 0,
  focusedSeriesIdx: null,
  focusedPointIdx: null,
};

export const emptyTooltipData = {
  cursor: defaultCursorData,
  focusedSeries: null, //[{ seriesIdx: null, datumIdx: null, date: '', seriesName: '', x: 0, y: 0, markerColor: '' }],
};

export interface Coordinate {
  x: number;
  y: number;
}

export interface CursorData {
  coords: {
    plotCanvas: Coordinate;
    viewport: Coordinate;
  };
  chartWidth: number;
  focusedSeriesIdx: number | null;
  focusedPointIdx: number | null;
}

export interface TooltipData {
  focusedSeries: FocusedSeriesArray | null;
  cursor: CursorData;
}
