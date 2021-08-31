import { PluginSetupFunction } from '@perses-ui/core';
import { EmptyChart, EmptyChartKind } from './plugins/empty-chart/EmptyChart';
import { GaugeChart, GaugeChartKind } from './plugins/gauge-chart/GaugeChart';
import { LineChart, LineChartKind } from './plugins/line-chart/LineChart';
import {
  StatChartKind,
  StatChartPanel,
} from './plugins/stat-chart/StatChartPanel';

export const setup: PluginSetupFunction = (registerPlugin) => {
  registerPlugin({
    pluginType: 'Panel',
    kind: LineChartKind,
    validate: undefined,
    plugin: {
      PanelComponent: LineChart,
    },
  });

  registerPlugin({
    pluginType: 'Panel',
    kind: GaugeChartKind,
    validate: undefined,
    plugin: {
      PanelComponent: GaugeChart,
    },
  });

  registerPlugin({
    pluginType: 'Panel',
    kind: StatChartKind,
    validate: undefined,
    plugin: {
      PanelComponent: StatChartPanel,
    },
  });

  registerPlugin({
    pluginType: 'Panel',
    kind: EmptyChartKind,
    validate: undefined,
    plugin: {
      PanelComponent: EmptyChart,
    },
  });
};
