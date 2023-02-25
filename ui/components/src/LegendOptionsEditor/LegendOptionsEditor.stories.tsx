import type { Meta, StoryObj } from '@storybook/react';
import { LegendOptionsEditor } from '@perses-dev/components';

const meta: Meta<typeof LegendOptionsEditor> = {
  component: LegendOptionsEditor,
};

export default meta;

type Story = StoryObj<typeof LegendOptionsEditor>;

export const Primary: Story = {
  args: {
    value: {
      position: 'Bottom',
    },
  },
};
