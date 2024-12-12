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

import { Span } from '@perses-dev/core';
import { GanttTrace } from '../trace';
import { minSpanWidthPx } from '../utils';

const MIN_BAR_HEIGHT = 1;
const MAX_BAR_HEIGHT = 7;

function countSpans(span: Span): number {
  let n = 1;
  for (const childSpan of span.childSpans) {
    n += countSpans(childSpan);
  }
  return n;
}

export function drawSpans(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  trace: GanttTrace,
  spanColorGenerator: (span: Span) => string
): void {
  // calculate optimal height, enforce min and max bar height and finally round to an integer
  const numSpans = countSpans(trace.rootSpan);
  const barHeight = Math.round(Math.min(Math.max(height / numSpans, MIN_BAR_HEIGHT), MAX_BAR_HEIGHT));

  const traceDuration = trace.endTimeUnixMs - trace.startTimeUnixMs;
  const yChange = height / numSpans;
  let y = 0;

  const drawSpan = (span: Span): void => {
    const spanDuration = span.endTimeUnixMs - span.startTimeUnixMs;
    const relativeDuration = spanDuration / traceDuration;
    const relativeStart = (span.startTimeUnixMs - trace.startTimeUnixMs) / traceDuration;

    ctx.fillStyle = spanColorGenerator(span);
    ctx.beginPath();
    ctx.rect(
      Math.round(relativeStart * width),
      Math.round(y),
      Math.max(minSpanWidthPx, Math.round(relativeDuration * width)),
      barHeight
    );
    ctx.fill();
    y += yChange;

    for (const childSpan of span.childSpans) {
      drawSpan(childSpan);
    }
  };

  drawSpan(trace.rootSpan);
}
