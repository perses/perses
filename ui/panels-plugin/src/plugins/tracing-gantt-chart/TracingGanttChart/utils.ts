// Copyright 2024 The Perses Authors
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

import { Span, SpanStatusError } from '@perses-dev/core';
import { PersesChartsTheme } from '@perses-dev/components';
import { Theme } from '@mui/material';
import { getConsistentCategoricalColor, getConsistentColor } from '../../../model/palette';

/**
 * Viewport contains the current zoom, i.e. which timeframe of the trace should be visible
 */
export interface Viewport {
  startTimeUnixMs: number;
  endTimeUnixMs: number;
}

export const rowHeight = '2rem';
export const spanHasError = (span: Span) => span.status?.code === SpanStatusError;

export function getServiceColor(
  muiTheme: Theme,
  chartsTheme: PersesChartsTheme,
  paletteMode: 'auto' | 'categorical' | undefined,
  serviceName: string,
  error = false
) {
  switch (paletteMode) {
    case 'categorical': {
      // ECharts type for color is not always an array but it is always an array in ChartsProvider
      const categoricalPalette = chartsTheme.echartsTheme.color as string[];
      const errorPalette = [muiTheme.palette.error.light, muiTheme.palette.error.main, muiTheme.palette.error.dark];
      return getConsistentCategoricalColor(serviceName, error, categoricalPalette, errorPalette);
    }

    default:
      return getConsistentColor(serviceName, error);
  }
}

export function getSpanColor(
  muiTheme: Theme,
  chartsTheme: PersesChartsTheme,
  paletteMode: 'auto' | 'categorical' | undefined,
  span: Span
) {
  return getServiceColor(muiTheme, chartsTheme, paletteMode, span.resource.serviceName, spanHasError(span));
}

export function formatDuration(timeMs: number) {
  if (timeMs < 1) {
    return `${Math.round(timeMs * 1000)}μs`;
  }
  if (timeMs < 1000) {
    return `${+timeMs.toFixed(2)}ms`;
  }
  return `${+(timeMs / 1000).toFixed(2)}s`;
}
