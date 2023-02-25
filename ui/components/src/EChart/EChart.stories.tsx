import type { Meta, StoryObj } from '@storybook/react';
import { EChart, EChartsProps, OnEventsType } from '@perses-dev/components';
import { LineSeriesOption } from 'echarts';
import { use } from 'echarts/core';
import { LineChart as EChartsLineChart } from 'echarts/charts';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
import {
  GridComponent,
  DataZoomComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';

use([
  EChartsLineChart,
  GridComponent,
  DataZoomComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
  SVGRenderer,
]);

const meta: Meta<typeof EChart> = {
  component: EChart.type,
  render: (args) => <EChartWrapper {...args} />,
};

export default meta;

type Story = StoryObj<typeof EChart>;

const EChartWrapper = (props: EChartsProps<unknown>) => {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <EChart {...props} />
    </div>
  );
};

const handleEvents: OnEventsType<LineSeriesOption['data'] | unknown> = {
  // TODO: add storybook action calls for the various events
};

export const Primary: Story = {
  args: {
    sx: {
      width: '100%',
      height: '100%',
    },
    onEvents: handleEvents,
    option: {
      series: [
        {
          type: 'line',
          name: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
          data: [1, 1, 1],
          color: 'hsla(158782136,50%,50%,0.8)',
          sampling: 'lttb',
          progressiveThreshold: 1000,
          symbolSize: 4,
          lineStyle: { width: 1.5 },
          emphasis: { lineStyle: { width: 2.5 } },
        },
      ],
      xAxis: { type: 'category', data: [1673784000000, 1673784060000, 1673784120000], axisLabel: {} },
      yAxis: [{ type: 'value', boundaryGap: [0, '10%'], axisLabel: {}, show: true }],
      animation: false,
      tooltip: { show: true, trigger: 'axis', showContent: false, axisPointer: { type: 'line', z: 0 } },
      toolbox: { feature: { dataZoom: { icon: null, yAxisIndex: 'none' } } },
      grid: { left: 20, right: 20, bottom: 0 },
    },
    renderer: 'canvas',
  },
};
