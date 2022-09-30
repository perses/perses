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

import { SxProps, Theme } from '@mui/material';

/**
 * Combines sx props from multiple sources. Useful when creating a component and
 * you want consumers to be able to provide SxProps that should be combined with
 * some built-in styles.
 */
export function combineSx(...sxProps: Array<SxProps<Theme> | undefined>): SxProps<Theme> {
  return sxProps.flatMap((sx) => {
    if (sx === undefined) return [];
    if (Array.isArray(sx)) return sx;
    return [sx];
  });
}
