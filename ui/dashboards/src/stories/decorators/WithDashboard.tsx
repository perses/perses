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

import { StoryFn, StoryContext } from '@storybook/react';
import { DashboardProvider, DashboardProviderProps, DashboardStoreProps } from '@perses-dev/dashboards';

export type WithDashboardParameter = {
  props: Partial<DashboardProviderProps>;
};

// Type guard because storybook types parameters as `any`
function isWithDashboardParameter(parameter: unknown | WithDashboardParameter): parameter is WithDashboardParameter {
  return !!parameter && typeof parameter === 'object' && 'props' in parameter;
}

export const DEFAULT_DASHBOARD_INITIAL_STATE: DashboardStoreProps = {
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
};

export const WithDashboard = (Story: StoryFn, context: StoryContext<unknown>) => {
  const initParameter = context.parameters.withDashboard;
  const parameter = isWithDashboardParameter(initParameter) ? initParameter : undefined;
  const props = parameter?.props;

  return (
    <DashboardProvider initialState={DEFAULT_DASHBOARD_INITIAL_STATE} {...props}>
      <Story />
    </DashboardProvider>
  );
};
