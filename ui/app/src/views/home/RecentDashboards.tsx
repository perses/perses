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

import { CircularProgress, Grid, Stack, Typography } from '@mui/material';
import HistoryIcon from 'mdi-material-ui/History';
import { useRecentDashboardList } from '../../model/dashboard-client';
import { DashboardCard } from '../../components/DashboardCard/DashboardCard';

function RecentDashboardsMosaic() {
  const { data, isLoading } = useRecentDashboardList(undefined, 6);

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (data.length === 0) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} width="100%" height="50">
        <Typography variant={'subtitle1'}>No dashboards recently viewed</Typography>
      </Stack>
    );
  }

  return (
    <>
      {data.map((datedDashboard) => (
        <Grid key={datedDashboard.dashboard.metadata.name} item xs={6} lg={4}>
          <DashboardCard dashboard={datedDashboard.dashboard}></DashboardCard>
        </Grid>
      ))}
    </>
  );
}

export function RecentDashboards() {
  return (
    <Stack>
      <Stack direction="row" alignItems="center" gap={1}>
        <HistoryIcon />
        <h2>Recent Dashboards</h2>
      </Stack>
      <Grid container spacing={2}>
        <RecentDashboardsMosaic />
      </Grid>
    </Stack>
  );
}
