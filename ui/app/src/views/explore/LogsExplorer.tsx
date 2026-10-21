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

import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
} from '@mui/material';
import { ErrorAlert, ErrorBoundary, useLocalStorage } from '@perses-dev/components';
import { Panel } from '@perses-dev/dashboards';
import { useExplorerManagerContext } from '@perses-dev/explore';
import {
  DataQueriesProvider,
  PluginKindSelect,
  useAllVariableValues,
  useDatasourceStore,
  usePlugin,
  usePluginEditor,
  useTimeRange,
} from '@perses-dev/plugin-system';
import type { PluginEditorValue, PluginType } from '@perses-dev/plugin-system';
import type { DatasourceSelector, QueryDefinition, UnknownSpec } from '@perses-dev/spec';
import ChevronLeft from 'mdi-material-ui/ChevronLeft';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import Refresh from 'mdi-material-ui/Refresh';
import type { KeyboardEvent, ReactElement } from 'react';
import { useMemo, useRef, useState } from 'react';

import { LabelExplorer } from './LabelExplorer';
import type { LabelOperator, ParsedLogQuery } from './log-selector';
import { formatLogQuery, parseLogQuery, setValueOperator, toggleLabelValue } from './log-selector';

const LOKI_DATASOURCE_KIND = 'LokiDatasource';
const LOKI_LOG_QUERY_KIND = 'LokiLogQuery';
const LABEL_EXPLORER_COLLAPSED_KEY = 'PERSES_EXPLORE_LABELS_COLLAPSED';
const LABEL_EXPLORER_WIDTH = 280;
const PANEL_PREVIEW_HEIGHT = 700;
const HISTOGRAM_HEIGHT = 200;
const EMPTY_PARSED_QUERY: ParsedLogQuery = { filters: [], pipeline: '' };
const LOG_PLUGIN_TYPES: PluginType[] = ['LogQuery'];

// The Loki query editor renders its own order toggle as its last row. The order toggle is shown next to the Run Query
// button instead, so that row is hidden.
const LOKI_EDITOR_SX = { '& > .MuiStack-root > div:nth-of-type(3)': { display: 'none' } };

type LogsDirection = 'backward' | 'forward';

/** Spec of the LokiLogQuery plugin. */
interface LokiLogQuerySpec {
  query: string;
  datasource?: DatasourceSelector;
  direction?: LogsDirection;
  [key: string]: unknown;
}

interface LogsExplorerData {
  queries?: QueryDefinition[];
}

function toQueryDefinition(value: PluginEditorValue): QueryDefinition {
  return { kind: 'LogQuery', spec: { plugin: { kind: value.selection.kind, spec: value.spec } } };
}

function toEditorValue(query: QueryDefinition | undefined): PluginEditorValue {
  if (!query) return { selection: { type: 'LogQuery', kind: LOKI_LOG_QUERY_KIND }, spec: { query: '' } };
  return { selection: { type: 'LogQuery', kind: query.spec.plugin.kind }, spec: query.spec.plugin.spec };
}

export interface LogsExplorerProps {
  projectName?: string;
}

/**
 * Explorer for logs of any log query plugin. For Loki, the label explorer and the query editor are kept in sync:
 * selecting label values updates the query, and editing the query updates the selected label values when they can
 * represent it. Other log sources get an empty side panel for now.
 */
