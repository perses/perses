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
};
