// Copyright 2024 The Perses Authors
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

import { PieChartData } from '@perses-dev/components';
import { calculatePercentages, sortSeriesData } from './utils';

const MOCK_DATA: PieChartData[] = [
  {
    name: 'Label 1',
    value: 3,
  },
  {
    name: 'Label 2',
    value: 2,
  },
  {
    name: 'Label 3',
    value: 0,
  },
  {
    name: 'Label 4',
    value: 5,
  },
  {
    name: 'Label 5',
    value: null,
  },
];

describe('calculatePercentages', () => {
  it('calculates correct percentage values', () => {
    const percentages = calculatePercentages(MOCK_DATA);
    expect(percentages).toEqual([
      {
        name: 'Label 1',
        value: 30,
      },
      {
        name: 'Label 2',
        value: 20,
      },
      {
        name: 'Label 3',
        value: 0,
      },
      {
        name: 'Label 4',
        value: 50,
      },
      {
        name: 'Label 5',
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
        name: 'Label 4',
        value: 5,
      },
      {
        name: 'Label 1',
        value: 3,
      },
      {
        name: 'Label 2',
        value: 2,
      },
      {
        name: 'Label 3',
        value: 0,
      },
      {
        name: 'Label 5',
        value: null,
      },
    ]);
  });

  it('sorts in descending order', () => {
    const sorted = sortSeriesData(MOCK_DATA, 'desc');
    expect(sorted).toEqual([
      {
        name: 'Label 5',
        value: null,
      },
      {
        name: 'Label 3',
        value: 0,
      },
      {
        name: 'Label 2',
        value: 2,
      },
      {
        name: 'Label 1',
        value: 3,
      },
      {
        name: 'Label 4',
        value: 5,
      },
    ]);
  });
});
