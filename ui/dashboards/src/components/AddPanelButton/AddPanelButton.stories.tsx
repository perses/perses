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
import { AddPanelButton } from '@perses-dev/dashboards';
import {
  WithTemplateVariables,
  WithQueryParams,
  WithDashboard,
  WithPluginRegistry,
  WithQueryClient,
} from '../../stories/decorators';

const meta: Meta<typeof AddPanelButton> = {
  component: AddPanelButton,
  decorators: [WithTemplateVariables, WithDashboard, WithPluginRegistry, WithQueryClient, WithQueryParams],
};

export default meta;

type Story = StoryObj<typeof AddPanelButton>;

/**
 * When used in toolbars, the component is rendered with the `primary` `variant`
 * and a `short` `labelType`.
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    labelType: 'short',
  },
};

/**
 * When used in other situations (e.g. the empty state), the component is rendered
 * with the `secondary` `variant` and a `long` `labelType`.
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    labelType: 'long',
  },
};
