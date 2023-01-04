// Copyright 2023 The Perses Authors
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

import { SimplePaletteColorOptions, PaletteMode } from '@mui/material';
import { grey, white } from './colors';

export const secondary = (mode: PaletteMode): SimplePaletteColorOptions => {
  return mode === 'light'
    ? {
        main: grey[600],
        dark: grey[900],
        light: grey[100],
      }
    : {
        main: white,
        dark: white,
        light: white,
      };
};
