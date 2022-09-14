// Copyright 2022 The Perses Authors
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
import { DashboardResource, getDefaultTimeRange, isRelativeTimeRange, TimeRangeValue } from '@perses-dev/core';

export interface ViewDashboardProps {
  dashboardResource: DashboardResource;
}

/**
 * The View for viewing a Dashboard.
 */
function ViewDashboard(props: ViewDashboardProps) {
  const { dashboardResource } = props;

  const [searchParams, setSearchParams] = useSearchParams();

  const fromParam = searchParams.get('from') ?? '';
  const toParam = searchParams.get('to') ?? '';
  const defaultTimeRange = getDefaultTimeRange(fromParam, toParam, dashboardResource);
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRangeValue>(defaultTimeRange as TimeRangeValue);

  const handleOnDateRangeChange = (event: TimeRangeValue) => {
    if (isRelativeTimeRange(event)) {
      searchParams.set('from', `now-${event.pastDuration}`);
      searchParams.set('to', 'now');
      setSearchParams(searchParams);
    } else {
      const startUnixMs = getUnixTime(event.start) * 1000;
      const endUnixMs = getUnixTime(event.end) * 1000;
      searchParams.set('from', startUnixMs.toString());
      searchParams.set('to', endUnixMs.toString());
      setSearchParams(searchParams);
      setActiveTimeRange({ start: event.start, end: event.end });
    }
  };

  return (
    <TimeRangeStateProvider initialValue={activeTimeRange} onDateRangeChange={handleOnDateRangeChange}>
      <DashboardView dashboardResource={dashboardResource} />
    </TimeRangeStateProvider>
  );
}

export default ViewDashboard;
