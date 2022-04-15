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
import { createTheme as createMuiTheme } from '@mui/material';
import { blueGrey } from '@mui/material/colors';

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

// TODO (sjcobb): how to extend MUI theme with ECharts theme (no .ts version exported from theme-builder)
// https://stackoverflow.com/questions/63180016/how-to-toggle-echarts-theme-color
// https://echarts.apache.org/en/theme-builder.html
