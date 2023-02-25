import type { Meta, StoryObj } from '@storybook/react';
import { OptionsEditorControl } from '@perses-dev/components';
import { Switch } from '@mui/material';

const meta: Meta<typeof OptionsEditorControl> = {
  component: OptionsEditorControl,
  args: {
    label: 'Show',
    control: <Switch />,
  },
};

export default meta;

type Story = StoryObj<typeof OptionsEditorControl>;

export const Primary: Story = {
  args: {},
};
