import type { Meta, StoryObj } from '@storybook/react';
import { JSONEditor } from '@perses-dev/components';

const meta: Meta<typeof JSONEditor> = {
  component: JSONEditor,
};

export default meta;

type Story = StoryObj<typeof JSONEditor>;

export const Primary: Story = {
  args: {
    value: {
      some: 'json',
    },
  },
};
