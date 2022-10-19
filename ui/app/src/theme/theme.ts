// Copyright 2022 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { createTheme, PaletteMode, ThemeOptions } from '@mui/material';
import { getPaletteOptions } from './palette/palette-options';
import { typography } from './typography';

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
  return theme;
}

// Overrides for component default prop values and styles go here
const components: ThemeOptions['components'] = {
  MuiFormControl: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiTextField: {
    defaultProps: {
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
};
