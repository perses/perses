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
import { styled, IconButton, Popover } from '@mui/material';
import CircleIcon from 'mdi-material-ui/Circle';
import { useChartsTheme } from '../context';
import { ColorPicker } from './ColorPicker';

export interface OptionsColorPickerProps {
  label: string;
  color: string;
  onColorChange: (color: string) => void;
  onClear?: () => void;
}

export function OptionsColorPicker({ label, color, onColorChange, onClear }: OptionsColorPickerProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const isOpen = Boolean(anchorEl);

  const openColorPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeColorPicker = () => {
    setAnchorEl(null);
  };

  const {
    thresholds: { defaultColor, palette },
  } = useChartsTheme();

  return (
    <>
      <ColorIconButton
        size="small"
        aria-label={`change ${label} color`}
        isSelected={isOpen}
        iconColor={color}
        onClick={openColorPicker}
      >
        <CircleIcon />
      </ColorIconButton>
      <Popover
        data-testid="options color picker"
        open={isOpen}
        anchorEl={anchorEl}
        onClose={closeColorPicker}
        slotProps={{ paper: { sx: { padding: (theme) => theme.spacing(2) } } }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <ColorPicker color={color} palette={[defaultColor, ...palette]} onChange={onColorChange} onClear={onClear} />
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
