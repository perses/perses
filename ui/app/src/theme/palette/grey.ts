import { PaletteOptions, PaletteMode } from '@mui/material';
import { grey } from '@mui/material/colors';

export const greyOption = (mode: PaletteMode): PaletteOptions['grey'] => {
  return mode === 'light'
    ? {
        100: grey[100],
        200: grey[200],
        300: grey[300],
        400: grey[400],
        500: grey[500],
        600: grey[600],
        700: grey[700],
        800: grey[800],
        900: grey[900],
      }
    : // Reverse greys from darkest to lightest for Dark mode
      {
        100: grey[900],
        200: grey[800],
        300: grey[700],
        400: grey[600],
        500: grey[500],
        600: grey[400],
        700: grey[300],
        800: grey[200],
        900: grey[100],
      };
};
