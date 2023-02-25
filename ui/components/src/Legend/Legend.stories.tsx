import type { Meta, StoryObj } from '@storybook/react';
import { Legend } from './Legend';

const meta: Meta<typeof Legend> = {
  component: Legend,
};

export default meta;

type Story = StoryObj<typeof Legend>;

export const Primary: Story = {
  args: {},
};
