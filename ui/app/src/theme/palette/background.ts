import { PaletteMode, PaletteOptions } from '@mui/material';
import { blueGrey } from '@mui/material/colors';
// import { grey, white } from './colors';

export const background = (mode: PaletteMode): PaletteOptions['background'] => {
  return mode === 'light'
    ? {
        default: blueGrey[50],
        paper: '#FFFFFF',
      }
    : {
        default: '#121212',
        paper: '#191d21',
      };
};
