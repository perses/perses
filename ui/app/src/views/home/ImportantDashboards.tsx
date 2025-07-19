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
import { DashboardResource } from '@perses-dev/core';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import { ReactElement } from 'react';
import { Trans } from 'react-i18next';

import { useImportantDashboardList } from '../../model/dashboard-client';
import { DashboardCard } from '../../components/DashboardCard/DashboardCard';
import { useIsMobileSize } from '../../utils/browser-size';
import { useConfig } from '../../model/config-client';

interface DashboardMosaicProps {
  dashboards: DashboardResource[];
}

function DashboardMosaic({ dashboards }: DashboardMosaicProps): ReactElement {
  const isMobileSize = useIsMobileSize();

  //return <h1>{t('Welcome to React')}</h1>
  if (dashboards.length === 0) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} width="100%" height="50">
        <Typography variant="subtitle1">Empty</Typography>
      </Stack>
    );
  }

  return (
    <Grid container spacing={isMobileSize ? 1 : 2} data-testid="important-dashboards-mosaic">
      {dashboards.map((dashboard) => (
        <Grid key={`${dashboard.metadata.project}-${dashboard.metadata.name}`} item xs={6} lg={4}>
          <DashboardCard dashboard={dashboard} hideIcon={isMobileSize}></DashboardCard>
        </Grid>
      ))}
    </Grid>
  );
}

export function ImportantDashboards(): ReactElement {
  const { data: config } = useConfig();
  const { data: dashboards, isLoading } = useImportantDashboardList();

  // If no important dashboard defined, hide the section
  if (!config?.frontend.important_dashboards?.length || dashboards.length === 0) {
    return <></>;
  }

  return (
    <Stack>
      <Stack direction="row" alignItems="center" gap={1}>
        <ViewDashboardIcon />
        <h1>
          <Trans i18nKey="Perses_lblImportantDashboards" />
        </h1>
      </Stack>
      {isLoading ? (
        <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Stack>
      ) : (
        <DashboardMosaic dashboards={dashboards} />
      )}
    </Stack>
  );
}
