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

import { Box, useTheme } from '@mui/material';
import ChevronDownIcon from 'mdi-material-ui/ChevronDown';
import ChevronRightIcon from 'mdi-material-ui/ChevronRight';
import { useContext, MouseEvent } from 'react';
import { Span } from './model';
import { gridColor } from './utils';
import { GanttChartContext } from './context';

export interface SpanIndentProps {
  span: Span;
  parentSpanId: string;
  isLastIndent?: boolean;
}

/**
 * SpanIndent renders an indention box for every hierarchy level,
 * and handles the click and mouseOver events
 */
export function SpanIndent(props: SpanIndentProps) {
  const { span, parentSpanId, isLastIndent } = props;
  const { collapsedSpans, setCollapsedSpans, hoveredParent, setHoveredParent } = useContext(GanttChartContext);
  const theme = useTheme();

  const handleToggleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (collapsedSpans.includes(span.spanId)) {
      setCollapsedSpans(collapsedSpans.filter((spanId) => spanId !== span.spanId));
    } else {
      setCollapsedSpans([...collapsedSpans, span.spanId]);
    }
  };

  const handleMouseEnter = () => {
    setHoveredParent(parentSpanId);
  };

  const handleMouseLeave = () => {
    setHoveredParent(undefined);
  };

  const handleIconMouseEnter = () => {
    setHoveredParent(span.spanId);
  };

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 24, height: '100%' }}
      style={{ borderLeft: `${hoveredParent === parentSpanId ? 4 : 1}px solid ${gridColor(theme)}` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isLastIndent &&
        span.children.length > 0 &&
        (collapsedSpans.includes(span.spanId) ? (
          <ChevronRightIcon onClick={handleToggleClick} onMouseEnter={handleIconMouseEnter} />
        ) : (
          <ChevronDownIcon onClick={handleToggleClick} onMouseEnter={handleIconMouseEnter} />
        ))}
    </Box>
  );
}
