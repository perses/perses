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

import { Box, Button, Card, Stack, Tab, Tabs, useMediaQuery } from '@mui/material';
import { PluginLoaderComponent, useListPluginMetadata } from '@perses-dev/plugin-system';
import { ReactElement, ReactNode, useEffect, useMemo } from 'react';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import ChevronLeft from 'mdi-material-ui/ChevronLeft';
import { useLocalStorage } from '@perses-dev/app/src/utils/browser-storage';
import { ExploreToolbar } from '../ExploreToolbar';
import { useExplorerManagerContext } from './ExplorerManagerProvider';

export interface ExploreManagerProps {
  exploreTitleComponent?: ReactNode;
}

export function ExploreManager(props: ExploreManagerProps): ReactElement {
  const { exploreTitleComponent } = props;
  const { explorer, setExplorer } = useExplorerManagerContext();

  const plugins = useListPluginMetadata(['Explore']);

  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>('explore-tabs-collapsed', false);

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
    <Stack sx={{ width: '100%' }} px={2} pb={2} pt={1.5} gap={1}>
      <ExploreToolbar exploreTitleComponent={exploreTitleComponent} />

      <Stack direction={isSmallScreen ? 'column' : 'row'} gap={2} sx={{ width: '100%' }}>
        <Stack
          sx={{
            borderRight: isSmallScreen ? 0 : 1,
            borderBottom: isSmallScreen ? 1 : 0,
            borderColor: 'divider',
            minWidth: isCollapsed ? 15 : 100,
          }}
        >
          <Box sx={{ position: 'relative', height: 30, display: isSmallScreen ? 'none' : undefined }} test-id="qdqwd">
            <Button
              title={isCollapsed ? 'Expand explorer tabs' : 'Collapse explorer tabs'}
              aria-label={isCollapsed ? 'Expand explorer tabs' : 'Collapse explorer tabs'}
              variant="text"
              sx={{
                position: 'absolute',
                right: -15,
                zIndex: 1,
                padding: 0.5,
                minWidth: 'auto',
                backgroundColor: (theme) => theme.palette.background.default,
              }}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </Box>

          <Tabs
            orientation={isSmallScreen ? 'horizontal' : 'vertical'}
            value={explorer}
            onChange={(_, state) => setExplorer(state)}
            variant={isSmallScreen ? 'fullWidth' : 'scrollable'}
            sx={{
              display: isCollapsed ? 'none' : 'flex',
            }}
          >
            {plugins.data
              ?.sort((a, b) => a.spec.display.name.localeCompare(b.spec.display.name))
              .map((plugin) => (
                <Tab
                  key={`${plugin.module.name}-${plugin.spec.name}`}
                  value={`${plugin.module.name}-${plugin.spec.name}`}
                  label={plugin.spec.display.name}
                  sx={{
                    padding: 0.5,
                  }}
                />
              ))}
          </Tabs>
        </Stack>
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