export function LogsExplorer(props: LogsExplorerProps): ReactElement {
  const { projectName } = props;
  const { data, setData } = useExplorerManagerContext<LogsExplorerData>();
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const [isCollapsed, setIsCollapsed] = useLocalStorage(LABEL_EXPLORER_COLLAPSED_KEY, false);

  const committedQuery = data.queries?.find((query) => query.kind === 'LogQuery');
  const [draft, setDraft] = useState<PluginEditorValue>(() => toEditorValue(committedQuery));
  const {
    onSelectionChange,
    onSpecChange,
    pendingSelection,
    isLoading: isChangingKind,
  } = usePluginEditor({
    pluginTypes: ['LogQuery'],
    value: draft,
    onChange: setDraft,
  });
  const {
    data: queryPlugin,
    isLoading: isLoadingPlugin,
    error: pluginError,
  } = usePlugin('LogQuery', draft.selection.kind);

  const isLoki = draft.selection.kind === LOKI_LOG_QUERY_KIND;
  const lokiSpec = draft.spec as LokiLogQuerySpec;
  const parsed = useMemo(() => (isLoki ? parseLogQuery(lokiSpec.query ?? '') : undefined), [isLoki, lokiSpec.query]);
  // Set when Mod+Enter is pressed in the editor, so the change it emits also runs the query.
  const runOnNextChange = useRef(false);

  const runQuery = (value: PluginEditorValue): void => {
    setDraft(value);
    setData({ ...data, queries: [toQueryDefinition(value)] });
  };

  const runLokiQuery = (spec: LokiLogQuerySpec): void => runQuery({ ...draft, spec });

  const updateFilters = (update: (current: ParsedLogQuery) => ParsedLogQuery): void => {
    // A custom query is replaced by the label filters.
    runLokiQuery({ ...lokiSpec, query: formatLogQuery(update(parsed ?? EMPTY_PARSED_QUERY)) });
  };

  const handleToggleValue = (label: string, value: string, operator: LabelOperator): void =>
    updateFilters((current) => ({ ...current, filters: toggleLabelValue(current.filters, label, value, operator) }));

  const handleOperatorChange = (label: string, value: string, operator: LabelOperator): void =>
    updateFilters((current) => ({ ...current, filters: setValueOperator(current.filters, label, value, operator) }));

  const handleEditorChange = (spec: UnknownSpec): void => {
    if (runOnNextChange.current) {
      runOnNextChange.current = false;
      runQuery({ ...draft, spec });
    } else {
      onSpecChange(spec);
    }
  };

  const handleEditorKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      runOnNextChange.current = true;
    }
  };

  const Editor = queryPlugin?.OptionsEditorComponent;
  let labelPanelWidth: number | string = isCollapsed ? 15 : LABEL_EXPLORER_WIDTH;
  if (isSmallScreen) {
    labelPanelWidth = '100%';
  }

  return (
    <Stack direction={isSmallScreen ? 'column' : 'row'} gap={2} sx={{ width: '100%' }}>
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
        {(!isCollapsed || isSmallScreen) && isLoki && (
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <LabelExplorer
              datasourceKind={LOKI_DATASOURCE_KIND}
              datasource={lokiSpec.datasource ?? { kind: LOKI_DATASOURCE_KIND }}
              onDatasourceChange={(next) => onSpecChange({ ...lokiSpec, datasource: next.name ? next : undefined })}
              projectName={projectName}
              filters={parsed?.filters}
              onToggleValue={handleToggleValue}
              onOperatorChange={handleOperatorChange}
            />
          </ErrorBoundary>
        )}
        {/* Placeholder for the label explorers of other log sources. */}
        {(!isCollapsed || isSmallScreen) && !isLoki && <Box data-testid="label-explorer-placeholder" />}
      </Stack>
      <Card sx={{ padding: '10px', width: '100%', minWidth: 0 }}>
        <Stack gap={2}>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <PluginKindSelect
              label="Query Type"
              size="small"
              pluginTypes={LOG_PLUGIN_TYPES}
              value={pendingSelection ?? draft.selection}
              onChange={onSelectionChange}
              disabled={isChangingKind}
              sx={{ minWidth: 220, mr: 'auto' }}
            />
            {isLoki && (
              <ToggleButtonGroup
                exclusive
                size="small"
                value={lokiSpec.direction ?? 'backward'}
                onChange={(_, direction: LogsDirection | null) => direction && runLokiQuery({ ...lokiSpec, direction })}
                aria-label="Order"
              >
                <ToggleButton value="backward">Newest first</ToggleButton>
                <ToggleButton value="forward">Oldest first</ToggleButton>
              </ToggleButtonGroup>
            )}
            <Button variant="contained" startIcon={<Refresh />} onClick={() => runQuery(draft)}>
              Run Query
            </Button>
          </Stack>
          {isLoadingPlugin && <CircularProgress size={24} />}
          {pluginError && <Alert severity="error">{pluginError.message}</Alert>}
          {Editor && (
            <Box sx={isLoki ? LOKI_EDITOR_SX : undefined} onKeyDownCapture={handleEditorKeyDown}>
              <Editor key={draft.selection.kind} value={draft.spec} onChange={handleEditorChange} />
            </Box>
          )}
          {committedQuery && <LogResults query={committedQuery} />}
        </Stack>
      </Card>
    </Stack>
  );
}

interface LogResultsProps {
  query: QueryDefinition;
}

function LogResults({ query }: LogResultsProps): ReactElement {
  const { data: queryPlugin } = usePlugin('LogQuery', query.spec.plugin.kind);
  const { absoluteTimeRange } = useTimeRange();
  const datasourceStore = useDatasourceStore();
  const variableState = useAllVariableValues();
  const queries = useMemo(() => [query], [query]);

  const volumeQueries = useMemo(() => {
    const volumeQuery = queryPlugin?.createVolumeQuery?.(query.spec.plugin.spec, {
      timeRange: absoluteTimeRange,
      variableState,
      datasourceStore,
      refreshKey: '',
    });
    return volumeQuery ? [volumeQuery] : [];
  }, [queryPlugin, query, absoluteTimeRange, variableState, datasourceStore]);

  return (
    <>
      {volumeQueries.length > 0 && (
        <Box height={HISTOGRAM_HEIGHT}>
          <DataQueriesProvider definitions={volumeQueries}>
            <Panel
              panelOptions={{ hideHeader: true }}
              definition={{
                kind: 'Panel',
                spec: {
                  queries: volumeQueries,
                  display: { name: 'Log Volume' },
                  plugin: {
                    kind: 'TimeSeriesChart',
                    spec: {
                      legend: { position: 'bottom', mode: 'list' },
                      visual: { display: 'bar', stack: 'all' },
                      yAxis: { label: 'Logs per second' },
                    },
                  },
                },
              }}
            />
          </DataQueriesProvider>
        </Box>
      )}
      <Box height={PANEL_PREVIEW_HEIGHT}>
        <DataQueriesProvider definitions={queries}>
          <Panel
            panelOptions={{ hideHeader: true }}
            definition={{
              kind: 'Panel',
              spec: { queries, display: { name: '' }, plugin: { kind: 'LogsTable', spec: {} } },
            }}
          />
        </DataQueriesProvider>
      </Box>
    </>
  );
}
