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

import { Card, Stack, Tab, Tabs, useMediaQuery } from '@mui/material';
import { ReactNode } from 'react';
import { ExploreToolbar } from '../ExploreToolbar';
import { TracesExplorer } from './TracesExplorer';
import { MetricsExplorer } from './MetricsExplorer';
import { useExplorerManagerContext } from './ExplorerManagerProvider';

export interface ExploreManagerProps {
  exploreTitleComponent?: ReactNode;
}

export function ExploreManager(props: ExploreManagerProps) {
  const { exploreTitleComponent } = props;
  const { explorer, setExplorer } = useExplorerManagerContext();

  const smallScreen = useMediaQuery('(max-width: 768px)');
  return (
    <Stack sx={{ width: '100%' }} px={2} pb={2} pt={1.5} gap={3}>
      <ExploreToolbar exploreTitleComponent={exploreTitleComponent} />

      <Stack direction={smallScreen ? 'column' : 'row'} gap={2} sx={{ width: '100%' }}>
        <Tabs
          orientation={smallScreen ? 'horizontal' : 'vertical'}
          value={explorer}
          onChange={(_, state) => setExplorer(state)}
          variant={smallScreen ? 'fullWidth' : 'scrollable'}
          sx={{
            borderRight: smallScreen ? 0 : 1,
            borderBottom: smallScreen ? 1 : 0,
            borderColor: 'divider',
            minWidth: '100px',
          }}
        >
          <Tab label="Metrics" />
          <Tab label="Traces" />
        </Tabs>
        <Card sx={{ padding: '10px', width: '100%' }}>
          {explorer === 0 && <MetricsExplorer />}
          {explorer === 1 && <TracesExplorer />}
        </Card>
      </Stack>
    </Stack>
  );
}
