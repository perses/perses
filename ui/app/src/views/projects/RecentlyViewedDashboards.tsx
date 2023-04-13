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

import { useNavigate } from 'react-router-dom';
import { Box, Stack, Typography, Card } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import HistoryIcon from 'mdi-material-ui/History';
import { useState } from 'react';
import { useRecentDashboardList } from '../../model/dashboard-client';
import { CreateDashboardDialog } from '../../components/CreateDashboardDialog/CreateDashboardDialog';
import { RecentDashboardList } from '../../components/DashboardList/RecentDashboardList';

interface RecentlyViewedDashboardsProps {
  projectName: string;
  id?: string;
}

export function RecentlyViewedDashboards(props: RecentlyViewedDashboardsProps) {
  const navigate = useNavigate();

  const [openCreateDashboardDialogState, setOpenCreateDashboardDialogState] = useState(false);
  const data = useRecentDashboardList(props.projectName);

  const handleDashboardCreation = function (name: string) {
    navigate(`/projects/${props.projectName}/dashboards/${name}/create`);
  };

  return (
    <Box id={props.id}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" gap={1} my={2}>
          <HistoryIcon />
          <Typography variant="h3">Recently Viewed</Typography>
        </Stack>
      </Stack>
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <Card>
          <RecentDashboardList dashboardList={data} />
        </Card>
      </ErrorBoundary>
      <CreateDashboardDialog
        open={openCreateDashboardDialogState}
        onClose={() => setOpenCreateDashboardDialogState(false)}
        onSuccess={(name: string) => handleDashboardCreation(name)}
      />
    </Box>
  );
}
