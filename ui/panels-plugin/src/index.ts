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

import { PluginSetupFunction } from '@perses-dev/plugin-system';
import { EmptyChart, EmptyChartKind } from './plugins/empty-chart/EmptyChart';
import { GaugeChartPanel, GaugeChartKind } from './plugins/gauge-chart/GaugeChartPanel';
import { LineChartPanel, LineChartKind } from './plugins/line-chart/LineChartPanel';
import { StatChartKind, StatChartPanel } from './plugins/stat-chart/StatChartPanel';

export const setup: PluginSetupFunction = (registerPlugin) => {
  registerPlugin({
    pluginType: 'Panel',
    kind: LineChartKind,
    plugin: {
      PanelComponent: LineChartPanel,
    },
  });

  registerPlugin({
    pluginType: 'Panel',
    kind: GaugeChartKind,
    plugin: {
      PanelComponent: GaugeChartPanel,
    },
  });

  registerPlugin({
    pluginType: 'Panel',
    kind: StatChartKind,
    plugin: {
      PanelComponent: StatChartPanel,
    },
  });

  registerPlugin({
    pluginType: 'Panel',
    kind: EmptyChartKind,
    plugin: {
      PanelComponent: EmptyChart,
    },
  });
};
