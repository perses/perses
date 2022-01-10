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
import { useEffect, useState } from 'react';
import { Coordinate, TooltipData, TOOLTIP_MIN_WIDTH } from './tooltip-model';
import TooltipContent from './TooltipContent';

const tooltipContentStyle: SxProps<Theme> = {
  width: TOOLTIP_MIN_WIDTH,
  overflow: 'scroll',
  position: 'absolute',
  top: 0,
  left: 0,
  backgroundColor: '#000',
  opacity: 0.9,
  fontSize: '11px',
  color: '#fff',
  zIndex: 1,
  transition: 'all 0.1s ease-out',
};

function assembleTransform(coords: Coordinate, chartWidth: number) {
  const cursorPaddingX = 32;
  const cursorPaddingY = 16;
  const adjustedY = coords.y + cursorPaddingY;
  const flipTooltipPosThreshold = chartWidth / 2 + 30;
  return coords.x < flipTooltipPosThreshold
    ? `translate3d(${coords.x + cursorPaddingX}px, ${adjustedY}px, 0)`
    : `translate3d(${coords.x}px, ${adjustedY}px, 0) translateX(-100%)`;
}

interface TooltipProps {
  tooltipData: TooltipData;
}

function Tooltip(props: TooltipProps) {
  const { focusedSeries, cursor } = props.tooltipData;
  const [isTooltipVisible, setTooltipVisibility] = useState<boolean>(true);
  const cursorTransform = assembleTransform(cursor.coords.plotCanvas, cursor.chartWidth);
  const focusedSeriesNum = focusedSeries.length;
  const resizeDir = focusedSeriesNum > 5 ? 'vertical' : 'none';

  function handleHoverOff() {
    // TODO (sjcobb): partially fixes lingering tooltip but still needs adjustments
    setTooltipVisibility(false);
  }

  useEffect(() => {
    if (focusedSeriesNum >= 1) {
      setTooltipVisibility(true);
    } else {
      setTooltipVisibility(false);
    }
  }, [focusedSeriesNum]);

  return (
    <>
      <Box
        sx={{
          ...tooltipContentStyle,
          visibility: isTooltipVisible ? 'visible' : 'hidden',
          opacity: isTooltipVisible ? 1 : 0,
          resize: resizeDir,
          height: resizeDir === 'vertical' ? '180px' : 'auto',
          transform: cursorTransform,
        }}
        onMouseLeave={handleHoverOff}
      >
        <TooltipContent focusedSeries={focusedSeries} />
      </Box>
    </>
  );
}

export default Tooltip;
