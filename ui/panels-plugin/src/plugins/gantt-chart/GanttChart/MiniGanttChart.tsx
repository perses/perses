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

import { Box, styled, useTheme } from '@mui/material';
import useResizeObserver from 'use-resize-observer';
import { useEffect, useRef, MouseEvent, useState } from 'react';
import { Span, Viewport } from './model';
import { Ticks, TicksHeader } from './Ticks';
import { rowHeaderColor, rowHeight } from './utils';

const CANVAS_HEIGHT = 60;
const MIN_BAR_HEIGHT = 1;
const MAX_BAR_HEIGHT = 7;

interface MiniGanttChartProps {
  rootSpan: Span;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
}

export function MiniGanttChart(props: MiniGanttChartProps) {
  const { rootSpan, viewport, setViewport } = props;
  const theme = useTheme();

  return (
    <Box sx={{ marginBottom: '20px', border: `1px solid ${rowHeaderColor(theme)}` }}>
      <Box sx={{ position: 'relative', height: rowHeight, backgroundColor: rowHeaderColor(theme) }}>
        <TicksHeader rootSpan={rootSpan} viewport={rootSpan} />
      </Box>
      <Canvas rootSpan={rootSpan} viewport={viewport} setViewport={setViewport} />
    </Box>
  );
}

interface CanvasProps {
  rootSpan: Span;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
}

type MouseState =
  | { type: 'none' }
  | { type: 'resize'; fixedPoint: number }
  | { type: 'drag'; start: number; end: number };

