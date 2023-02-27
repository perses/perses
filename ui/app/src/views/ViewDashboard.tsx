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

import { ViewDashboard as DashboardView, ViewDashboardProps } from '@perses-dev/dashboards';
import { useSetTimeRangeParams, useInitialTimeRange } from '@perses-dev/use-query-params';
import DashboardBreadcrumbs from '../components/DashboardBreadcrumbs';

/**
 * The View for viewing a Dashboard.
 */
export function ViewDashboard({
  dashboardResource,
  datasourceApi,
  onSave,
  onDiscard,
  isReadonly,
  isEditing,
}: Omit<ViewDashboardProps, 'onChangeTime'>) {
  const dashboardDuration = dashboardResource.spec.duration ?? '1h';
  const initialTimeRange = useInitialTimeRange(dashboardDuration);
  const { setTimeRange, timeRange } = useSetTimeRangeParams(initialTimeRange);

  return (
    <DashboardView
      dashboardResource={dashboardResource}
      datasourceApi={datasourceApi}
      dashboardTitleComponent={
        <DashboardBreadcrumbs
          dashboardName={
            dashboardResource.spec.display ? dashboardResource.spec.display.name : dashboardResource.metadata.name
          }
          dashboardProject={dashboardResource.metadata.project}
        />
      }
      onSave={onSave}
      onDiscard={onDiscard}
      initialVariableIsSticky={true}
      isReadonly={isReadonly}
      isEditing={isEditing}
      onChangeTime={setTimeRange}
      timeRange={timeRange}
    />
  );
}

export default ViewDashboard;
