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

import { Box, BoxProps, Stack, Typography } from '@mui/material';
import { combineSx } from '@perses-dev/components';
import { DashboardResource } from '@perses-dev/core';
import { TimeRangeStateProvider, TemplateVariablesProvider } from '../context';
import { Dashboard, VariableList, PageHeader, TimeRangeControls } from '../components';

export interface ViewDashboardProps extends BoxProps {
  dashboardResource: DashboardResource;
}

/**
 * The View for displaying a Dashboard, along with the UI for selecting variable values.
 */
export function ViewDashboard(props: ViewDashboardProps) {
  const { dashboardResource, sx, children, ...others } = props;

  // TODO: add shareable URL support
  const pastDuration = dashboardResource.spec.duration;

  return (
    <TimeRangeStateProvider initialValue={{ pastDuration: pastDuration, end: new Date() }}>
      <TemplateVariablesProvider variableDefinitions={dashboardResource.spec.variables}>
        <Box
          sx={combineSx(
            {
              display: 'flex',
              width: '100%',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
            },
            sx
          )}
          {...others}
        >
          <Box
            sx={{
              padding: (theme) => theme.spacing(1, 2),
              flexGrow: 1,
              overflowX: 'hidden',
              overflowY: 'auto',
            }}
          >
            <Stack
              sx={{
                backgroundColor: (theme) => theme.palette.background.paper,
              }}
            >
              <PageHeader
                sx={{
                  minHeight: 70,
                  backgroundColor: (theme) => theme.palette.background.paper,
                  borderBottom: (theme) => `1px solid ${theme.palette.grey[100]}`,
                }}
              >
                <Typography variant="h2" sx={{ fontWeight: (theme) => theme.typography.fontWeightRegular }}>
                  {dashboardResource.metadata.name}
                </Typography>
                <TimeRangeControls />
              </PageHeader>
              <VariableList
                variables={dashboardResource.spec.variables}
                sx={(theme) => ({
                  margin: theme.spacing(0, 2, 2),
                })}
              />
            </Stack>
            <Dashboard spec={dashboardResource.spec} />
            {children}
          </Box>
        </Box>
      </TemplateVariablesProvider>
    </TimeRangeStateProvider>
  );
}
