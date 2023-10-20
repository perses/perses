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

import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import Cog from 'mdi-material-ui/Cog';
import { JSONEditor } from '@perses-dev/components';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import { useConfig } from '../../model/config-client';

function ConfigView() {
  const { data, isLoading } = useConfig();
  return (
    <Stack sx={{ width: '100%' }} m={2} gap={2}>
      <AppBreadcrumbs rootPageName="Configuration" />
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1}>
            <Cog fontSize={'large'} />
            <Typography variant="h1">Configuration</Typography>
          </Stack>
        </Stack>
      </Box>
      {isLoading && (
        <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Stack>
      )}
      {data !== undefined && <JSONEditor value={data} readOnly />}
    </Stack>
  );
}

export default ConfigView;
