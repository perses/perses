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

// Allows extending Lab types/components also
import type {} from '@mui/lab/themeAugmentation';

// Use Typescript interface augmentation to extend the MUI type definition
declare module '@mui/material' {
  interface Color {
    150: string;
    250: string;
    350: string;
    450: string;
    550: string;
    650: string;
    750: string;
    850: string;
    950: string;
  }
}
