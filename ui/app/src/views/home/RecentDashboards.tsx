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

import { Card, Stack } from '@mui/material';
import HistoryIcon from 'mdi-material-ui/History';
import { RecentDashboardList } from '../../components/DashboardList/RecentDashboardList';
import { useRecentDashboardList } from '../../model/dashboard-client';

export function RecentDashboards() {
  const { data, isLoading } = useRecentDashboardList();

  return (
    <Stack>
      <Stack direction="row" alignItems="center" gap={1}>
        <HistoryIcon />
        <h2>Recently Viewed Dashboards</h2>
      </Stack>
      <Card id="recent-dashboard-list">
        <RecentDashboardList dashboardList={data} isLoading={isLoading} />
      </Card>
    </Stack>
  );
}
