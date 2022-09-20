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

import { useEffect } from 'react';
import { BoxProps } from '@mui/material';
import { DashboardResource, getDefaultTimeRange } from '@perses-dev/core';
import { useQueryParams } from '@perses-dev/plugin-system';
import { TimeRangeProvider, TemplateVariablesProvider, DashboardProvider } from '../context';

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

  const { queryParams, setQueryParams } = useQueryParams();

  const startParam = queryParams.get('start');
  const endParam = queryParams.get('end');
  const dashboardDuration = spec.duration ?? '1h';
  const defaultTimeRange = getDefaultTimeRange(dashboardDuration, startParam, endParam);

  // TODO: add reusable sync query string or no-op util
  useEffect(() => {
    const currentParams = Object.fromEntries([...queryParams]);
    if (!currentParams.start && setQueryParams) {
      queryParams.set('start', dashboardDuration);
      queryParams.set('end', 'now');
      setQueryParams(queryParams);
    }
  }, [dashboardDuration, queryParams, setQueryParams]);

  return (
    <DashboardProvider initialState={{ dashboardSpec: spec }}>
      <TimeRangeProvider initialTimeRange={defaultTimeRange}>
        <TemplateVariablesProvider variableDefinitions={spec.variables}>
          <DashboardApp {...props}>{children}</DashboardApp>
        </TemplateVariablesProvider>
      </TimeRangeProvider>
    </DashboardProvider>
  );
}
