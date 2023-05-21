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
import { FocusedSeriesArray } from './focused-series';

export const TOOLTIP_MAX_WIDTH = 650;
export const TOOLTIP_MAX_HEIGHT = 600;
export const TOOLTIP_LABELS_MAX_WIDTH = TOOLTIP_MAX_WIDTH - 150;

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

export const emptyTooltipData = {
  cursor: defaultCursorData,
  focusedSeries: null,
};

export interface CursorCoordinates {
  page: {
    x: number;
    y: number;
  };
  client: {
    x: number;
    y: number;
  };
  plotCanvas: {
    x: number;
    y: number;
  };
  zrender: {
    x?: number;
    y?: number;
  };
  target: EventTarget | null;
}

export interface CursorData {
  coords: CursorCoordinates | null;
  chartWidth?: number;
}

export interface TooltipData {
  focusedSeries: FocusedSeriesArray | null;
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
          x: e.offsetX,
          y: e.offsetY,
        },
        zrender: {
          // echarts canvas coordinates added automatically by zrender
          // zrX and zrY are similar to offsetX and offsetY but they return undefined when not hovering over a chart canvas
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
