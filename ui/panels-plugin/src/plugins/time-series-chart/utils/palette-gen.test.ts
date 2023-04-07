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

import { getSeriesColor } from './palette-gen';

describe('getSeriesColor', () => {
  const fallbackColor = '#ff0000';

  it('should return generated color from series name', () => {
    const value = getSeriesColor(
      'p90 test api subdomain',
      2,
      ['#fff', '000', '#111', '#222', '#333'],
      '#ff0000',
      'Auto'
    );
    expect(value).toEqual('#8DD3C7');
  });

  it('should return alternate contrast palette color', () => {
    const value = getSeriesColor('test series name', 3, ['#fff', '000', '#111', '#222', '#333'], '#ff0000', 'Auto');
    expect(value).toEqual('#01FFFE');
  });

  it('should return 1st color in Categorical palette', () => {
    const value = getSeriesColor(
      'p90 test api subdomain',
      0,
      ['#fff', '000', '#111', '#222', '#333'],
      fallbackColor,
      'Categorical'
    );
    expect(value).toEqual('#fff');
  });

  it('should return 3rd color in Categorical palette', () => {
    const value = getSeriesColor(
      'p90 test api subdomain',
      2,
      ['#fff', '000', '#111', '#222', '#333'],
      fallbackColor,
      'Categorical'
    );
    expect(value).toEqual('#111');
  });

  it('should return repeated 1st color in Categorical palette', () => {
    const value = getSeriesColor(
      'p90 test api subdomain',
      5,
      ['#fff', '000', '#111', '#222', '#333'],
      fallbackColor,
      'Categorical'
    );
    expect(value).toEqual('#fff');
  });
});
