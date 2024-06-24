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

import { Stack, styled } from '@mui/material';
import { Span } from '@perses-dev/core';
import { memo } from 'react';
import { Viewport, gridColor, rowHeight } from '../utils';
import { SpanName } from './SpanName';
import { SpanDuration } from './SpanDuration';

interface GanttTableRowProps {
  span: Span;
  viewport: Viewport;
  onClick: (span: Span) => void;
}

export const GanttTableRow = memo(function SpanRow(props: GanttTableRowProps) {
  const { span, viewport, onClick } = props;

  const handleOnClick = () => {
    onClick(span);
  };

  return (
    <RowContainer direction="row" onClick={handleOnClick}>
      <SpanName span={span} />
      <SpanDuration span={span} viewport={viewport} />
    </RowContainer>
  );
});

const RowContainer = styled(Stack)(({ theme }) => ({
  height: rowHeight,
  '&:hover': {
    backgroundColor: theme.palette.grey.A200,
    borderTop: `1px solid ${gridColor(theme)}`,
    borderBottom: `1px solid ${gridColor(theme)}`,
  },
}));
