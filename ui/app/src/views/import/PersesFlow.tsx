// Copyright 2024 The Perses Authors
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

import { Alert, Autocomplete, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import Import from 'mdi-material-ui/Import';
import { useNavigate } from 'react-router-dom';

import { useSnackbar } from '@perses-dev/components';
import { DashboardResource } from '@perses-dev/core';
import { useProjectList } from '../../model/project-client';
import { useCreateDashboardMutation } from '../../model/dashboard-client';
import { useIsReadonly } from '../../context/Config';

interface PersesFlowProps {
  dashboard: DashboardResource;
}

function PersesFlow({ dashboard }: PersesFlowProps) {
  const navigate = useNavigate();
  const isReadonly = useIsReadonly();
  const { exceptionSnackbar } = useSnackbar();
  const [projectName, setProjectName] = useState<string>('');
  const { data } = useProjectList({ onError: exceptionSnackbar });
  const dashboardMutation = useCreateDashboardMutation((data) => {
    navigate(`/projects/${data.metadata.project}/dashboards/${data.metadata.name}`);
  });

  const importOnClick = () => {
    dashboard.metadata.project = projectName;
    dashboardMutation.mutate(dashboard);
  };

  return (
    <>
      {data !== undefined && data !== null && (
        <Stack direction="column">
          <Typography variant="h2" sx={{ paddingTop: 2, paddingBottom: 1 }}>
            2. Import
          </Typography>
          <Stack width="100%" gap={1}>
            <Autocomplete
              disablePortal
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Project name"
                  onBlur={(event) => {
                    setProjectName(event.target.value);
                  }}
                />
              )}
              options={data.map((project) => {
                return project.metadata.name;
              })}
            />
            <Button
              variant="contained"
              disabled={dashboardMutation.isLoading || projectName.length === 0 || isReadonly}
              startIcon={<Import />}
              onClick={importOnClick}
            >
              Import
            </Button>
            {dashboardMutation.isError && (
              <Alert variant="outlined" severity="error">
                {dashboardMutation.error.message}
              </Alert>
            )}
            {isReadonly && (
              <Alert severity="warning" sx={{ backgroundColor: 'transparent', padding: 0 }}>
                Dashboard managed via code only.
              </Alert>
            )}
          </Stack>
        </Stack>
      )}
    </>
  );
}

export default PersesFlow;
