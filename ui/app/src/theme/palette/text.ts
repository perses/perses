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

import { PaletteOptions, PaletteMode } from '@mui/material';
import { grey } from '@mui/material/colors';
import { white } from './common';

export const text = (mode: PaletteMode): PaletteOptions['text'] => {
  return mode === 'light'
    ? {
        primary: grey[800],
        secondary: grey[700],
        disabled: grey[300],
      }
    : {
        primary: white,
        secondary: grey[50],
        disabled: grey[300],
      };
};
