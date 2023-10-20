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

import { Box, Stack, Typography } from '@mui/material';
import ShieldAccount from 'mdi-material-ui/ShieldAccount';
import { useParams } from 'react-router-dom';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import { AdminTabs } from './AdminTabs';

function AdminView() {
  const { tab } = useParams();
  return (
    <Stack sx={{ width: '100%' }} m={2} gap={2}>
      <AppBreadcrumbs rootPageName="Administration" />
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1}>
            <ShieldAccount fontSize={'large'} />
            <Typography variant="h1">Administration</Typography>
          </Stack>
        </Stack>
      </Box>
      <AdminTabs initialTab={tab} />
    </Stack>
  );
}

export default AdminView;
