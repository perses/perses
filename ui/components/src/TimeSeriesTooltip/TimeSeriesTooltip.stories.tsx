import type { Meta, StoryObj } from '@storybook/react';
import { TimeSeriesTooltip } from './TimeSeriesTooltip';

const meta: Meta<typeof TimeSeriesTooltip> = {
  component: TimeSeriesTooltip,
};

export default meta;

type Story = StoryObj<typeof TimeSeriesTooltip>;

export const Primary: Story = {
  args: {},
};
