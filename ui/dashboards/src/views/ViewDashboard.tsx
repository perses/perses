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

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BoxProps } from '@mui/material';
import { getUnixTime } from 'date-fns';
import { DashboardResource, isDurationString, isRelativeValue, TimeRangeValue } from '@perses-dev/core';
import { TimeRangeStateProvider } from '@perses-dev/plugin-system';
import { TemplateVariablesProvider, DashboardProvider } from '../context';

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

  const [searchParams, setSearchParams] = useSearchParams();

  // TODO: preserve all existing params
  const dashboardParam = searchParams.get('dashboard');

  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const parsedParam = fromParam !== null ? fromParam.split('-')[1] : spec.duration;
  const pastDuration = parsedParam && isDurationString(parsedParam) ? parsedParam : spec.duration;

  const defaultDuration =
    fromParam !== null && toParam !== null && toParam !== 'now'
      ? { start: new Date(Number(fromParam)), end: new Date(Number(toParam)) }
      : { pastDuration: pastDuration };
  // TODO: cleanup, fix types
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRangeValue>(defaultDuration as TimeRangeValue);

  // let initialActiveDateRange: TimeRangeValue = { pastDuration: pastDuration };

  const handleOnDateRangeChange = (event: TimeRangeValue) => {
    // TODO: create util to convert Perses RelativeTimeRange to GrafanaRelativeTimeRange (ex: from=now-1h&to=now)
    if (isRelativeValue(event)) {
      setSearchParams({
        dashboard: dashboardParam ?? '',
        from: `now-${event.pastDuration}`,
        to: 'now',
      });
    } else {
      const startUnixMs = getUnixTime(event.start) * 1000;
      const endUnixMs = getUnixTime(event.end) * 1000;
      setSearchParams({
        dashboard: dashboardParam ?? '',
        from: startUnixMs.toString(),
        to: endUnixMs.toString(),
      });
      setActiveTimeRange({ start: event.start, end: event.end });
      // initialActiveDateRange = { start: event.start, end: event.end };
    }
  };

  return (
    <DashboardProvider initialState={{ dashboardSpec: spec }}>
      <TimeRangeStateProvider initialValue={activeTimeRange} onDateRangeChange={handleOnDateRangeChange}>
        <TemplateVariablesProvider variableDefinitions={spec.variables}>
          <DashboardApp {...props}>{children}</DashboardApp>
        </TemplateVariablesProvider>
      </TimeRangeStateProvider>
    </DashboardProvider>
  );
}
