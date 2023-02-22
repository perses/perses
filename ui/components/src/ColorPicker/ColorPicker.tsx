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

import { IconButton, Stack, TextField } from '@mui/material';
import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import CircleIcon from 'mdi-material-ui/Circle';

interface ColorPickerProps {
  initialColor?: string;
  onColorChange?: (color: string) => void;
  /**
   * Preset color palette
   */
  palette?: string[];
}

export const ColorPicker = ({ initialColor, onColorChange, palette }: ColorPickerProps) => {
  // color is the valid hex color that we'll use for onColorChange
  const [color, setColor] = useState(initialColor);
  // value is the visible value for the controlled text input
  const [value, setValue] = useState(color);

  const handleColorChange = (color: string) => {
    setColor(color);
    setValue(color);
    onColorChange && onColorChange(color);
  };

  // we should update this if https://github.com/omgovich/react-colorful/issues/157 is resolved
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/([^0-9A-F]+)/gi, '').substring(0, 8);
    setValue(`#${inputValue}`); // always prefix input value with # to indicate hex format
    // only set color if input value is a valid hex color
    if (isValidHex(e.target.value)) {
      setColor(e.target.value);
      onColorChange && onColorChange(e.target.value);
    }
  };

  return (
    <Stack spacing={1}>
      <HexColorPicker color={color} onChange={handleColorChange} />
      <Stack direction="row" flexWrap="wrap" justifyContent="space-evenly" width={'200px'}>
        {palette &&
          palette.map((color, i) => (
            <IconButton
              key={i}
              size="small"
              aria-label={`change color to ${color}`}
              sx={{ color }}
              onClick={() => handleColorChange(color)}
            >
              <CircleIcon />
            </IconButton>
          ))}
      </Stack>
      <TextField
        inputProps={{ 'aria-label': 'enter hex color' }}
        fullWidth
        value={value}
        onChange={handleInputChange}
      />
    </Stack>
  );
};

const isValidHex = (value: string, alpha?: boolean): boolean => {
  const matcher = /^#?([0-9A-F]{3,8})$/i;
  const match = matcher.exec(value);
  const length = match && match[1] ? match[1].length : 0;
  return (
    length === 3 || // '#rgb' format
    length === 6 || // '#rrggbb' format
    (!!alpha && length === 4) || // '#rgba' format
    (!!alpha && length === 8) // '#rrggbbaa' format
  );
};