function Canvas(props: CanvasProps) {
  const { rootSpan, viewport, setViewport } = props;
  // the <canvas> element must have an absolute width and height to avoid rendering problems
  // the wrapper box is required to get the available dimensions for the <canvas> element
  const { width, ref: wrapperRef } = useResizeObserver();
  const height = CANVAS_HEIGHT;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouseState, setMouseState] = useState<MouseState>({ type: 'none' });

  const traceDuration = rootSpan.endTimeUnixNano - rootSpan.startTimeUnixNano;
  const relativeCutoffLeft = (viewport.startTimeUnixNano - rootSpan.startTimeUnixNano) / traceDuration;
  const relativeCutoffRight = (rootSpan.endTimeUnixNano - viewport.endTimeUnixNano) / traceDuration;

  useEffect(() => {
    if (!canvasRef.current || !width || !height) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    drawSpans(ctx, width, height, rootSpan);
  }, [width, height, rootSpan]);

  const translatePxToTime = (px: number) => {
    if (!width) return 0;
    return (px / width) * traceDuration;
  };

  const translateCursorToTime = (e: MouseEvent) => {
    if (!canvasRef.current) return 0;
    // e.nativeEvent.offsetX doesn't work when sliding over a tick box
    const offsetX = e.clientX - canvasRef.current.getBoundingClientRect().left;
    return rootSpan.startTimeUnixNano + translatePxToTime(offsetX);
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!(e.target instanceof HTMLElement)) return;

    const isDefaultViewport =
      viewport.startTimeUnixNano === rootSpan.startTimeUnixNano &&
      viewport.endTimeUnixNano === rootSpan.endTimeUnixNano;
    const elem = e.target.dataset['elem'];
    const cursor = translateCursorToTime(e);

    if (elem === 'resizerLeft') {
      setMouseState({ type: 'resize', fixedPoint: viewport.endTimeUnixNano });
    } else if (elem === 'resizerRight') {
      setMouseState({ type: 'resize', fixedPoint: viewport.startTimeUnixNano });
    } else if (elem === 'cutoffBox' || isDefaultViewport) {
      setMouseState({ type: 'resize', fixedPoint: cursor });
      setViewport({ startTimeUnixNano: cursor, endTimeUnixNano: cursor });
    } else {
      setMouseState({
        type: 'drag',
        start: cursor - viewport.startTimeUnixNano,
        end: viewport.endTimeUnixNano - cursor,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault();

    switch (mouseState.type) {
      case 'none':
        return;

      case 'resize': {
        const pointA = mouseState.fixedPoint;
        const pointB = translateCursorToTime(e);
        if (pointA < pointB) {
          setViewport({ startTimeUnixNano: pointA, endTimeUnixNano: pointB });
        } else {
          setViewport({ startTimeUnixNano: pointB, endTimeUnixNano: pointA });
        }
        return;
      }

      case 'drag': {
        // avoid using e.movementX here, as it skips events in chrome,
        // resulting in the mouse pointer moving faster than the viewport box
        const { start, end } = mouseState;
        let cursor = translateCursorToTime(e);

        if (cursor - start < rootSpan.startTimeUnixNano) {
          cursor = rootSpan.startTimeUnixNano + start;
        }
        if (cursor + end > rootSpan.endTimeUnixNano) {
          cursor = rootSpan.endTimeUnixNano - end;
        }

        setViewport({
          startTimeUnixNano: cursor - start,
          endTimeUnixNano: cursor + end,
        });
        return;
      }
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    setMouseState({ type: 'none' });

    // reset viewport if start === end, i.e. a click without movement
    if (viewport.startTimeUnixNano === viewport.endTimeUnixNano) {
      setViewport({ startTimeUnixNano: rootSpan.startTimeUnixNano, endTimeUnixNano: rootSpan.endTimeUnixNano });
    }
  };

  return (
    <Box
      ref={wrapperRef}
      sx={{ position: 'relative', height }}
      style={{ cursor: mouseState.type === 'none' ? 'inherit' : mouseState.type === 'resize' ? 'col-resize' : 'move' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} width={width} height={height} style={{ position: 'absolute' }} />
      <Ticks skipFirstLast={true} />
      <CutoffBox data-elem="cutoffBox" style={{ left: 0, width: `${relativeCutoffLeft * 100}%` }} />
      <Resizer data-elem="resizerLeft" style={{ left: `${relativeCutoffLeft * 100}%` }} />
      <Resizer data-elem="resizerRight" style={{ right: `${relativeCutoffRight * 100}%` }} />
      <CutoffBox data-elem="cutoffBox" style={{ right: 0, width: `${relativeCutoffRight * 100}%` }} />
    </Box>
  );
}

const CutoffBox = styled(Box)({
  position: 'absolute',
  height: '100%',
  backgroundColor: 'rgba(225, 225, 225, .5)',
});

const Resizer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  height: '100%',
  backgroundColor: theme.palette.grey[700],
  width: '2px',
  cursor: 'col-resize',
}));

function countSpans(span: Span) {
  let n = 1;
  for (const childSpan of span.children) {
    n += countSpans(childSpan);
  }
  return n;
}

function drawSpans(ctx: CanvasRenderingContext2D, width: number, height: number, rootSpan: Span) {
  // calculate optimal height, enforce min and max bar height and finally round to an integer
  const numSpans = countSpans(rootSpan);
  const barHeight = Math.round(Math.min(Math.max(height / numSpans, MIN_BAR_HEIGHT), MAX_BAR_HEIGHT));

  const traceDuration = rootSpan.endTimeUnixNano - rootSpan.startTimeUnixNano;
  let y = 0;

  const drawSpan = (span: Span) => {
    const spanDuration = span.endTimeUnixNano - span.startTimeUnixNano;
    const relativeDuration = spanDuration / traceDuration;
    const relativeStart = (span.startTimeUnixNano - rootSpan.startTimeUnixNano) / traceDuration;

    ctx.fillStyle = span.resource.color;
    ctx.beginPath();
    ctx.rect(Math.round(relativeStart * width), y, Math.round(relativeDuration * width), barHeight);
    ctx.fill();
    y += barHeight;

    // stop painting when out of canvas
    if (y > height) return;

    for (const childSpan of span.children) {
      drawSpan(childSpan);
    }
  };

  drawSpan(rootSpan);
}
