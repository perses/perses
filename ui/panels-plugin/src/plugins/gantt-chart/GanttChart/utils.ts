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

import { Theme } from '@mui/material';
import { Span, SpanStatusError } from '@perses-dev/core';
import { getConsistentColor } from '../../../model/palette';

/**
 * Viewport contains the current zoom, i.e. which timeframe of the trace should be visible
 */
export interface Viewport {
  startTimeUnixMs: number;
  endTimeUnixMs: number;
}

export const rowHeight = '30px';
export const rowHeaderColor = (theme: Theme) => theme.palette.grey.A100;
export const gridColor = (theme: Theme) => theme.palette.grey[100];
export const spanHasError = (span: Span) => span.status?.code === SpanStatusError;
export const getConsistentServiceColor = (serviceName: string) => getConsistentColor(serviceName, false);
export const getConsistentSpanColor = (span: Span) => getConsistentColor(span.resource.serviceName, spanHasError(span));

export function formatDuration(timeMs: number) {
  if (timeMs < 1) {
    return `${Math.round(timeMs * 1000)}μs`;
  }
  if (timeMs < 1000) {
    return `${timeMs.toFixed(0)}ms`;
  }
  return `${+(timeMs / 1000).toFixed(2)}s`;
}
