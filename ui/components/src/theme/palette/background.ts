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

import { PaletteMode, PaletteOptions } from '@mui/material';
import { blue, grey, white } from './colors';

export const background = (mode: PaletteMode): PaletteOptions['background'] => {
  const navigation = blue[150];
  const overlay = 'rgba(21, 23, 33, 0.75)'; // grey[900] with opacity 75%
  return mode === 'light'
    ? {
        navigation,
        overlay,
        default: white,
        paper: grey[50],
        tooltip: grey[100],
        border: grey[100],
      }
    : {
        navigation,
        overlay,
        default: grey[900],
        paper: grey[850],
        tooltip: grey[700],
        border: grey[600],
      };
};
