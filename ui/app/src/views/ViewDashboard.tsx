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

import { useQueryParams, StringParam } from 'use-query-params';
import { DashboardResource } from '@perses-dev/core';
import { ViewDashboard as DashboardView } from '@perses-dev/dashboards';
import { useDatasourceApi } from '../model/datasource-api';
import { useSampleData } from '../utils/temp-sample-data';

const DEFAULT_DASHBOARD_ID = 'node-exporter-full';

/**
 * The View for viewing a Dashboard.
 */
function ViewDashboard() {
  const [query] = useQueryParams({ dashboard: StringParam });
  const { dashboard } = query;

  // TODO: setup project routing
  const sampleDashboard = useSampleData<DashboardResource>(dashboard || DEFAULT_DASHBOARD_ID);

  const datasourceApi = useDatasourceApi();

  // TODO: Loading indicator
  if (sampleDashboard === undefined) {
    return null;
  }

  return <DashboardView dashboardResource={sampleDashboard} datasourceApi={datasourceApi} />;
}

export default ViewDashboard;
