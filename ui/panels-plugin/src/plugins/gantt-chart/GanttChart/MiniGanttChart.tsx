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

import { Box, useTheme } from '@mui/material';
import useResizeObserver from 'use-resize-observer';
import { useEffect, useRef } from 'react';
import { Span } from './model';
import { Ticks, TicksHeader } from './Ticks';
import { rowHeight } from './utils';

const CANVAS_HEIGHT = 60;
const MIN_BAR_HEIGHT = 1;
const MAX_BAR_HEIGHT = 7;

interface MiniGanttChartProps {
  rootSpan: Span;
}

export function MiniGanttChart(props: MiniGanttChartProps) {
  const { rootSpan } = props;
  const { width: canvasWidth, height: canvasHeight, ref: canvasWrapperRef } = useResizeObserver();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!canvasRef.current || !canvasWidth || !canvasHeight) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const numSpans = countSpans(rootSpan);
    // calculate optimal height, enforce min and max bar height and finally round to an integer
    const barHeight = Math.round(Math.min(Math.max(canvasHeight / numSpans, MIN_BAR_HEIGHT), MAX_BAR_HEIGHT));

    const viewportDuration = rootSpan.endTimeUnixNano - rootSpan.startTimeUnixNano;
    let y = 0;
    const drawSpan = (span: Span) => {
      const spanDuration = span.endTimeUnixNano - span.startTimeUnixNano;
      const relativeDuration = spanDuration / viewportDuration;
      const relativeStart = (span.startTimeUnixNano - rootSpan.startTimeUnixNano) / viewportDuration;

      ctx.fillStyle = span.resource.color;
      ctx.fillRect(Math.round(relativeStart * canvasWidth), y, Math.round(relativeDuration * canvasWidth), barHeight);
      y += barHeight;

      // out of canvas
      if (y > canvasHeight) return;

      for (const childSpan of span.children) {
        drawSpan(childSpan);
      }
    };

    drawSpan(rootSpan);
  }, [canvasWidth, canvasHeight, rootSpan]);

  return (
    <Box sx={{ padding: '10px' }}>
      <Box sx={{ position: 'relative', height: rowHeight, backgroundColor: theme.palette.grey.A100 }}>
        <TicksHeader rootSpan={rootSpan} viewport={rootSpan} />
      </Box>
      <Box ref={canvasWrapperRef} sx={{ position: 'relative', height: CANVAS_HEIGHT }}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ position: 'absolute', border: `1px solid ${theme.palette.grey[400]}` }}
        />
        <Ticks />
      </Box>
    </Box>
  );
}

function countSpans(span: Span) {
  let n = 1;
  for (const childSpan of span.children) {
    n += countSpans(childSpan);
  }
  return n;
}
