import { createTheme, PaletteMode, ThemeOptions } from '@mui/material';
import { getPaletteOptions } from './palette/palette-options';
import { typography } from './typography';
// import { addGlobalStyles } from './global-styles';

/**
 * Gets theme used by all components for the provided mode. For more details, see:
 *   - Base colors, typography, sizing - go/chrono-ui-theme
 *   - Material UI defaults: https://material-ui.com/customization/default-theme/
 *   - Material UI variables: https://material-ui.com/customization/theming/#theme-configuration-variables
 *   - Material UI global overrides and default props: https://material-ui.com/customization/globals/#css
 *
 * Need to reinstantiate the theme everytime to support switching between light and dark themes
 * https://github.com/mui-org/material-ui/issues/18831
 */
export function getTheme(mode: PaletteMode) {
  const theme = createTheme({
    palette: getPaletteOptions(mode),
    typography,
    mixins: {},
    components,
  });
  // addGlobalStyles(theme, applicationRoot);
  return theme;
}

// Overrides for component default prop values and styles go here
const components: ThemeOptions['components'] = {
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
  MuiSvgIcon: {
    defaultProps: {
      fontSize: 'small',
    },
    styleOverrides: {
      fontSizeSmall: {
        fontSize: '1rem',
      },
    },
  },
  MuiCardHeader: {
    defaultProps: {
      disableTypography: true,
    },
  },
};
