import { alpha } from '@mui/material';
import { grey } from '@mui/material/colors';
import { getTheme } from './common';
import { BespokeColors, BespokeGreys } from './bespoke-colors';
import { EChartsDarkTheme } from './echarts/theme-echarts-dark';

// const chart: ThemeOptions['chart'] = {
//   backgroundColor: '#6a0dad', // purple
// };

export const getDarkTheme = () => {
  return getTheme({
    palette: {
      mode: 'dark',
      secondary: {
        main: BespokeGreys.COMET,
      },
      text: {
        primary: '#FFFFFF',
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
      background: {
        default: BespokeColors.BLACK_PEARL,
        paper: BespokeColors.BLACK_PEARL,
      },
      action: {
        disabledBackground: alpha(BespokeGreys.SANTAS_GRAY, 0.35),
        disabled: alpha(BespokeGreys.SANTAS_GRAY, 0.5),
        hover: alpha(BespokeGreys.SANTAS_GRAY, 0.2),
        selected: alpha(BespokeGreys.SANTAS_GRAY, 0.35),
      },
    },

    components: {
      MuiButton: {
        styleOverrides: {
          disabled: {
            color: alpha(BespokeGreys.SANTAS_GRAY, 0.5),
          },
        },
      },
    },

    chart: EChartsDarkTheme,
  });
};
