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

import { Button, Stack, Typography } from '@mui/material';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import { DashboardResource } from '@perses-dev/core';
import { dashboardDisplayName } from '@perses-dev/core/dist/utils/text';
import FolderPoundIcon from 'mdi-material-ui/FolderPound';
import { useNavigate } from 'react-router-dom';

interface DashboardCardProps {
  dashboard: DashboardResource;
}

export function DashboardCard(props: DashboardCardProps) {
  const naviguate = useNavigate();

  return (
    <Button
      variant="contained"
      fullWidth
      sx={{ justifyContent: 'start', backgroundColor: (theme) => theme.palette.designSystem.blue[700] }}
      onClick={() =>
        naviguate(`/projects/${props.dashboard.metadata.project}/dashboards/${props.dashboard.metadata.name}`)
      }
      title={dashboardDisplayName(props.dashboard)}
    >
      <Stack sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, maxWidth: '100%' }}>
        <ViewDashboardIcon />
        <Stack sx={{ flexDirection: 'column', maxWidth: '90%' }}>
          <Typography
            variant="h3"
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'initial', textAlign: 'start' }}
          >
            {dashboardDisplayName(props.dashboard)}
          </Typography>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, textAlign: 'start' }}>
            <FolderPoundIcon fontSize={'small'} /> {props.dashboard.metadata.project}
          </Typography>
        </Stack>
      </Stack>
    </Button>
  );
}
