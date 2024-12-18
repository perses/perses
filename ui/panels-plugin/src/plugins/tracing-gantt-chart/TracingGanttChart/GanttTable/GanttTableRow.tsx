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

import { Stack, styled, useTheme } from '@mui/material';
import { Span } from '@perses-dev/core';
import { memo } from 'react';
import { Viewport, rowHeight } from '../utils';
import { TracingGanttChartOptions } from '../../gantt-chart-model';
import { SpanName } from './SpanName';
import { SpanDuration } from './SpanDuration';

interface GanttTableRowProps {
  options: TracingGanttChartOptions;
  span: Span;
  viewport: Viewport;
  selected?: boolean;
  nameColumnWidth: number;
  divider: React.ReactNode;
  onClick: (span: Span) => void;
}

export const GanttTableRow = memo(function GanttTableRow(props: GanttTableRowProps) {
  const { options, span, viewport, selected, nameColumnWidth, divider, onClick } = props;
  const theme = useTheme();

  const handleOnClick = (): void => {
    // ignore event if triggered by selecting text
    if (document.getSelection()?.type === 'Range') return;

    onClick(span);
  };

  return (
    <RowContainer
      sx={{ backgroundColor: selected ? theme.palette.action.selected : 'inherit' }}
      direction="row"
      onClick={handleOnClick}
    >
      <SpanName span={span} nameColumnWidth={nameColumnWidth} />
      {divider}
      <SpanDuration options={options} span={span} viewport={viewport} />
    </RowContainer>
  );
});

const RowContainer = styled(Stack)(({ theme }) => ({
  height: rowHeight,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));
