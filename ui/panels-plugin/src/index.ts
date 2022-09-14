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

import {
  createInitialEmptyChartOptions,
  EmptyChart as EmptyChartPanel,
  EmptyChartOptionsEditor,
} from './plugins/empty-chart';
import { createInitialGaugeChartOptions, GaugeChartPanel, GaugeChartOptionsEditor } from './plugins/gauge-chart';
import { LineChartPanel, LineChartOptionsEditor, createInitialLineChartOptions } from './plugins/line-chart';
import { createInitialStatChartOptions, StatChartOptionsEditor, StatChartPanel } from './plugins/stat-chart';

export const LineChart = {
  pluginType: 'Panel',
  kind: 'LineChart',
  plugin: {
    PanelComponent: LineChartPanel,
    OptionsEditorComponent: LineChartOptionsEditor,
    createInitialOptions: createInitialLineChartOptions,
  },
};

export const GaugeChart = {
  pluginType: 'Panel',
  kind: 'GaugeChart',
  plugin: {
    PanelComponent: GaugeChartPanel,
    OptionsEditorComponent: GaugeChartOptionsEditor,
    createInitialOptions: createInitialGaugeChartOptions,
  },
};

export const StatChart = {
  pluginType: 'Panel',
  kind: 'StatChart',
  plugin: {
    PanelComponent: StatChartPanel,
    OptionsEditorComponent: StatChartOptionsEditor,
    createInitialOptions: createInitialStatChartOptions,
  },
};

export const EmptyChart = {
  pluginType: 'Panel',
  kind: 'EmptyChart',
  plugin: {
    PanelComponent: EmptyChartPanel,
    OptionsEditorComponent: EmptyChartOptionsEditor,
    createInitialOptions: createInitialEmptyChartOptions,
  },
};
