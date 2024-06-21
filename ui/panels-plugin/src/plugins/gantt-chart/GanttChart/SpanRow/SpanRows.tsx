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
import { Stack, styled } from '@mui/material';
import { Span } from '@perses-dev/core';
import { memo, useMemo } from 'react';
import { Viewport, gridColor, rowHeight } from '../utils';
import { useSpanRowsContext } from './SpanRowsProvider';
import { SpanName } from './SpanName';
import { SpanDuration } from './SpanDuration';

interface SpanRowsProps {
  rootSpan: Span;
  viewport: Viewport;
  onSpanClick: (span: Span) => void;
}

export function SpanRows(props: SpanRowsProps) {
  const { rootSpan, viewport, onSpanClick } = props;
  const { collapsedSpans, setVisibleSpans } = useSpanRowsContext();

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
    <Virtuoso
      data={rows}
      itemContent={(_, span) => <SpanRow span={span} viewport={viewport} onClick={onSpanClick} />}
      rangeChanged={handleRangeChange}
    />
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

interface SpanRowProps {
  span: Span;
  viewport: Viewport;
  onClick: (span: Span) => void;
}

export const SpanRow = memo(function SpanRow(props: SpanRowProps) {
  const { span, viewport, onClick } = props;

  const handleOnClick = () => {
    onClick(span);
  };

  return (
    <SpanRowContainer direction="row" onClick={handleOnClick}>
      <SpanName span={span} />
      <SpanDuration span={span} viewport={viewport} />
    </SpanRowContainer>
  );
});

const SpanRowContainer = styled(Stack)(({ theme }) => ({
  height: rowHeight,
  '&:hover': {
    backgroundColor: theme.palette.grey.A200,
    borderTop: `1px solid ${gridColor(theme)}`,
    borderBottom: `1px solid ${gridColor(theme)}`,
  },
}));
