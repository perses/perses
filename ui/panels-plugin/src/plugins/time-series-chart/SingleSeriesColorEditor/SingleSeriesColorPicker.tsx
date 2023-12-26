// Copyright 2023 The Perses Authors
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

import React, { useMemo } from 'react';
import { styled, IconButton, Popover } from '@mui/material';
import type { Color } from 'echarts';
import CircleIcon from 'mdi-material-ui/Circle';
import { useChartsTheme, ColorPicker } from '@perses-dev/components';
import { SingleValueColorInputProps } from './SingleSeriesColorInput';

export function SingleSeriesColorPicker({
  color,
  onColorChange,
  label,
}: Pick<SingleValueColorInputProps, 'color' | 'onColorChange' | 'label'>) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const isOpen = Boolean(anchorEl);

  const openColorPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeColorPicker = () => {
    setAnchorEl(null);
  };

  const { echartsTheme } = useChartsTheme();

  // Show first four colors from palette as selectable in color picker
  const predefinedSeriesColors = useMemo(() => {
    if (Array.isArray(echartsTheme.color) && echartsTheme.color.length > 4) {
      return echartsTheme.color.slice(0, 4).map((color: Color) => color.toString()); // account for ZRColor LinearGradientObject edge case
    }
  }, [echartsTheme.color]);

  return (
    <>
      <ColorIconButton
        size="small"
        aria-label={`change threshold ${label} color`}
        isSelected={isOpen}
        iconColor={color}
        onClick={openColorPicker}
      >
        <CircleIcon />
      </ColorIconButton>
      <Popover
        data-testid="threshold color picker"
        open={isOpen}
        anchorEl={anchorEl}
        onClose={closeColorPicker}
        PaperProps={{ sx: { padding: (theme) => theme.spacing(2) } }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <ColorPicker color={color} onChange={onColorChange} palette={predefinedSeriesColors ?? []} />
      </Popover>
    </>
  );
}

const ColorIconButton = styled(IconButton, {
  shouldForwardProp: (props) => props !== 'isSelected' && props !== 'iconColor',
})<{
  iconColor?: string;
  isSelected?: boolean;
}>(({ iconColor, isSelected }) => ({
  backgroundColor: isSelected && iconColor ? `${iconColor}3F` : 'undefined', // 3F represents 25% opacity
  color: iconColor,
}));
