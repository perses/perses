// Copyright 2024 The Perses Authors
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
import { AddPanelButton } from '@perses-dev/dashboards';
import { WithPluginRegistry, WithTimeRange } from '@perses-dev/plugin-system/src/stories/shared-utils';
import { WithQueryClient, WithQueryParams } from '@perses-dev/storybook';
import { WithVariables, WithDashboard } from '../../stories/decorators';

const meta: Meta<typeof AddPanelButton> = {
  component: AddPanelButton,
  decorators: [WithVariables, WithTimeRange, WithDashboard, WithPluginRegistry, WithQueryClient, WithQueryParams],
};

export default meta;

type Story = StoryObj<typeof AddPanelButton>;

/**
 * When used in toolbars, the component is rendered with the `text` `variant`,
 * `primary` `color`, and the default `label`.
 */
export const Toolbar: Story = {
  args: {
    variant: 'text',
    color: 'primary',
  },
};

/**
 * When used in other situations (e.g. the empty state), the component is rendered
 * with the `outlined` `variant`, the `secondary` `color`,  and a custom `label`.
 */
export const Other: Story = {
  args: {
    variant: 'outlined',
    color: 'secondary',
    label: 'Add Panel',
  },
};
