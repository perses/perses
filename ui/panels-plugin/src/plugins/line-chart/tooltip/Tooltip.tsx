// Copyright 2021 The Perses Authors
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

import { Box, Theme } from '@mui/material';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';
import { FocusedSeriesArray, GraphCursorPositionValues, TOOLTIP_MIN_WIDTH } from './tooltip-model';
import TooltipContent from './TooltipContent';

const tooltipContentStyle: SxProps<Theme> = {
  display: 'block',
  // minWidth: TOOLTIP_MIN_WIDTH,
  // minHeight: '100px',
  width: TOOLTIP_MIN_WIDTH,
  maxHeight: '180px',
  overflow: 'scroll',
  position: 'absolute',
  backgroundColor: '#000',
  opacity: 0.9,
  fontSize: '11px',
  color: '#fff',
  zIndex: 1,
  transition: 'all 0.1s ease',
};

interface TooltipProps {
  focusedSeries: FocusedSeriesArray;
  cursorData: GraphCursorPositionValues;
}

function Tooltip(props: TooltipProps) {
  const { focusedSeries, cursorData } = props;
  const coords = cursorData.coords.plotCanvas;
  const cursorBufferX = 8;
  const cursorBufferY = 16;
  const flipTooltipPosThreshold = cursorData.chartWidth / 2 + 30;
  const adjustedX =
    coords.x > flipTooltipPosThreshold ? coords.x - (TOOLTIP_MIN_WIDTH + cursorBufferX) : (coords.x += cursorBufferX);
  const adjustedY = coords.y + cursorBufferY;
  const resizeDir = focusedSeries.length > 1 ? 'both' : 'none';
  return (
    <>
      <Box
        sx={{
          ...tooltipContentStyle,
          top: adjustedY,
          left: adjustedX,
          resize: resizeDir,
        }}
      >
        <TooltipContent focusedSeries={focusedSeries} />
      </Box>
    </>
  );
}

export default Tooltip;
