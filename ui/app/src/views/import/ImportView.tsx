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

import { Button, Container, Divider, Stack, Typography } from '@mui/material';
import AutoFix from 'mdi-material-ui/AutoFix';
import Upload from 'mdi-material-ui/Upload';
import { ChangeEvent, useState } from 'react';
import { JSONEditor } from '@perses-dev/components';
import { DashboardResource } from '@perses-dev/core';
import { useIsMobileSize } from '../../utils/browser-size';
import GrafanaFlow from './GrafanaFlow';
import PersesFlow from './PersesFlow';

type DashboardType = 'grafana' | 'perses';

type Dashboard = GrafanaDashboard | PersesDashboard | undefined;

interface GrafanaDashboard {
  kind: 'grafana';
  data: Record<string, unknown>;
}

interface PersesDashboard {
  kind: 'perses';
  data: DashboardResource;
}

function ImportView() {
  const [dashboard, setDashboard] = useState<Dashboard>();
  const isMobileSize = useIsMobileSize();

  const getDashboardType = (dashboard: Record<string, unknown>): DashboardType | undefined => {
    if ('kind' in dashboard) {
      return 'perses';
    }

    return 'grafana';
  };

  const fileUploadOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files === null) {
      return;
    }
    const value = await files[0]?.text();
    if (value !== undefined) {
      completeDashboard(value);
    }
  };

  const completeDashboard = (dashboard: string | undefined) => {
    try {
      const json = JSON.parse(dashboard ?? '{}');
      const type = getDashboardType(json);
      if (type !== undefined) {
        setDashboard({
          kind: type,
          data: json,
        });
      }
    } catch (e) {
      setDashboard(undefined);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ padding: isMobileSize ? 1 : 2, overflowX: 'hidden' }}>
      <Stack direction="row" alignItems="center" gap={1} mb={2}>
        <AutoFix fontSize="large" />
        <Typography variant="h1">Import</Typography>
      </Stack>
      <Stack direction="column" spacing={1}>
        <Typography variant="h2" sx={{ paddingTop: 2 }}>
          1. Provide a dashboard
        </Typography>
        <Button fullWidth startIcon={<Upload />} variant="outlined" component="label">
          Upload JSON file
          <input type="file" onChange={fileUploadOnChange} hidden style={{ width: '100%' }} />
        </Button>
        <Divider>OR</Divider>
        <JSONEditor
          value={dashboard?.data}
          onChange={(value: string) => completeDashboard(value)}
          minHeight="10rem"
          maxHeight="30rem"
          width="100%"
          placeholder="Paste your Dashboard JSON here..."
        />
        {dashboard !== undefined && dashboard.kind === 'grafana' && <GrafanaFlow dashboard={dashboard?.data} />}
        {dashboard !== undefined && dashboard.kind === 'perses' && <PersesFlow dashboard={dashboard?.data} />}
      </Stack>
    </Container>
  );
}

export default ImportView;
