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
import { PluginLoaderComponent, useListPluginMetadata } from '@perses-dev/plugin-system';
import { ReactElement, ReactNode, useEffect, useMemo } from 'react';
import { ExploreToolbar } from '../ExploreToolbar';
import { useExplorerManagerContext } from './ExplorerManagerProvider';

export interface ExploreManagerProps {
  exploreTitleComponent?: ReactNode;
}

export function ExploreManager(props: ExploreManagerProps): ReactElement {
  const { exploreTitleComponent } = props;
  const { explorer, setExplorer } = useExplorerManagerContext();

  const plugins = useListPluginMetadata(['Explore']);

  const smallScreen = useMediaQuery('(max-width: 768px)');

  const explorerPluginsMap = useMemo(
    () =>
      Object.fromEntries(plugins.data?.map((plugin) => [`${plugin.module.name}-${plugin.spec.name}`, plugin]) ?? []),
    [plugins.data]
  );

  useEffect(() => {
    const plugins = Object.keys(explorerPluginsMap);
    if (!explorer && plugins?.[0]) {
      setExplorer(plugins[0]);
    }
  }, [explorerPluginsMap, explorer, setExplorer]);

  const currentPlugin = explorer ? explorerPluginsMap[explorer] : undefined;

  if (!explorer) {
    return <div>No explorer plugin available</div>;
  }

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
          {plugins.data?.map((plugin) => (
            <Tab
              key={`${plugin.module.name}-${plugin.spec.name}`}
              value={`${plugin.module.name}-${plugin.spec.name}`}
              label={plugin.spec.display.name}
            />
          ))}
        </Tabs>
        <Card sx={{ padding: '10px', width: '100%' }}>
          {currentPlugin && (
            <PluginLoaderComponent
              key={`${currentPlugin.module.name}-${currentPlugin.spec.name}`}
              plugin={{
                name: currentPlugin.spec.name,
                moduleName: currentPlugin.module.name,
              }}
            />
          )}
        </Card>
      </Stack>
    </Stack>
  );
}
