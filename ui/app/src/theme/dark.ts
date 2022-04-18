import { grey } from '@mui/material/colors';
import { getTheme } from './common';

export const getDarkTheme = () => {
  return getTheme({
    palette: {
      mode: 'dark',
      background: {
        default: '#121212', // mui default
        paper: '#191d21', // prom dkgrey
      },
      // Reverse greys from darkest to lightest for Dark mode
      grey: {
        100: grey[900],
        200: grey[800],
        300: grey[700],
        400: grey[600],
        500: grey[500],
        600: grey[400],
        700: grey[300],
        800: grey[200],
        900: grey[100],
      },
    },
  });
};
