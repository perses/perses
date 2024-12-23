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

import { Virtuoso, ListRange } from 'react-virtuoso';
import { Span } from '@perses-dev/core';
import { ReactElement, useMemo, useRef, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { Viewport } from '../utils';
import { TracingGanttChartOptions } from '../../gantt-chart-model';
import { GanttTrace } from '../trace';
import { useGanttTableContext } from './GanttTableProvider';
import { GanttTableRow } from './GanttTableRow';
import { GanttTableHeader } from './GanttTableHeader';
import { ResizableDivider } from './ResizableDivider';

export interface GanttTableProps {
  options: TracingGanttChartOptions;
  trace: GanttTrace;
  viewport: Viewport;
  selectedSpan?: Span;
  onSpanClick: (span: Span) => void;
}

export function GanttTable(props: GanttTableProps): ReactElement {
  const { options, trace, viewport, selectedSpan, onSpanClick } = props;
  const { collapsedSpans, setVisibleSpans } = useGanttTableContext();
  const [nameColumnWidth, setNameColumnWidth] = useState<number>(0.25);
  const tableRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const rows = useMemo(() => {
    const rows: Span[] = [];
    treeToRows(rows, trace.rootSpan, collapsedSpans);
    return rows;
  }, [trace.rootSpan, collapsedSpans]);

  const divider = <ResizableDivider parentRef={tableRef} onMove={setNameColumnWidth} />;

  // update currently visible spans
  function handleRangeChange({ startIndex, endIndex }: ListRange): void {
    const visibleSpans: string[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleSpans.push(rows[i]!.spanId);
    }
    setVisibleSpans(visibleSpans);
  }

  return (
    <Box
      ref={tableRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius}px`,
      }}
    >
      <GanttTableHeader trace={trace} viewport={viewport} nameColumnWidth={nameColumnWidth} divider={divider} />
      <Virtuoso
        data={rows}
        itemContent={(_, span) => (
          <GanttTableRow
            options={options}
            span={span}
            viewport={viewport}
            selected={span === selectedSpan}
            nameColumnWidth={nameColumnWidth}
            divider={divider}
            onClick={onSpanClick}
          />
        )}
        rangeChanged={handleRangeChange}
      />
    </Box>
  );
}

/**
 * treeToRows recursively transforms the span tree to a list of rows and
 * hides collapsed child spans.
 */
function treeToRows(rows: Span[], span: Span, collapsedSpans: string[]): void {
  rows.push(span);
  if (!collapsedSpans.includes(span.spanId)) {
    for (const child of span.childSpans) {
      treeToRows(rows, child, collapsedSpans);
    }
  }
}
