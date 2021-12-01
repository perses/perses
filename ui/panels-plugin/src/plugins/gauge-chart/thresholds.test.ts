// Copyright 2021 The Perses Authors
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
  const thresholdInput = {
    default_color: '#000',
    steps: [
      {
        value: 85,
        color: '#FFA500',
      },
      {
        value: 95,
        color: '#ff0000',
      },
    ],
  };

  const thresholdOutput = [
    [0.85, '#000'],
    [0.95, '#FFA500'],
    [1, '#ff0000'],
  ];

  test('check gauge threshold to echarts option conversion', () => {
    expect(convertThresholds(thresholdInput)).toEqual(thresholdOutput);
  });
});
