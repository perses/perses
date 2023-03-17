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
import { Dashboard } from '@perses-dev/dashboards';
import { action } from '@storybook/addon-actions';
import { Button } from '@mui/material';
import {
  WithDashboard,
  WithPluginRegistry,
  WithQueryClient,
  DEFAULT_DASHBOARD_INITIAL_STATE,
} from '../../stories/decorators';

const meta: Meta<typeof Dashboard> = {
  component: Dashboard,
  decorators: [WithDashboard, WithPluginRegistry, WithQueryClient],
  parameters: {
    // Overriding the default on* regex for actions becaues we expose a LOT
    // of these by exposing the MUI BoxProps, and it was making the storybook
    // and browser hang from the numerous actions happening when you interacted
    // with the page.
    actions: { argTypesRegex: '' },
  },
};

export default meta;

type Story = StoryObj<typeof Dashboard>;

export const DefaultEmptyState: Story = {
  args: {},
};

export const EmptyStateWithEditButton: Story = {
  args: {
    emptyDashboardProps: {
      onEditButtonClick: action('onEditButtonClick'),
    },
  },
};

export const CustomEmptyState: Story = {
  args: {
    emptyDashboardProps: {
      title: 'Oh no!',
      description: 'This dashboard is empty.',
      additionalText: 'Tip: Add a panel group and a panel to get started.',
      actions: (
        <Button variant="outlined" color="secondary" onClick={action('click custom empty dashboard action button')}>
          click me!
        </Button>
      ),
    },
  },
};
