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
      secondary: {
        main: '#3E4662',
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
      text: {
        primary: '#fff',
      },
    },
  });
};
