import { PaletteMode, PaletteOptions } from '@mui/material';
import { background } from './background';
import { greyOption } from './grey';

/**
 * Returns the MUI PaletteOptions for the given mode.
 */
export function getPaletteOptions(mode: PaletteMode): PaletteOptions {
  // Palette options should be split out into their own files with functions
  // for creating the option values based on light/dark mode
  return {
    mode,
    common: {
      white: '#FFFFFF',
      black: '#000000',
    },
    grey: greyOption(mode),
    background: background(mode),
  };
}
