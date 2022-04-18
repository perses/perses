import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/lato/900.css';
import { createTheme, ThemeOptions } from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import merge from 'lodash/merge';

/**
 * Material UI theme used by all components. For more details, see:
 *   - defaults: https://mui.com/customization/default-theme/
 *   - variables: https://mui.com/material-ui/customization/theming/#theme-configuration-variables
 *   - global overrides and default props: https://mui.com/material-ui/customization/theme-components/#css
 */
export function getTheme(overrides: ThemeOptions = {}) {
  const palette: ThemeOptions['palette'] = {
    background: {
      default: blueGrey[50],
    },
    common: {
      white: '#FFFFFF',
      black: '#000000',
    },
  };

  const theme = createTheme({
    palette: merge(palette, overrides.palette),

    typography: {
      fontFamily: '"Lato", sans-serif',

      // Font weights need to correspond with the imports at the top of the file
      // (Lato supports 100, 300, 400, 700, 900)
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 700,
      fontWeightBold: 900,
    },

    mixins: {},
  });

  // Overrides for component default prop values and styles go here
  const components: ThemeOptions['components'] = {};

  theme.components = merge(components, overrides.components);
  return theme;
}
