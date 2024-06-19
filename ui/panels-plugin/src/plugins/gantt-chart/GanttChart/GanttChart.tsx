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
import { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { Span } from '@perses-dev/core';
import { SpanRow } from './SpanRow/SpanRow';
import { HeaderRow } from './SpanRow/HeaderRow';
import { GanttChartContext } from './context';
import { MiniGanttChart } from './MiniGanttChart/MiniGanttChart';
import { DetailPane } from './DetailPane/DetailPane';
import { Viewport } from './utils';

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
    for (const child of span.childSpans) {
      treeToRows(rows, child, collapsedSpans);
    }
  }
}

/**
 * The core GanttChart panel for Perses.
 *
 * The UI/UX of this panel is based on Jaeger UI, licensed under Apache License, Version 2.0.
 * https://github.com/jaegertracing/jaeger-ui
 */
export function GanttChart(props: GanttChart) {
  const { rootSpan } = props;
  const [collapsedSpans, setCollapsedSpans] = useState<string[]>([]);
  const [hoveredParent, setHoveredParent] = useState<string | undefined>(undefined);
  const [selectedSpan, setSelectedSpan] = useState<Span | undefined>(undefined);
  const [viewport, setViewport] = useState<Viewport>({
    startTimeUnixMs: rootSpan.startTimeUnixMs,
    endTimeUnixMs: rootSpan.endTimeUnixMs,
  });

  const rows = useMemo(() => {
    const rows: Span[] = [];
    treeToRows(rows, rootSpan, collapsedSpans);
    return rows;
  }, [rootSpan, collapsedSpans]);

  const handleDetailPaneCloseBtnClick = () => {
    setSelectedSpan(undefined);
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <MiniGanttChart rootSpan={rootSpan} viewport={viewport} setViewport={setViewport} />
        <HeaderRow rootSpan={rootSpan} viewport={viewport} />
        <GanttChartContext.Provider value={{ collapsedSpans, setCollapsedSpans, hoveredParent, setHoveredParent }}>
          <Virtuoso
            data={rows}
            itemContent={(_, span) => <SpanRow span={span} viewport={viewport} onClick={setSelectedSpan} />}
          />
        </GanttChartContext.Provider>
      </Box>
      {selectedSpan && (
        <Box sx={{ width: '280px', overflow: 'auto' }}>
          <DetailPane rootSpan={rootSpan} span={selectedSpan} onCloseBtnClick={handleDetailPaneCloseBtnClick} />
        </Box>
      )}
    </Box>
  );
}
