// Copyright The Perses Authors
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

import { Alert, Box, Card, CircularProgress, Stack, Tab, Tabs } from '@mui/material';
import { ChartsProvider, useChartsTheme } from '@perses-dev/components';
import type { DatasourceStoreProviderProps, VariableProviderProps } from '@perses-dev/dashboards';
import {
  DatasourceStoreProvider,
  DEFAULT_DASHBOARD_DURATION,
  DEFAULT_REFRESH_INTERVAL,
  VariableProvider,
} from '@perses-dev/dashboards';
import {
  ExploreToolbar,
  ExplorerManagerProviderWithQueryParams,
  getExplorerKey,
  useExplorerManagerContext,
  useSortedExplorerPlugins,
} from '@perses-dev/explore';
import type { PluginMetadataWithModule } from '@perses-dev/plugin-system';
import {
  PluginLoaderComponent,
  TimeRangeProviderWithQueryParams,
  useInitialRefreshInterval,
  useInitialTimeRange,
  usePluginRegistry,
} from '@perses-dev/plugin-system';
import type { ReactElement, ReactNode, SyntheticEvent } from 'react';
import { useCallback, useMemo } from 'react';

import type { ExploreSignal } from './explore-signals';
import { EXPLORE_SIGNALS, getPlaceholderExplorerKey } from './explore-signals';
import { LogsExplorer } from './LogsExplorer';

const ROOT_SX = { display: 'flex', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' };
const SCROLL_SX = { flexGrow: 1, overflowX: 'hidden', overflowY: 'auto', display: 'flex', flexDirection: 'column' };
const LOADING_SX = { alignSelf: 'center', mt: 4 };
const FULL_WIDTH_SX = { width: '100%' };
const TABS_SX = { borderBottom: 1, borderColor: 'divider' };
const CARD_SX = { padding: '10px', width: '100%', minWidth: 0 };

interface SignalTab {
  signal: ExploreSignal;
  explorerKey: string;
  plugin?: PluginMetadataWithModule;
}

export interface ExploreWorkspaceProps {
  datasourceApi: DatasourceStoreProviderProps['datasourceApi'];
  projectName?: DatasourceStoreProviderProps['projectName'];
  externalVariableDefinitions?: VariableProviderProps['externalVariableDefinitions'];
  exploreTitleComponent?: ReactNode;
}

/**
 * Explore page with one tab per observability signal and a label explorer next to the active explorer.
 * It reuses the providers of the `ViewExplore` component from `@perses-dev/explore`.
 */
export function ExploreWorkspace(props: ExploreWorkspaceProps): ReactElement {
  const { datasourceApi, projectName, externalVariableDefinitions, exploreTitleComponent } = props;
  const initialTimeRange = useInitialTimeRange(DEFAULT_DASHBOARD_DURATION);
  const initialRefreshInterval = useInitialRefreshInterval(DEFAULT_REFRESH_INTERVAL);
  const chartsTheme = useChartsTheme();
  const signalTabs = useSignalTabs();

  return (
    <DatasourceStoreProvider datasourceApi={datasourceApi} projectName={projectName}>
      <TimeRangeProviderWithQueryParams
        initialTimeRange={initialTimeRange}
        initialRefreshInterval={initialRefreshInterval}
      >
        <VariableProvider externalVariableDefinitions={externalVariableDefinitions}>
          <Box sx={ROOT_SX}>
            <Box sx={SCROLL_SX}>
              <ChartsProvider chartsTheme={chartsTheme} enablePinning={false}>
                {signalTabs === undefined ? (
                  <CircularProgress sx={LOADING_SX} aria-label="Loading explorers" />
                ) : (
                  <ExplorerManagerProviderWithQueryParams defaultExplorer={signalTabs[0]?.explorerKey}>
                    <ExploreSignals
                      signalTabs={signalTabs}
                      projectName={projectName}
                      exploreTitleComponent={exploreTitleComponent}
                    />
                  </ExplorerManagerProviderWithQueryParams>
                )}
              </ChartsProvider>
            </Box>
          </Box>
        </VariableProvider>
      </TimeRangeProviderWithQueryParams>
    </DatasourceStoreProvider>
  );
}

/**
 * Matches each signal with its installed Explore plugin, if any. Installed explorers that do not belong to a signal
 * get a tab of their own so they stay reachable.
 */
function useSignalTabs(): SignalTab[] | undefined {
  const plugins = useSortedExplorerPlugins();
  return useMemo(() => {
    if (plugins === undefined) return undefined;
    const signalTabs: SignalTab[] = EXPLORE_SIGNALS.map((signal) => {
      const plugin = plugins.find((p) => p.spec.name === signal.explorerPluginName);
      return {
        signal,
        plugin,
        explorerKey: plugin ? getExplorerKey(plugin) : getPlaceholderExplorerKey(signal),
      };
    });
    const otherTabs: SignalTab[] = plugins
      .filter((plugin) => !EXPLORE_SIGNALS.some((signal) => signal.explorerPluginName === plugin.spec.name))
      .map((plugin) => ({
        signal: { id: getExplorerKey(plugin), label: plugin.spec.display.name, explorerPluginName: plugin.spec.name },
        plugin,
        explorerKey: getExplorerKey(plugin),
      }));
    return [...signalTabs, ...otherTabs];
  }, [plugins]);
}

interface ExploreSignalsProps {
  signalTabs: SignalTab[];
  projectName?: string;
  exploreTitleComponent?: ReactNode;
}

function ExploreSignals(props: ExploreSignalsProps): ReactElement {
  const { signalTabs, projectName, exploreTitleComponent } = props;
  const { explorer, setExplorer } = useExplorerManagerContext();
  const { pluginsBaseURL } = usePluginRegistry();
  const current = signalTabs.find((tab) => tab.explorerKey === explorer) ?? signalTabs[0];
  const handleTabChange = useCallback((_: SyntheticEvent, key: string) => setExplorer(key), [setExplorer]);
  const explorerPlugin = useMemo(
    () =>
      current?.plugin && {
        name: current.plugin.spec.name,
        moduleName: current.plugin.module.name,
        version: current.plugin.module.version,
        registry: current.plugin.module.registry,
        baseURL: pluginsBaseURL,
      },
    [current, pluginsBaseURL],
  );
  const isLogs = current?.signal.id === 'logs' && current.plugin !== undefined;

  return (
    <Stack sx={FULL_WIDTH_SX} px={2} pb={2} pt={1.5} gap={1}>
      <ExploreToolbar exploreTitleComponent={exploreTitleComponent} />
      <Tabs
        value={current?.explorerKey ?? false}
        onChange={handleTabChange}
        variant="scrollable"
        aria-label="Signals"
        sx={TABS_SX}
      >
        {signalTabs.map(({ signal, explorerKey }) => (
          <Tab key={signal.id} value={explorerKey} label={signal.label} />
        ))}
      </Tabs>
      {isLogs && <LogsExplorer key={current.explorerKey} projectName={projectName} />}
      {!isLogs && (
        <Card sx={CARD_SX}>
          {explorerPlugin && current && <PluginLoaderComponent key={current.explorerKey} plugin={explorerPlugin} />}
          {current && !current.plugin && (
            <Alert severity="info">
              {current.signal.label} exploration is not available yet: the {current.signal.explorerPluginName} plugin is
              not installed.
            </Alert>
          )}
        </Card>
      )}
    </Stack>
  );
}
