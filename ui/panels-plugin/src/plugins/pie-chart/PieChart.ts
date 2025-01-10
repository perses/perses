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

import { PanelPlugin } from '@perses-dev/plugin-system';
import { createInitialPieChartOptions, PieChartOptions } from './pie-chart-model';
import { PieChartOptionsEditorSettings } from './PieChartOptionsEditorSettings';
import { PieChartPanel, PieChartPanelProps } from './PieChartPanel';

/**
 * The core PieChart panel plugin for Perses.
 */
export const PieChart: PanelPlugin<PieChartOptions, PieChartPanelProps> = {
  PanelComponent: PieChartPanel,
  panelOptionsEditorComponents: [
    {
      label: 'Settings',
      content: PieChartOptionsEditorSettings,
    },
  ],
  supportedQueryTypes: ['TimeSeriesQuery'],
  createInitialOptions: createInitialPieChartOptions,
};
