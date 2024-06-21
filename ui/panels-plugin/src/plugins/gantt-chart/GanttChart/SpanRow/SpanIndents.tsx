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

import { styled, useTheme } from '@mui/material';
import ChevronDownIcon from 'mdi-material-ui/ChevronDown';
import ChevronRightIcon from 'mdi-material-ui/ChevronRight';
import { useContext, MouseEvent, useCallback } from 'react';
import { Span } from '@perses-dev/core';
import { gridColor } from '../utils';
import { GanttChartContext } from '../GanttChartProvider';

const MIN_INDENT_WIDTH = 8;
const MAX_INDENT_WIDTH = 24;

export interface SpanIndentsProps {
  span: Span;
}

/**
 * SpanIndents renders the indention boxes,
 * and handles the click and mouseOver events
 *
 * Note: This component gets re-rendered on every hover of any indention box,
 * therefore rendering performance is essential.
 */
export function SpanIndents(props: SpanIndentsProps) {
  const { span } = props;
  const { collapsedSpans, setCollapsedSpans, hoveredParent, setHoveredParent, minSpanLevel } =
    useContext(GanttChartContext);
  const theme = useTheme();

  let parent = span.parentSpan;
  const parentSpanIds = [parent?.spanId ?? ''];
  while (parent) {
    parent = parent.parentSpan;
    parentSpanIds.unshift(parent?.spanId ?? '');
  }

  const handleToggleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (collapsedSpans.includes(span.spanId)) {
        setCollapsedSpans(collapsedSpans.filter((spanId) => spanId !== span.spanId));
      } else {
        setCollapsedSpans([...collapsedSpans, span.spanId]);
      }
    },
    [span, collapsedSpans, setCollapsedSpans]
  );

  const handleIconMouseEnter = useCallback(() => {
    setHoveredParent(span.spanId);
  }, [span, setHoveredParent]);

  return (
    <>
      {parentSpanIds.map((parentSpanId, i) => (
        <SpanIndentBox
          key={parentSpanId}
          style={{
            width: i < minSpanLevel ? MIN_INDENT_WIDTH : MAX_INDENT_WIDTH,
            borderLeft: `${hoveredParent === parentSpanId ? 4 : 1}px solid ${gridColor(theme)}`,
          }}
          onMouseEnter={() => setHoveredParent(parentSpanId)}
          onMouseLeave={() => setHoveredParent(undefined)}
        >
          {i === parentSpanIds.length - 1 &&
            span.childSpans.length > 0 &&
            (collapsedSpans.includes(span.spanId) ? (
              <ChevronRightIcon onClick={handleToggleClick} onMouseEnter={handleIconMouseEnter} />
            ) : (
              <ChevronDownIcon onClick={handleToggleClick} onMouseEnter={handleIconMouseEnter} />
            ))}
        </SpanIndentBox>
      ))}
    </>
  );
}

const SpanIndentBox = styled('div')({
  display: 'flex',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexShrink: 0,
  transition: 'width 1s',
});
