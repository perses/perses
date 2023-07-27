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

import { LegendOptionsBase } from '@perses-dev/core';
import { validateLegendSpec } from './legend';

describe('validateLegendSpec', () => {
  it('should check if a legend spec is valid', () => {
    const invalidLegend = { position: 'bottom' };
    expect(validateLegendSpec(invalidLegend as LegendOptionsBase)).toEqual(false);
    expect(validateLegendSpec({ position: 'Bottom' })).toEqual(true);
    expect(validateLegendSpec(undefined)).toEqual(true);
  });
});
