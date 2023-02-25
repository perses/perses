import type { Meta, StoryObj } from '@storybook/react';
import { GaugeChart } from './GaugeChart';

const meta: Meta<typeof GaugeChart> = {
  component: GaugeChart,
};

export default meta;

type Story = StoryObj<typeof GaugeChart>;

export const Primary: Story = {
  args: {},
};
