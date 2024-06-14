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

import { Virtuoso } from 'react-virtuoso';
import { useState } from 'react';
import { SpanRow } from './SpanRow';
import { HeaderRow } from './HeaderRow';
import { Span, Viewport } from './model';
import { GanttChartContext } from './context';
import { MiniGanttChart } from './MiniGanttChart';

export interface GanttChart {
  width: number;
  height: number;
  rootSpan: Span;
}

/**
 * treeToRows recursively transforms the span tree to a list of rows
 * and hides collapsed child spans.
 */
function treeToRows(rows: Span[], span: Span, collapsedSpans: string[]) {
  rows.push(span);
  if (!collapsedSpans.includes(span.spanId)) {
    for (const child of span.children) {
      treeToRows(rows, child, collapsedSpans);
    }
  }
}

export function GanttChart(props: GanttChart) {
  const { width, height, rootSpan } = props;
  const [collapsedSpans, setCollapsedSpans] = useState<string[]>([]);
  const [hoveredParent, setHoveredParent] = useState<string | undefined>(undefined);
  const [viewport, setViewport] = useState<Viewport>({
    startTimeUnixNano: rootSpan.startTimeUnixNano,
    endTimeUnixNano: rootSpan.endTimeUnixNano,
  });

  const rows: Span[] = [];
  treeToRows(rows, rootSpan, collapsedSpans);

  return (
    <>
      <MiniGanttChart rootSpan={rootSpan} viewport={viewport} setViewport={setViewport} />
      <GanttChartContext.Provider value={{ collapsedSpans, setCollapsedSpans, hoveredParent, setHoveredParent }}>
        <HeaderRow rootSpan={rootSpan} viewport={viewport} />
        <Virtuoso
          style={{
            width: width,
            height: height,
          }}
          data={rows}
          itemContent={(_, span) => <SpanRow span={span} viewport={viewport} />}
        />
      </GanttChartContext.Provider>
    </>
  );
}
