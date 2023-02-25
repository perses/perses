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
