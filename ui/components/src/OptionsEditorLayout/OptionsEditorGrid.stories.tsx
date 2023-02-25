// Copyright 2023 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
