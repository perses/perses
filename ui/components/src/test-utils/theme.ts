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

import { PersesChartsTheme } from '../model';

export const testChartsTheme: PersesChartsTheme = {
  echartsTheme: {},
  noDataOption: {},
  sparkline: {
    width: 1,
    color: '#000000',
  },
  container: {
    padding: {
      default: 12,
    },
  },
  thresholds: {
    defaultColor: 'rgba(47, 191, 114, 1)', // green
    palette: ['rgba(255, 193, 7, 1)', 'rgba(255, 159, 28, 0.9)', 'rgba(234, 71, 71, 1)'],
  },
};
