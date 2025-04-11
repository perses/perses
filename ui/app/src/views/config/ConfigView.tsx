// Copyright 2025 The Perses Authors
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

import { ReactElement, useState } from 'react';
import { Stack, Box } from '@mui/material';
import Cog from 'mdi-material-ui/Cog';
import Puzzle from 'mdi-material-ui/Puzzle';
import { JSONEditor } from '@perses-dev/components';
import { MenuTab, MenuTabs } from '../../components/tabs';

import AppBreadcrumbs from '../../components/breadcrumbs/AppBreadcrumbs';
import { useConfigContext } from '../../context/Config';
import { useIsMobileSize } from '../../utils/browser-size';
import { PluginsList } from './PluginsList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps): ReactElement | null {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function ConfigView(): ReactElement {
  const { config } = useConfigContext();
  const isMobileSize = useIsMobileSize();
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTabIndex(newValue);
  };

  return (
    <Stack sx={{ width: '100%', overflowX: 'hidden' }} m={isMobileSize ? 1 : 2} mt={1.5} gap={1}>
      <AppBreadcrumbs rootPageName="Configuration" icon={<Cog fontSize="large" />} />
      <Stack>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <MenuTabs value={tabIndex} onChange={handleTabChange} aria-label="configuration tabs">
            <MenuTab
              iconPosition="start"
              icon={<Cog />}
              label="Server Configuration"
              id="tab-0"
              aria-controls="tabpanel-0"
            />
            <MenuTab
              iconPosition="start"
              icon={<Puzzle />}
              label="Installed Plugins"
              id="tab-1"
              aria-controls="tabpanel-1"
            />
          </MenuTabs>
        </Stack>
        <TabPanel value={tabIndex} index={0}>
          <JSONEditor value={config} readOnly />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <PluginsList />
        </TabPanel>
      </Stack>
    </Stack>
  );
}

export default ConfigView;
