import type { Meta, StoryObj } from '@storybook/react';
import { StatChart } from './StatChart';

const meta: Meta<typeof StatChart> = {
  component: StatChart,
};

export default meta;

type Story = StoryObj<typeof StatChart>;

export const Primary: Story = {
  args: {},
};
