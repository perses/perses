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
import useResizeObserver from 'use-resize-observer';
import { useEffect, useRef, MouseEvent, useState } from 'react';
import { Span } from '@perses-dev/core';
import { Ticks } from '../Ticks';
import { Viewport } from '../utils';
import { drawSpans } from './draw';

const CANVAS_HEIGHT = 60;

interface CanvasProps {
  rootSpan: Span;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
}

type MouseState =
  | { type: 'none' }
  | { type: 'resize'; fixedPoint: number }
  | { type: 'drag'; start: number; end: number };

export function Canvas(props: CanvasProps) {
  const { rootSpan, viewport, setViewport } = props;
  // the <canvas> element must have an absolute width and height to avoid rendering problems
  // the wrapper box is required to get the available dimensions for the <canvas> element
  const { width, ref: wrapperRef } = useResizeObserver();
  const height = CANVAS_HEIGHT;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouseState, setMouseState] = useState<MouseState>({ type: 'none' });

  const traceDuration = rootSpan.endTimeUnixMs - rootSpan.startTimeUnixMs;
  const relativeCutoffLeft = (viewport.startTimeUnixMs - rootSpan.startTimeUnixMs) / traceDuration;
  const relativeCutoffRight = (rootSpan.endTimeUnixMs - viewport.endTimeUnixMs) / traceDuration;

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
    return rootSpan.startTimeUnixMs + translatePxToTime(offsetX);
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!(e.target instanceof HTMLElement)) return;

    const isDefaultViewport =
      viewport.startTimeUnixMs === rootSpan.startTimeUnixMs && viewport.endTimeUnixMs === rootSpan.endTimeUnixMs;
    const elem = e.target.dataset['elem'];
    const cursor = translateCursorToTime(e);

    if (elem === 'resizerLeft') {
      setMouseState({ type: 'resize', fixedPoint: viewport.endTimeUnixMs });
    } else if (elem === 'resizerRight') {
      setMouseState({ type: 'resize', fixedPoint: viewport.startTimeUnixMs });
    } else if (elem === 'cutoffBox' || isDefaultViewport) {
      setMouseState({ type: 'resize', fixedPoint: cursor });
      setViewport({ startTimeUnixMs: cursor, endTimeUnixMs: cursor });
    } else {
      setMouseState({
        type: 'drag',
        start: cursor - viewport.startTimeUnixMs,
        end: viewport.endTimeUnixMs - cursor,
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
          setViewport({ startTimeUnixMs: pointA, endTimeUnixMs: pointB });
        } else {
          setViewport({ startTimeUnixMs: pointB, endTimeUnixMs: pointA });
        }
        return;
      }

      case 'drag': {
        // avoid using e.movementX here, as it skips events in chrome,
        // resulting in the mouse pointer moving faster than the viewport box
        const { start, end } = mouseState;
        let cursor = translateCursorToTime(e);

        if (cursor - start < rootSpan.startTimeUnixMs) {
          cursor = rootSpan.startTimeUnixMs + start;
        }
        if (cursor + end > rootSpan.endTimeUnixMs) {
          cursor = rootSpan.endTimeUnixMs - end;
        }

        setViewport({
          startTimeUnixMs: cursor - start,
          endTimeUnixMs: cursor + end,
        });
        return;
      }
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    setMouseState({ type: 'none' });

    // reset viewport if start === end, i.e. a click without movement
    if (viewport.startTimeUnixMs === viewport.endTimeUnixMs) {
      setViewport({ startTimeUnixMs: rootSpan.startTimeUnixMs, endTimeUnixMs: rootSpan.endTimeUnixMs });
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
