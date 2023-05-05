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
import { Button } from '@mui/material';
import { ViewDashboard } from '@perses-dev/dashboards';
import { action } from '@storybook/addon-actions';
import { WithPluginRegistry } from '@perses-dev/plugin-system/src/stories/shared-utils';
import { WithQueryClient, WithQueryParams } from '@perses-dev/storybook';
import { WithDashboard } from '../../stories/decorators';

const meta: Meta<typeof ViewDashboard> = {
  component: ViewDashboard,
  decorators: [WithDashboard, WithQueryParams, WithPluginRegistry, WithQueryClient],
  parameters: {
    // Overriding the default on* regex for actions becaues we expose a LOT
    // of these by exposing the MUI BoxProps, and it was making the storybook
    // and browser hang from the numerous actions happening when you interacted
    // with the page.
    actions: { argTypesRegex: '' },
  },
};

export default meta;

type Story = StoryObj<typeof ViewDashboard>;

/**
 * When a dashboard is empty (i.e. has no panel groups), it will render an
 * empty state to communicate next steps to the user. If the `emptyDashboard`
 * prop is not set, it will render a default, unconfigured [EmptyDashboard](../?path=/docs/dashboards-components-emptydashboard--docs).
 */
export const ViewEmptyState: Story = {
  args: {
    dashboardResource: {
      kind: 'Dashboard',
      metadata: {
        name: 'My Dashboard',
        project: 'Storybook',
        created_at: '2021-11-09T00:00:00Z',
        updated_at: '2021-11-09T00:00:00Z',
        version: 0,
      },
      spec: {
        duration: '1h',
        variables: [],
        layouts: [],
        panels: {},
      },
    },
    isEditing: false,
  },
};

export const EditEmptyState: Story = {
  args: {
    dashboardResource: {
      kind: 'Dashboard',
      metadata: {
        name: 'My Dashboard',
        project: 'Storybook',
        created_at: '2021-11-09T00:00:00Z',
        updated_at: '2021-11-09T00:00:00Z',
        version: 0,
      },
      spec: {
        duration: '1h',
        variables: [],
        layouts: [],
        panels: {},
      },
    },
    isEditing: true,
  },
};

/**
 * Use the `emptyDashboard` prop to display a custom message when a dashboard is empty.
 * You can pass a customized [EmptyDashboard](../?path=/docs/dashboards-components-emptydashboard--docs)
 * component or a React component of your choosing.
 */
export const CustomEmptyState: Story = {
  args: {
    dashboardResource: {
      kind: 'Dashboard',
      metadata: {
        name: 'My Dashboard',
        project: 'Storybook',
        created_at: '2021-11-09T00:00:00Z',
        updated_at: '2021-11-09T00:00:00Z',
        version: 0,
      },
      spec: {
        duration: '1h',
        variables: [],
        layouts: [],
        panels: {},
      },
    },
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
