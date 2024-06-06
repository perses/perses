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

import { Box, Theme, useTheme } from '@mui/material';
import { formatTime, gridColor } from './utils';
import { Span, Viewport } from './model';

export const tickStyle = (theme: Theme, pos: number): React.CSSProperties => ({
  position: 'absolute',
  height: '100%',
  left: `${pos}%`,
  display: 'flex',
  alignItems: 'center',
  borderLeft: `1px solid ${gridColor(theme)}`,
  padding: '.25rem',
});

interface TicksHeaderProps {
  rootSpan: Span;
  viewport: Viewport;
}

/**
 * TicksHeader renders all tick labels in the header
 */
export function TicksHeader(props: TicksHeaderProps) {
  const { rootSpan, viewport } = props;
  const theme = useTheme();

  const duration = viewport.endTimeUnixNano - viewport.startTimeUnixNano;
  const startAt = viewport.startTimeUnixNano - rootSpan.startTimeUnixNano;

  return (
    <>
      <Box style={tickStyle(theme, 0)}>{formatTime(startAt + duration * 0)}</Box>
      <Box style={tickStyle(theme, 25)}>{formatTime(startAt + duration * 0.25)}</Box>
      <Box style={tickStyle(theme, 50)}>{formatTime(startAt + duration * 0.5)}</Box>
      <Box style={tickStyle(theme, 75)}>{formatTime(startAt + duration * 0.75)}</Box>
      <Box style={tickStyle(theme, 100)}>
        <span style={{ position: 'absolute', right: '.75rem' }}>{formatTime(startAt + duration * 1)}</span>
      </Box>
    </>
  );
}

/**
 * Ticks renders all ticks in the span duration
 */
export function Ticks() {
  const theme = useTheme();
  return (
    <>
      <Box style={tickStyle(theme, 0)} />
      <Box style={tickStyle(theme, 25)} />
      <Box style={tickStyle(theme, 50)} />
      <Box style={tickStyle(theme, 75)} />
      <Box style={tickStyle(theme, 100)} />
    </>
  );
}
