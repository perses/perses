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
import { createInitialGaugeChartOptions, GaugeChartOptions } from './gauge-chart-model';
import { GaugeChartOptionsEditorSettings } from './GaugeChartOptionsEditorSettings';
import { GaugeChartLoading, GaugeChartPanel, GaugeChartPanelProps } from './GaugeChartPanel';

/**
 * The core GaugeChart panel plugin for Perses.
 */
export const GaugeChart: PanelPlugin<GaugeChartOptions, GaugeChartPanelProps> = {
  PanelComponent: GaugeChartPanel,
  LoadingComponent: GaugeChartLoading,
  supportedQueryTypes: ['TimeSeriesQuery'],
  panelOptionsEditorComponents: [
    {
      label: 'Settings',
      content: GaugeChartOptionsEditorSettings,
    },
  ],
  createInitialOptions: createInitialGaugeChartOptions,
};
