import type { Meta, StoryObj } from '@storybook/react';
import { TimeSeriesTooltip } from '@perses-dev/components';

const meta: Meta<typeof TimeSeriesTooltip> = {
  component: TimeSeriesTooltip.type,
};

export default meta;

type Story = StoryObj<typeof TimeSeriesTooltip>;

export const Primary: Story = {
  args: {},
};
