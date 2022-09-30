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

import { convertThresholds } from '../thresholds';

describe('convertThresholds', () => {
  it('should convert gauge thresholds to valid echarts option colors', () => {
    const gaugePercentOutput = [
      [0.85, '#000'],
      [0.95, '#FFA500'],
      [1, '#FF0000'],
    ];

    // example of unit.kind Percent conversion
    const percentInput = {
      default_color: '#000',
      steps: [
        {
          value: 85,
          color: '#FFA500',
        },
        {
          value: 95,
          color: '#FF0000',
        },
      ],
    };
    expect(convertThresholds(percentInput, { kind: 'Percent' }, 100)).toEqual(gaugePercentOutput);

    // example of unit.kind PercentDecimal conversion
    const percentDecimalInput = {
      default_color: '#000',
      steps: [
        {
          value: 0.85,
          color: '#FFA500',
        },
        {
          value: 0.95,
          color: '#FF0000',
        },
      ],
    };
    expect(convertThresholds(percentDecimalInput, { kind: 'PercentDecimal' }, 1)).toEqual(gaugePercentOutput);

    // example of unit.kind Bytes conversion
    const bytesInput = {
      steps: [
        {
          value: 8000,
        },
        {
          value: 9000,
        },
      ],
    };
    const bytesOutput = [
      [0.8, 'rgba(115, 191, 105, 1)'],
      [0.9, 'rgba(253, 126, 20, 0.9)'],
      [1, 'rgba(220, 53, 69, 1)'],
    ];
    expect(convertThresholds(bytesInput, { kind: 'Bytes' }, 10000)).toEqual(bytesOutput);
  });
});
