import type { Meta, StoryObj } from '@storybook/react';
import {
  OptionsEditorGrid,
  OptionsEditorColumn,
  OptionsEditorGroup,
  OptionsEditorControl,
} from '@perses-dev/components';
import { Switch } from '@mui/material';

const meta: Meta<typeof OptionsEditorGrid> = {
  component: OptionsEditorGrid,
  args: {
    children: (
      <>
        <OptionsEditorColumn>
          <OptionsEditorGroup title="Group one">
            <OptionsEditorControl label="One" control={<Switch />} />
            <OptionsEditorControl label="Two" control={<Switch />} />
          </OptionsEditorGroup>
          <OptionsEditorGroup title="Group two">
            <OptionsEditorControl label="Three" control={<Switch />} />
            <OptionsEditorControl label="Four" control={<Switch />} />
          </OptionsEditorGroup>
        </OptionsEditorColumn>
        <OptionsEditorColumn>
          <OptionsEditorGroup title="Group three">
            <OptionsEditorControl label="Five" control={<Switch />} />
            <OptionsEditorControl label="Six" control={<Switch />} />
          </OptionsEditorGroup>
        </OptionsEditorColumn>
        <OptionsEditorColumn>
          <OptionsEditorGroup title="Group four">
            <OptionsEditorControl label="Seven" control={<Switch />} />
            <OptionsEditorControl label="Eight" control={<Switch />} />
          </OptionsEditorGroup>
        </OptionsEditorColumn>
      </>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof OptionsEditorColumn>;

export const Primary: Story = {
  args: {},
};

export const OneColumn: Story = {
  args: {
    children: (
      <>
        <OptionsEditorColumn>
          <OptionsEditorGroup title="Group one">
            <OptionsEditorControl label="One" control={<Switch />} />
            <OptionsEditorControl label="Two" control={<Switch />} />
          </OptionsEditorGroup>
          <OptionsEditorGroup title="Group two">
            <OptionsEditorControl label="Three" control={<Switch />} />
            <OptionsEditorControl label="Four" control={<Switch />} />
          </OptionsEditorGroup>
        </OptionsEditorColumn>
      </>
    ),
  },
};

export const TwoColumn: Story = {
  args: {
    children: (
      <>
        <OptionsEditorColumn>
          <OptionsEditorGroup title="Group one">
            <OptionsEditorControl label="One" control={<Switch />} />
            <OptionsEditorControl label="Two" control={<Switch />} />
          </OptionsEditorGroup>
          <OptionsEditorGroup title="Group two">
            <OptionsEditorControl label="Three" control={<Switch />} />
            <OptionsEditorControl label="Four" control={<Switch />} />
          </OptionsEditorGroup>
        </OptionsEditorColumn>
        <OptionsEditorColumn>
          <OptionsEditorGroup title="Group three">
            <OptionsEditorControl label="Five" control={<Switch />} />
            <OptionsEditorControl label="Six" control={<Switch />} />
          </OptionsEditorGroup>
        </OptionsEditorColumn>
      </>
    ),
  },
};

export const ThreeColumn: Story = {
  args: {},
};
