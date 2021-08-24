import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/lato/900.css';
import { createTheme as createMuiTheme } from '@material-ui/core';
import { blueGrey } from '@material-ui/core/colors';

/**
 * Creates the Perses MUI theme.
 */
export function createTheme() {
  return createMuiTheme({
    palette: {
      background: {
        default: blueGrey[50],
      },
    },

    typography: {
      fontFamily: '"Lato", sans-serif',

      // Font weights need to correspond with the imports at the top of the file
      // (Lato supports 100, 300, 400, 700, 900)
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 700,
      fontWeightBold: 900,
    },

    components: {
      MuiFormControl: {
        defaultProps: {
          fullWidth: true,
          size: 'small',
        },
      },
      MuiTextField: {
        defaultProps: {
          fullWidth: true,
          size: 'small',
        },
      },
    },
  });
}
