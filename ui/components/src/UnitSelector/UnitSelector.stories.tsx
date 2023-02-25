import type { Meta, StoryObj } from '@storybook/react';
import { UnitSelector } from '@perses-dev/components';

const meta: Meta<typeof UnitSelector> = {
  component: UnitSelector,
};

export default meta;

type Story = StoryObj<typeof UnitSelector>;

export const Primary: Story = {
  args: {
    value: {
      kind: 'Decimal',
    },
  },
};
