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

import { useEffect, useState } from 'react';
import { NearbySeriesArray } from './nearby-series';

export const TOOLTIP_MIN_WIDTH = 375;
export const TOOLTIP_MAX_WIDTH = 650;
export const TOOLTIP_MAX_HEIGHT = 650;
export const TOOLTIP_LABELS_MAX_WIDTH = TOOLTIP_MAX_WIDTH - 150;
export const TOOLTIP_ADJUST_Y_POS_MULTIPLIER = 0.75;
export const TOOLTIP_PADDING = 8;

export const FALLBACK_CHART_WIDTH = 750;

export const NEARBY_SERIES_DESCRIPTION = 'nearby series showing in tooltip';
export const EMPHASIZED_SERIES_DESCRIPTION = 'emphasized series showing as bold in tooltip';

export const TOOLTIP_BG_COLOR_FALLBACK = '#2E313E';

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
    zrender: {
      x: 0,
      y: 0,
    },
    target: null,
  },
  chartWidth: 0,
};

export const EMPTY_TOOLTIP_DATA: NearbySeriesArray = [];

/**
 * ECharts is built with zrender, zrX and zrY are undefined when not hovering over a chart canvas
 */
export interface ZRCoordinate {
  x?: number;
  y?: number;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface CursorCoordinates {
  page: Coordinate;
  client: Coordinate;
  plotCanvas: ZRCoordinate;
  target: EventTarget | null;
}

export interface CursorData {
  coords: CursorCoordinates | null;
  chartWidth?: number;
}

export interface TooltipData {
  focusedSeries: NearbySeriesArray | null;
  cursor: CursorData;
}

type ZREventProperties = {
  zrX?: number;
  zrY?: number;
  zrDelta?: number;
  zrEventControl?: 'no_globalout' | 'only_globalout';
  zrByTouch?: boolean;
};

export type ZRRawMouseEvent = MouseEvent & ZREventProperties;

export const useMousePosition = (): CursorData['coords'] => {
  const [coords, setCoords] = useState<CursorData['coords']>(null);

  useEffect(() => {
    const setFromEvent = (e: ZRRawMouseEvent) => {
      return setCoords({
        page: {
          x: e.pageX,
          y: e.pageY,
        },
        client: {
          x: e.clientX,
          y: e.clientY,
        },
        plotCanvas: {
          // Always use zrender mousemove coords since they handle browser inconsistencies for us
          // ex: Firefox and Chrome have slightly different implementations of offsetX and offsetY
          // more info: https://github.com/ecomfe/zrender/blob/5.5.0/src/core/event.ts#L46-L120
          x: e.zrX,
          y: e.zrY,
        },
        // necessary to check whether cursor target matches correct chart canvas (since each chart has its own mousemove listener)
        target: e.target,
      });
    };
    window.addEventListener('mousemove', setFromEvent);

    return () => {
      window.removeEventListener('mousemove', setFromEvent);
    };
  }, []);

  return coords;
};

export type TooltipConfig = {
  wrapLabels: boolean;
  hidden?: boolean;
  enablePinning?: boolean;
};

export const DEFAULT_TOOLTIP_CONFIG: TooltipConfig = {
  wrapLabels: true,
  enablePinning: true,
};

export const PIN_TOOLTIP_HELP_TEXT = 'Click chart to pin';

export const UNPIN_TOOLTIP_HELP_TEXT = 'Click chart to unpin';
