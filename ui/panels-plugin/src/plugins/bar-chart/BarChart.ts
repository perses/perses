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

import { PanelPlugin } from '@perses-dev/plugin-system';
import { createInitialBarChartOptions, BarChartOptions } from './bar-chart-model';
import { BarChartOptionsEditorSettings } from './BarChartOptionsEditorSettings';
import { BarChartPanel, BarChartPanelProps } from './BarChartPanel';

/**
 * The core BarChart panel plugin for Perses.
 */
export const BarChart: PanelPlugin<BarChartOptions, BarChartPanelProps> = {
  PanelComponent: BarChartPanel,
  panelOptionsEditorComponents: [
    {
      label: 'Settings',
      content: BarChartOptionsEditorSettings,
    },
  ],
  supportedQueryTypes: ['TimeSeriesQuery'],
  createInitialOptions: createInitialBarChartOptions,
};
