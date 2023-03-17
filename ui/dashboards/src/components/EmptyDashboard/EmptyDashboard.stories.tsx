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
import { EmptyDashboard } from '@perses-dev/dashboards';
import { Button } from '@mui/material';
import { action } from '@storybook/addon-actions';
import {
  WithTemplateVariables,
  WithQueryParams,
  WithDashboard,
  WithPluginRegistry,
  WithQueryClient,
  DEFAULT_DASHBOARD_INITIAL_STATE,
} from '../../stories/decorators';

const meta: Meta<typeof EmptyDashboard> = {
  component: EmptyDashboard,
  decorators: [WithTemplateVariables, WithDashboard, WithPluginRegistry, WithQueryClient, WithQueryParams],
};

export default meta;

type Story = StoryObj<typeof EmptyDashboard>;

/**
 * The default empty dashboard in view mode.
 */
export const ViewMode: Story = {
  args: {},
};

/**
 * The default empty dashboard in edit mode.
 */
export const EditMode: Story = {
  args: {},
  parameters: {
    withDashboard: {
      props: {
        initialState: {
          ...DEFAULT_DASHBOARD_INITIAL_STATE,
          isEditMode: true,
        },
      },
    },
  },
};

/**
 * You can use the props to customize the messaging and actions.
 */
export const Custom: Story = {
  args: {
    title: 'Oh no!',
    description: 'This dashboard is empty.',
    additionalText: 'Tip: Add a panel group and a panel to get started.',
    actions: (
      <>
        <Button onClick={action('onClickLearnMore')}>Learn more!</Button>
      </>
    ),
  },
};

/**
 * You can disable the default `actions` by setting the prop to `false`.
 */
export const DisableActions: Story = {
  args: {
    actions: false,
  },
};
