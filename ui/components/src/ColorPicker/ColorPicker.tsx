import { IconButton, Popover, PopoverProps, Stack, TextField } from '@mui/material';
import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import CircleIcon from 'mdi-material-ui/Circle';

interface ColorPickerProps extends PopoverProps {
  initialColor?: string;
  onColorChange?: (color: string) => void;
  /**
   * Preset color palette
   */
  palette?: string[];
}

export const ColorPicker = ({ initialColor, onColorChange, palette, ...props }: ColorPickerProps) => {
  const [color, setColor] = useState(initialColor);
  const [value, setValue] = useState(color);

  const handleColorChange = (color: string) => {
    setColor(color);
    setValue(color);
    onColorChange && onColorChange(color);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/([^0-9A-F]+)/gi, '').substring(0, 8);
    setValue(`#${inputValue}`);
    // only set color if input value is a valid hex color
    if (isValidHex(e.target.value)) {
      setColor(e.target.value);
    }
  };

  return (
    <Popover {...props} PaperProps={{ sx: { padding: (theme) => theme.spacing(2) } }}>
      <Stack spacing={1}>
        <HexColorPicker color={color} onChange={handleColorChange} />
        <Stack direction="row" flexWrap="wrap" justifyContent="space-evenly" width={'200px'}>
          {palette &&
            palette.map((color, i) => (
              <IconButton
                key={i}
                size="small"
                aria-label="change threshold color"
                sx={{ color }}
                onClick={() => handleColorChange(color)}
              >
                <CircleIcon />
              </IconButton>
            ))}
        </Stack>
        <TextField fullWidth value={value} onChange={handleInputChange} />
      </Stack>
    </Popover>
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
