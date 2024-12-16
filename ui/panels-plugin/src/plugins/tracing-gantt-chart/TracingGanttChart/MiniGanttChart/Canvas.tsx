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
import { useEffect, useRef, MouseEvent as ReactMouseEvent, useState, useCallback, ReactElement } from 'react';
import { Span, useEvent } from '@perses-dev/core';
import { useChartsTheme } from '@perses-dev/components';
import { Ticks } from '../Ticks';
import { getSpanColor, Viewport } from '../utils';
import { TracingGanttChartOptions } from '../../gantt-chart-model';
import { GanttTrace } from '../trace';
import { drawSpans } from './draw';

const CANVAS_HEIGHT = 60;

interface CanvasProps {
  options: TracingGanttChartOptions;
  trace: GanttTrace;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
}

type MouseState =
  | { type: 'none' }
  | { type: 'resize'; fixedPoint: number }
  | { type: 'drag'; start: number; end: number };

export function Canvas(props: CanvasProps): ReactElement {
  const { options, trace, viewport, setViewport } = props;
  const muiTheme = useTheme();
  const chartsTheme = useChartsTheme();
  // the <canvas> element must have an absolute width and height to avoid rendering problems
  // the wrapper box is required to get the available dimensions for the <canvas> element
  const { width, ref: wrapperRef } = useResizeObserver();
  const height = CANVAS_HEIGHT;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouseState, setMouseState] = useState<MouseState>({ type: 'none' });

  const traceDuration = trace.endTimeUnixMs - trace.startTimeUnixMs;
  const relativeCutoffLeft = (viewport.startTimeUnixMs - trace.startTimeUnixMs) / traceDuration;
  const relativeCutoffRight = (trace.endTimeUnixMs - viewport.endTimeUnixMs) / traceDuration;

  const spanColorGenerator = useCallback(
    (span: Span) => getSpanColor(muiTheme, chartsTheme, options.visual?.palette?.mode, span),
    [muiTheme, chartsTheme, options.visual?.palette?.mode]
  );

  useEffect(() => {
    if (!canvasRef.current || !width || !height) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    drawSpans(ctx, width, height, trace, spanColorGenerator);
  }, [width, height, trace, spanColorGenerator]);

  const translateCursorToTime = (e: ReactMouseEvent | MouseEvent): number => {
    if (!canvasRef.current || !width) return 0;
    // e.nativeEvent.offsetX doesn't work when sliding over a tick box
    const offsetX = e.clientX - canvasRef.current.getBoundingClientRect().left;
    return trace.startTimeUnixMs + (offsetX / width) * traceDuration;
  };

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (!(e.target instanceof HTMLElement)) return;

    const isDefaultViewport =
      viewport.startTimeUnixMs === trace.startTimeUnixMs && viewport.endTimeUnixMs === trace.endTimeUnixMs;
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

  // need stable reference for window.removeEventListener() in useEffect() below
  const handleMouseMove = useEvent((e: MouseEvent) => {
    e.preventDefault();

    switch (mouseState.type) {
      case 'none':
        return;

      case 'resize': {
        const pointA = mouseState.fixedPoint;
        const pointB = translateCursorToTime(e);

        let start, end;
        if (pointA < pointB) {
          start = pointA;
          end = pointB;
        } else {
          start = pointB;
          end = pointA;
        }

        setViewport({
          startTimeUnixMs: Math.max(start, trace.startTimeUnixMs),
          endTimeUnixMs: Math.min(end, trace.endTimeUnixMs),
        });
        return;
      }

      case 'drag': {
        // avoid using e.movementX here, as it skips events in chrome,
        // resulting in the mouse pointer moving faster than the viewport box
        const { start, end } = mouseState;
        let cursor = translateCursorToTime(e);

        if (cursor - start < trace.startTimeUnixMs) {
          cursor = trace.startTimeUnixMs + start;
        }
        if (cursor + end > trace.endTimeUnixMs) {
          cursor = trace.endTimeUnixMs - end;
        }

        setViewport({
          startTimeUnixMs: cursor - start,
          endTimeUnixMs: cursor + end,
        });
        return;
      }
    }
  });

  // need stable reference for window.removeEventListener() in useEffect() below
  const handleMouseUp = useEvent((e: MouseEvent) => {
    e.preventDefault();
    setMouseState({ type: 'none' });

    // reset viewport if start === end, i.e. a click without movement
    if (viewport.startTimeUnixMs === viewport.endTimeUnixMs) {
      setViewport({ startTimeUnixMs: trace.startTimeUnixMs, endTimeUnixMs: trace.endTimeUnixMs });
    }
  });

  // capture mouseMove and mouseUp outside the element by attaching them to the window object
  useEffect(() => {
    function startMouseAction(): void {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = mouseState.type === 'resize' ? 'col-resize' : 'move';
    }

    function stopMouseAction(): void {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'inherit';
    }

    if (mouseState.type === 'none') {
      stopMouseAction();
    } else {
      startMouseAction();
    }

    return stopMouseAction;
  }, [mouseState, handleMouseMove, handleMouseUp]);

  return (
    <Box ref={wrapperRef} sx={{ position: 'relative', height }} onMouseDown={handleMouseDown}>
      <canvas ref={canvasRef} width={width} height={height} style={{ position: 'absolute' }} />
      <Ticks />
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
  backgroundColor: theme.palette.divider,
  width: '2px',
  cursor: 'col-resize',

  // increase clickable area from 2px to 8px
  '&:before': {
    position: 'absolute',
    width: '8px',
    left: '-3px',
    top: 0,
    bottom: 0,
    content: '" "',
    zIndex: 1, // without zIndex, the cutoff boxes partially hide this element
  },
}));
