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
import { grey, white, blue } from './colors';

export const text = (mode: PaletteMode): PaletteOptions['text'] => {
  const navigation = grey[800];
  const accent = grey[300];
  return mode === 'light'
    ? {
        navigation,
        accent,
        primary: grey[800],
        secondary: grey[700],
        disabled: grey[300],
        link: blue[500],
        linkHover: blue[600],
      }
    : {
        navigation,
        accent,
        primary: white,
        secondary: grey[50],
        disabled: grey[600],
        link: blue[400],
        linkHover: blue[500],
      };
};
