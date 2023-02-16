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

import { convertThresholds } from './thresholds';

describe('convertThresholds', () => {
  const thresholdsColors = {
    defaultColor: '#59CC8D',
    palette: ['#438FEB', '#FFB249', '#EE6C6C'],
  };
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
    expect(convertThresholds(percentInput, { kind: 'Percent' }, 100, thresholdsColors)).toEqual(gaugePercentOutput);

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
    expect(convertThresholds(percentDecimalInput, { kind: 'PercentDecimal' }, 1, thresholdsColors)).toEqual(
      gaugePercentOutput
    );

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
      [0.8, 'rgba(47, 191, 114, 1)'],
      [0.9, 'rgba(255, 159, 28, 0.9)'],
      [1, 'rgba(234, 71, 71, 1)'],
    ];
    expect(convertThresholds(bytesInput, { kind: 'Bytes' }, 10000, thresholdsColors)).toEqual(bytesOutput);
  });

  it('should account for custom max', () => {
    const percentOutput = [
      [0.25, '#000'],
      [0.4, '#FFA500'],
      [1, '#FF0000'],
    ];
    const percentInput = {
      default_color: '#000',
      steps: [
        {
          value: 50,
          color: '#FFA500',
        },
        {
          value: 80,
          color: '#FF0000',
        },
      ],
    };
    expect(convertThresholds(percentInput, { kind: 'Percent' }, 200, thresholdsColors)).toEqual(percentOutput);

    const percentDecimalOutput = [
      [0.05, '#000'],
      [0.08, '#FFA500'],
      [1, '#FF0000'],
    ];
    const percentDecimalInput = {
      default_color: '#000',
      steps: [
        {
          value: 0.5,
          color: '#FFA500',
        },
        {
          value: 0.8,
          color: '#FF0000',
        },
      ],
    };
    expect(convertThresholds(percentDecimalInput, { kind: 'PercentDecimal' }, 10, thresholdsColors)).toEqual(
      percentDecimalOutput
    );
  });
});
