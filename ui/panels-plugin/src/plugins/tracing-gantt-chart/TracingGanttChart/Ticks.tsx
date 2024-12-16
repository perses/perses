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

import { Box, styled } from '@mui/material';
import { ReactElement } from 'react';
import { Viewport, formatDuration } from './utils';
import { GanttTrace } from './trace';

export interface TicksHeaderProps {
  trace: GanttTrace;
  viewport: Viewport;
}

/**
 * TicksHeader renders all tick labels in the header
 */
export function TicksHeader(props: TicksHeaderProps): ReactElement {
  const { trace, viewport } = props;

  const duration = viewport.endTimeUnixMs - viewport.startTimeUnixMs;
  const startAt = viewport.startTimeUnixMs - trace.startTimeUnixMs;

  return (
    <>
      <TickBox style={{ left: '0%', borderWidth: 0 }}>{formatDuration(startAt + duration * 0)}</TickBox>
      <TickBox style={{ left: '25%' }}>{formatDuration(startAt + duration * 0.25)}</TickBox>
      <TickBox style={{ left: '50%' }}>{formatDuration(startAt + duration * 0.5)}</TickBox>
      <TickBox style={{ left: '75%' }}>{formatDuration(startAt + duration * 0.75)}</TickBox>
      <TickBox style={{ left: '100%' }}>
        <span style={{ position: 'absolute', right: '.75rem' }}>{formatDuration(startAt + duration * 1)}</span>
      </TickBox>
    </>
  );
}

/**
 * Ticks renders all ticks in the span duration
 */
export function Ticks(): ReactElement {
  return (
    <>
      <TickBox style={{ left: '25%' }} />
      <TickBox style={{ left: '50%' }} />
      <TickBox style={{ left: '75%' }} />
    </>
  );
}

const TickBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  height: '100%',
  borderLeft: `1px solid ${theme.palette.divider}`,
  padding: '.25rem',
}));
