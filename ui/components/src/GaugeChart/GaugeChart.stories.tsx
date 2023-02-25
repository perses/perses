import type { Meta, StoryObj } from '@storybook/react';
import { GaugeChart } from '@perses-dev/components';

const meta: Meta<typeof GaugeChart> = {
  component: GaugeChart,
};

export default meta;

type Story = StoryObj<typeof GaugeChart>;

export const Primary: Story = {
  args: {
    height: 200,
    width: 400,
    data: { value: 63.87333983413257, label: '{env="demo",instance="demo.do.prometheus.io:9100",job="node"}' },
    unit: {
      decimal_places: 1,
      kind: 'Percent',
    },
    max: 100,
    axisLine: {
      show: true,
      lineStyle: {
        width: 5,
        color: [
          [0.008, 'rgba(47, 191, 114, 1)'],
          [0.009000000000000001, 'rgba(255, 159, 28, 0.9)'],
          [1, 'rgba(234, 71, 71, 1)'],
        ],
      },
    },
  },
};
