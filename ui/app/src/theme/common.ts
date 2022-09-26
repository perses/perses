// Copyright 2021 The Perses Authors
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

import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/lato/900.css';
import { createTheme, ThemeOptions } from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import { merge } from 'lodash-es';
import { typography } from './typography';

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
    typography,
    mixins: {},
  });

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

  theme.components = merge(components, overrides.components);
  return theme;
}
