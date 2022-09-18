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

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ViewDashboard as DashboardView } from '@perses-dev/dashboards';
import { TimeRangeProvider } from '@perses-dev/plugin-system';
import { DashboardResource, getDefaultTimeRange } from '@perses-dev/core';

export interface DashboardAppProps {
  dashboardResource: DashboardResource;
}

/**
 * Determines initial state and renders a Dashboard
 */
function DashboardApp(props: DashboardAppProps) {
  const { dashboardResource } = props;

  const [searchParams, setSearchParams] = useSearchParams();

  const fromParam = searchParams.get('from') ?? '';
  const toParam = searchParams.get('to') ?? '';
  const dashboardDuration = dashboardResource?.spec.duration ?? '1h';
  const defaultTimeRange = getDefaultTimeRange(fromParam, toParam, dashboardDuration);

  useEffect(() => {
    if (fromParam === '') {
      searchParams.set('from', `now-${dashboardDuration}`);
      searchParams.set('to', 'now');
      setSearchParams(searchParams);
    }
  }, [dashboardDuration, fromParam, searchParams, setSearchParams]);

  return (
    <TimeRangeProvider initialTimeRange={defaultTimeRange}>
      <DashboardView dashboardResource={dashboardResource} />
    </TimeRangeProvider>
  );
}

export default DashboardApp;
