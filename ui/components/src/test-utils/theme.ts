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

import { createTheme as createMuiTheme } from '@mui/material';
import { PersesChartsTheme, EChartsTheme } from '../model';
import { generateChartsTheme } from '../utils';
import { SharedChartsState } from '../context';

// app specific echarts option overrides
const TEST_ECHARTS_THEME_OVERRIDES: EChartsTheme = {
  textStyle: { fontFamily: 'Lato' },
  categoryAxis: {
    splitLine: {
      show: false,
    },
  },
  timeAxis: {
    splitLine: {
      show: false,
    },
  },
  bar: {
    barCategoryGap: 2,
  },
};

export const testChartsTheme: PersesChartsTheme = generateChartsTheme(createMuiTheme({}), {
  echartsTheme: TEST_ECHARTS_THEME_OVERRIDES,
});

export const mockChartsContext: SharedChartsState = {
  chartsTheme: testChartsTheme,
  enablePinning: false,
  lastTooltipPinnedCoords: null,
  setLastTooltipPinnedCoords: () => null,
};
