import type { Meta, StoryObj } from '@storybook/react';
import { ErrorAlert } from '@perses-dev/components';

const meta: Meta<typeof ErrorAlert> = {
  component: ErrorAlert,
};

export default meta;

type Story = StoryObj<typeof ErrorAlert>;

export const Primary: Story = {
  args: {
    error: new Error('Something went wrong!'),
  },
};
