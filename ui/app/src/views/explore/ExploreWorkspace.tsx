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

import { Alert, Box, Button, Card, CircularProgress, Stack, Tab, Tabs, useMediaQuery } from '@mui/material';
import { ChartsProvider, ErrorAlert, ErrorBoundary, useChartsTheme, useLocalStorage } from '@perses-dev/components';
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
import type { DatasourceSelector, QueryDefinition } from '@perses-dev/spec';
import ChevronLeft from 'mdi-material-ui/ChevronLeft';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import type { ReactElement, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import type { ExploreSignal, LabelSource } from './explore-signals';
import { EXPLORE_SIGNALS, getPlaceholderExplorerKey } from './explore-signals';
import type { MatchOperator } from './label-matchers';
import { addLabelMatcher, formatLabelMatcher } from './label-matchers';
import { LabelExplorer } from './LabelExplorer';

const LABEL_EXPLORER_COLLAPSED_KEY = 'PERSES_EXPLORE_LABELS_COLLAPSED';
const LABEL_EXPLORER_WIDTH = 280;

interface ExplorerQueryData {
  tab?: string;
  queries?: QueryDefinition[];
  [key: string]: unknown;
}

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
          <Box sx={{ display: 'flex', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ flexGrow: 1, overflowX: 'hidden', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <ChartsProvider chartsTheme={chartsTheme} enablePinning={false}>
                {signalTabs === undefined ? (
                  <CircularProgress sx={{ alignSelf: 'center', mt: 4 }} />
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
  const { explorer, data, setExplorer, setData } = useExplorerManagerContext<ExplorerQueryData>();
  const { pluginsBaseURL } = usePluginRegistry();
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const [isCollapsed, setIsCollapsed] = useLocalStorage(LABEL_EXPLORER_COLLAPSED_KEY, false);
  // Explorers copy their queries into local state when mounted, so they are remounted when the label explorer
  // changes the queries.
  const [revision, setRevision] = useState(0);
  const [matcherHint, setMatcherHint] = useState<string>();

  const current = signalTabs.find((tab) => tab.explorerKey === explorer) ?? signalTabs[0];
  const labelSource = current?.plugin ? current.signal.labelSource : undefined;

  const handleAddMatcher = (
    source: LabelSource,
    label: string,
    value: string,
    operator: MatchOperator,
    datasource: DatasourceSelector,
  ): void => {
    const queries = data.queries ?? [];
    const [first, ...rest] = queries;
    const firstQuery = first?.spec.plugin.kind === source.queryPluginKind ? first : undefined;
    const currentQuery = String(firstQuery?.spec.plugin.spec.query ?? '');
    const nextQuery = addLabelMatcher(currentQuery, label, value, operator);

    const buildQuery = (query: string): QueryDefinition => ({
      kind: source.queryKind,
      spec: {
        plugin: {
          kind: source.queryPluginKind,
          spec: { ...firstQuery?.spec.plugin.spec, query, datasource },
        },
      },
    });

    let nextQueries: QueryDefinition[];
    if (firstQuery && nextQuery !== undefined) {
      nextQueries = [buildQuery(nextQuery), ...rest];
      setMatcherHint(undefined);
    } else if (firstQuery) {
      // The first query has no selector to extend (e.g. `sum(up)`), so the matcher starts a new query instead.
      nextQueries = [...queries, buildQuery(`{${formatLabelMatcher(label, value, operator)}}`)];
      setMatcherHint('The first query has no label selector, so a new query was added.');
    } else {
      nextQueries = [buildQuery(nextQuery ?? ''), ...queries];
      setMatcherHint(undefined);
    }

    // The Prometheus finder tab does not show queries, so switch to the table view.
    const tab = data.tab === 'finder' ? 'table' : data.tab;
    setData({ ...data, ...(tab ? { tab } : {}), queries: nextQueries });
    setRevision((r) => r + 1);
  };

  let labelPanelWidth: number | string = isCollapsed ? 15 : LABEL_EXPLORER_WIDTH;
  if (isSmallScreen) {
    labelPanelWidth = '100%';
  }

  return (
    <Stack sx={{ width: '100%' }} px={2} pb={2} pt={1.5} gap={1}>
      <ExploreToolbar exploreTitleComponent={exploreTitleComponent} />
      <Tabs
        value={current?.explorerKey ?? false}
        onChange={(_, key: string) => {
          setMatcherHint(undefined);
          setExplorer(key);
        }}
        variant="scrollable"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {signalTabs.map(({ signal, explorerKey }) => (
          <Tab key={signal.id} value={explorerKey} label={signal.label} data-testid={`explore-tab-${signal.id}`} />
        ))}
      </Tabs>
      <Stack direction={isSmallScreen ? 'column' : 'row'} gap={2} sx={{ width: '100%' }}>
        {labelSource && (
          <Stack
            sx={{
              position: 'relative',
              flexShrink: 0,
              width: labelPanelWidth,
              maxHeight: isSmallScreen ? 400 : 'calc(100vh - 200px)',
              borderRight: isSmallScreen ? 0 : 1,
              borderBottom: isSmallScreen ? 1 : 0,
              borderColor: 'divider',
              pr: isCollapsed ? 0 : 2,
            }}
          >
            {!isSmallScreen && (
              <Button
                title={isCollapsed ? 'Expand label explorer' : 'Collapse label explorer'}
                aria-label={isCollapsed ? 'Expand label explorer' : 'Collapse label explorer'}
                variant="text"
                sx={{
                  position: 'absolute',
                  top: 0,
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
            )}
            {(!isCollapsed || isSmallScreen) && (
              <ErrorBoundary FallbackComponent={ErrorAlert}>
                <LabelExplorer
                  key={labelSource.datasourceKind}
                  labelSource={labelSource}
                  projectName={projectName}
                  onAddMatcher={(label, value, operator, datasource) =>
                    handleAddMatcher(labelSource, label, value, operator, datasource)
                  }
                />
              </ErrorBoundary>
            )}
          </Stack>
        )}
        <Card sx={{ padding: '10px', width: '100%', minWidth: 0 }}>
          {matcherHint && (
            <Alert severity="info" onClose={() => setMatcherHint(undefined)} sx={{ mb: 1 }}>
              {matcherHint}
            </Alert>
          )}
          {current?.plugin && (
            <PluginLoaderComponent
              key={`${current.explorerKey}-${revision}`}
              plugin={{
                name: current.plugin.spec.name,
                moduleName: current.plugin.module.name,
                version: current.plugin.module.version,
                registry: current.plugin.module.registry,
                baseURL: pluginsBaseURL,
              }}
            />
          )}
          {current && !current.plugin && (
            <Alert severity="info" data-testid="explore-placeholder">
              {current.signal.label} exploration is not available yet: the {current.signal.explorerPluginName} plugin is
              not installed.
            </Alert>
          )}
        </Card>
      </Stack>
    </Stack>
  );
}
