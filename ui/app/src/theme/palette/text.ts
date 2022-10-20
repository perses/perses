import { PaletteOptions, PaletteMode } from '@mui/material';
import { grey } from '@mui/material/colors';
import { white } from './common';

export const text = (mode: PaletteMode): PaletteOptions['text'] => {
  return mode === 'light'
    ? {
        primary: grey[800],
        secondary: grey[700],
        disabled: grey[300],
      }
    : {
        primary: white,
        secondary: grey[50],
        disabled: grey[300],
      };
};
