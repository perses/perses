// Copyright 2021 The Perses Authors
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

import { BoxProps } from '@mui/material';
import { DashboardResource } from '@perses-dev/core';
import { TimeRangeStateProvider, DashboardProvider, TemplateVariableProvider } from '../context';
import { DashboardApp } from './DashboardApp';

export interface ViewDashboardProps extends BoxProps {
  dashboardResource: DashboardResource;
}

/**
 * The View for displaying a Dashboard, along with the UI for selecting variable values.
 */
export function ViewDashboard(props: ViewDashboardProps) {
  const {
    dashboardResource: { spec },
    children,
  } = props;
  const pastDuration = spec.duration;

  return (
    <DashboardProvider initialState={{ dashboardSpec: spec }}>
      <TimeRangeStateProvider initialValue={{ pastDuration }}>
        <TemplateVariableProvider initialVariableDefinitions={spec.variables}>
          <DashboardApp {...props}>{children}</DashboardApp>
        </TemplateVariableProvider>
      </TimeRangeStateProvider>
    </DashboardProvider>
  );
}
