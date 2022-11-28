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

import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/lato/900.css';
import { ThemeOptions } from '@mui/material';

// Font weights need to correspond with the imports at the top of the file
// (Lato supports 100, 300, 400, 700, 900)
const fontWeightLight = 300;
const fontWeightRegular = 400;
const fontWeightMedium = 700;
const fontWeightBold = 900;

/**
 * Theme typography options that are the same across both the dark and light themes.
 */
export const typography: ThemeOptions['typography'] = {
  fontFamily: '"Lato", sans-serif',

  fontWeightLight,
  fontWeightRegular,
  fontWeightMedium,
  fontWeightBold,

  h1: {
    fontSize: '1.5rem', // 24px
    fontWeight: fontWeightMedium,
    lineHeight: '32px',
  },
  h2: {
    fontSize: '1.25rem', // 20px
    fontWeight: fontWeightMedium,
    lineHeight: '28px',
  },
  h3: {
    fontSize: '1rem', // 16px
    fontWeight: fontWeightMedium,
    lineHeight: '24px',
  },
  h4: {
    fontSize: '0.875rem', // 14px
    fontWeight: fontWeightMedium,
    lineHeight: '22px',
  },
  h5: undefined,
  h6: undefined,

  body1: {
    fontSize: '0.875rem', // 14px
    fontWeight: fontWeightRegular,
    lineHeight: '20px',
  },
  body2: {
    fontSize: '0.75rem', // 12px
    fontWeight: fontWeightRegular,
    lineHeight: '18px',
  },
  subtitle1: {
    fontSize: '1rem', // 16px
    fontWeight: fontWeightRegular,
    lineHeight: '24px',
    letterSpacing: '0.02rem',
  },
  subtitle2: {
    fontSize: '0.875rem', // 14px
    fontWeight: fontWeightMedium,
    lineHeight: '22px',
    letterSpacing: '0.03rem',
    textTransform: 'uppercase',
  },

  button: {
    // 14px
    fontSize: '0.875rem',
    fontWeight: fontWeightMedium,
    // 20 px
    lineHeight: '1.25rem',
    textTransform: 'none',
    letterSpacing: '0.03rem',
  },
  caption: {
    fontSize: '0.6875rem', // 11px
    fontWeight: fontWeightRegular,
    lineHeight: '16px',
  },
};
