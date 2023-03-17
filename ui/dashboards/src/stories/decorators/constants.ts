import { DashboardResource } from '@perses-dev/core';

export const EMPTY_DASHBOARD_RESOURCE: DashboardResource = {
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
};
