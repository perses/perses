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

import { Stack } from '@mui/material';
import Cog from 'mdi-material-ui/Cog';
import { JSONEditor } from '@perses-dev/components';
import AppBreadcrumbs from '../../components/breadcrumbs/AppBreadcrumbs';
import { useConfigContext } from '../../context/Config';
import { useIsMobileSize } from '../../utils/browser-size';

function ConfigView() {
  const { config } = useConfigContext();
  const isMobileSize = useIsMobileSize();

  return (
    <Stack sx={{ width: '100%', overflowX: 'hidden' }} m={isMobileSize ? 1 : 2} mt={1.5} gap={2}>
      <AppBreadcrumbs rootPageName="Configuration" icon={<Cog fontSize={'large'} />} />
      <JSONEditor value={config} readOnly />
    </Stack>
  );
}

export default ConfigView;
