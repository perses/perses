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

import React from 'react';
import { styled, IconButton } from '@mui/material';
import CircleIcon from 'mdi-material-ui/Circle';
import { useChartsTheme, ColorPicker } from '@perses-dev/components';
import { ThresholdInputProps } from './ThresholdsEditor';

export function ThresholdColorPicker({ color, onColorChange }: Pick<ThresholdInputProps, 'color' | 'onColorChange'>) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const isOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const {
    thresholds: { defaultColor, palette },
  } = useChartsTheme();

  return (
    <>
      <ColorIconButton
        size="small"
        aria-label="change threshold color"
        isSelected={isOpen}
        iconColor={color}
        onClick={handleClick}
      >
        <CircleIcon />
      </ColorIconButton>
      <ColorPicker
        initialColor={color}
        onColorChange={onColorChange}
        palette={[defaultColor, ...palette]}
        open={isOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      />
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
