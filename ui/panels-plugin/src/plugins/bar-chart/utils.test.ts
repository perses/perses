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

import { BarChartData } from '@perses-dev/components';
import { calculatePercentages, sortSeriesData } from './utils';

const MOCK_DATA: BarChartData[] = [
  {
    label: 'Label 1',
    value: 3,
  },
  {
    label: 'Label 2',
    value: 2,
  },
  {
    label: 'Label 3',
    value: 0,
  },
  {
    label: 'Label 4',
    value: 5,
  },
  {
    label: 'Label 5',
    value: null,
  },
];

describe('calculatePercentages', () => {
  it('calculates correct percentage values', () => {
    const percentages = calculatePercentages(MOCK_DATA);
    expect(percentages).toEqual([
      {
        label: 'Label 1',
        value: 30,
      },
      {
        label: 'Label 2',
        value: 20,
      },
      {
        label: 'Label 3',
        value: 0,
      },
      {
        label: 'Label 4',
        value: 50,
      },
      {
        label: 'Label 5',
        value: 0,
      },
    ]);
  });
});

describe('sortSeriesData', () => {
  it('sorts in ascending order', () => {
    const sorted = sortSeriesData(MOCK_DATA, 'asc');
    expect(sorted).toEqual([
      {
        label: 'Label 4',
        value: 5,
      },
      {
        label: 'Label 1',
        value: 3,
      },
      {
        label: 'Label 2',
        value: 2,
      },
      {
        label: 'Label 3',
        value: 0,
      },
      {
        label: 'Label 5',
        value: null,
      },
    ]);
  });

  it('sorts in descending order', () => {
    const sorted = sortSeriesData(MOCK_DATA, 'desc');
    expect(sorted).toEqual([
      {
        label: 'Label 5',
        value: null,
      },
      {
        label: 'Label 3',
        value: 0,
      },
      {
        label: 'Label 2',
        value: 2,
      },
      {
        label: 'Label 1',
        value: 3,
      },
      {
        label: 'Label 4',
        value: 5,
      },
    ]);
  });
});
