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

import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from 'mdi-material-ui/ChevronDown';
import Cog from 'mdi-material-ui/Cog';
import { JSONEditor } from '@perses-dev/components';
import { ReactElement } from 'react';
import AppBreadcrumbs from '../../components/breadcrumbs/AppBreadcrumbs';
import { useConfigContext } from '../../context/Config';
import { useIsMobileSize } from '../../utils/browser-size';
import { PluginsList } from '../plugins/PluginsList';

function ConfigView(): ReactElement {
  const { config } = useConfigContext();
  const isMobileSize = useIsMobileSize();

  return (
    <Stack sx={{ width: '100%', overflowX: 'hidden' }} m={isMobileSize ? 1 : 2} mt={1.5} gap={2}>
      <AppBreadcrumbs rootPageName="Configuration" icon={<Cog fontSize="large" />} />
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} id="config-header" aria-controls="config-content">
          <Typography variant="h2"> Server Configuration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <JSONEditor value={config} readOnly />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} id="config-header" aria-controls="config-content">
          <Typography variant="h2"> Installed Plugins</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <PluginsList />
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}

export default ConfigView;
