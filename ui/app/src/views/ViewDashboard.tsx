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
import { getUnixTime } from 'date-fns';
import { ViewDashboard as DashboardView } from '@perses-dev/dashboards';
import { TimeRangeStateProvider } from '@perses-dev/plugin-system';
import { useSearchParams } from 'react-router-dom';
import { DashboardResource, isDurationString, isRelativeValue, TimeRangeValue } from '@perses-dev/core';
import { useSampleData } from '../utils/temp-sample-data';

const DEFAULT_DASHBOARD_ID = 'node-exporter-full';

/**
 * The View for viewing a Dashboard.
 */
function ViewDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  const dashboardParam = searchParams.get('dashboard');
  const dashboard = useSampleData<DashboardResource>(dashboardParam || DEFAULT_DASHBOARD_ID);

  const defaultDuration = dashboard?.spec.duration ?? '1h';

  // TODO: preserve all existing params, change to use template variable approach
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const parsedParam = fromParam !== null ? fromParam.split('-')[1] : defaultDuration;
  const pastDuration = parsedParam && isDurationString(parsedParam) ? parsedParam : defaultDuration;

  // TODO: cleanup, fix types
  const defaultTimeRange =
    fromParam !== null && toParam !== null && toParam !== 'now'
      ? { start: new Date(Number(fromParam)), end: new Date(Number(toParam)) }
      : { pastDuration: pastDuration };
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRangeValue>(defaultTimeRange as TimeRangeValue);

  // TODO: Loading indicator
  if (dashboard === undefined) {
    return null;
  }

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
    }
  };

  return (
    <TimeRangeStateProvider initialValue={activeTimeRange} onDateRangeChange={handleOnDateRangeChange}>
      <DashboardView dashboardResource={dashboard} />
    </TimeRangeStateProvider>
  );
}

export default ViewDashboard;
