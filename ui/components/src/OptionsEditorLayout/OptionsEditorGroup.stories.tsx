import type { Meta, StoryObj } from '@storybook/react';
import { OptionsEditorGroup, OptionsEditorControl } from '@perses-dev/components';
import { Switch } from '@mui/material';

const meta: Meta<typeof OptionsEditorGroup> = {
  component: OptionsEditorGroup,
  args: {
    title: 'Miscellaneous',
    children: (
      <>
        <OptionsEditorControl label="One" control={<Switch />} />
        <OptionsEditorControl label="Two" control={<Switch />} />
      </>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof OptionsEditorGroup>;

export const Primary: Story = {
  args: {},
};
