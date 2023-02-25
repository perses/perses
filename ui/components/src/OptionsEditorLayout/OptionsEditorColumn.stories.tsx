import type { Meta, StoryObj } from '@storybook/react';
import { OptionsEditorColumn, OptionsEditorGroup, OptionsEditorControl } from '@perses-dev/components';
import { Switch } from '@mui/material';

const meta: Meta<typeof OptionsEditorColumn> = {
  component: OptionsEditorColumn,
  args: {
    children: (
      <>
        <OptionsEditorGroup title="Group one">
          <OptionsEditorControl label="One" control={<Switch />} />
          <OptionsEditorControl label="Two" control={<Switch />} />
        </OptionsEditorGroup>
        <OptionsEditorGroup title="Group two">
          <OptionsEditorControl label="Three" control={<Switch />} />
          <OptionsEditorControl label="Four" control={<Switch />} />
        </OptionsEditorGroup>
      </>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof OptionsEditorColumn>;

export const Primary: Story = {
  args: {},
};
