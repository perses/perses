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
import { Box, Stack } from '@mui/material';
import { SpanRow } from './SpanRow';
import { HeaderRow } from './HeaderRow';
import { Span, Viewport } from './model';
import { GanttChartContext } from './context';
import { MiniGanttChart } from './MiniGanttChart';
import { DetailPane } from './DetailPane';

export interface GanttChart {
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
  const { rootSpan } = props;
  const [collapsedSpans, setCollapsedSpans] = useState<string[]>([]);
  const [hoveredParent, setHoveredParent] = useState<string | undefined>(undefined);
  const [selectedSpan, setSelectedSpan] = useState<Span>(rootSpan);
  const [viewport, setViewport] = useState<Viewport>({
    startTimeUnixNano: rootSpan.startTimeUnixNano,
    endTimeUnixNano: rootSpan.endTimeUnixNano,
  });

  const rows: Span[] = [];
  treeToRows(rows, rootSpan, collapsedSpans);

  return (
    <Stack direction="row" gap={2} sx={{ height: '100%' }}>
      <Stack sx={{ flexGrow: 1 }}>
        <MiniGanttChart rootSpan={rootSpan} viewport={viewport} setViewport={setViewport} />
        <GanttChartContext.Provider value={{ collapsedSpans, setCollapsedSpans, hoveredParent, setHoveredParent }}>
          <HeaderRow rootSpan={rootSpan} viewport={viewport} />
          <Virtuoso
            data={rows}
            itemContent={(_, span) => <SpanRow span={span} viewport={viewport} onClick={() => setSelectedSpan(span)} />}
          />
        </GanttChartContext.Provider>
      </Stack>
      <Box sx={{ width: '17%', overflow: 'auto' }}>
        <DetailPane span={selectedSpan} />
      </Box>
    </Stack>
  );
}
