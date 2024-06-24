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
import { Span } from '@perses-dev/core';
import { useMemo, useState } from 'react';
import { Viewport } from '../utils';
import { useGanttTableContext } from './GanttTableProvider';
import { GanttTableRow } from './GanttTableRow';
import { GanttTableHeader } from './GanttTableHeader';

interface GanttTableProps {
  rootSpan: Span;
  viewport: Viewport;
  onSpanClick: (span: Span) => void;
}

export function GanttTable(props: GanttTableProps) {
  const { rootSpan, viewport, onSpanClick } = props;
  const { collapsedSpans, setVisibleSpans } = useGanttTableContext();
  const [nameColumnWidth, _setNameColumnWidth] = useState<number>(0.25);

  const rows = useMemo(() => {
    const rows: Span[] = [];
    treeToRows(rows, rootSpan, collapsedSpans);
    return rows;
  }, [rootSpan, collapsedSpans]);

  // update currently visible spans
  function handleRangeChange({ startIndex, endIndex }: { startIndex: number; endIndex: number }) {
    const visibleSpans: string[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleSpans.push(rows[i]!.spanId);
    }
    setVisibleSpans(visibleSpans);
  }

  return (
    <>
      <GanttTableHeader rootSpan={rootSpan} viewport={viewport} nameColumnWidth={nameColumnWidth} />
      <Virtuoso
        data={rows}
        itemContent={(_, span) => <GanttTableRow span={span} viewport={viewport} onClick={onSpanClick} />}
        rangeChanged={handleRangeChange}
      />
    </>
  );
}

/**
 * treeToRows recursively transforms the span tree to a list of rows and
 * hides collapsed child spans.
 */
function treeToRows(rows: Span[], span: Span, collapsedSpans: string[]) {
  rows.push(span);
  if (!collapsedSpans.includes(span.spanId)) {
    for (const child of span.childSpans) {
      treeToRows(rows, child, collapsedSpans);
    }
  }
}
