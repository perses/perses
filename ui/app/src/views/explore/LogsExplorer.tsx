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
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { useExplorerManagerContext } from '@perses-dev/explore';
import type { PluginType } from '@perses-dev/plugin-system';
import { PluginKindSelect, usePlugin, usePluginEditor } from '@perses-dev/plugin-system';
import type { DatasourceSelector, UnknownSpec } from '@perses-dev/spec';
import Refresh from 'mdi-material-ui/Refresh';
import type { KeyboardEvent, MouseEvent, ReactElement } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { ExploreSidePanel } from './ExploreSidePanel';
import { LabelExplorer } from './LabelExplorer';
import {
  getLogQuery,
  isLogsDirection,
  LOKI_DATASOURCE_KIND,
  LOKI_LOG_QUERY_KIND,
  toEditorValue,
  toLokiSpec,
  toQueryDefinition,
} from './log-query';
import type { LabelOperator, ParsedLogQuery } from './log-selector';
import { formatLogQuery, parseLogQuery, setValueOperator, toggleLabelValue } from './log-selector';
import { LogResults } from './LogResults';

const LOG_PLUGIN_TYPES: PluginType[] = ['LogQuery'];
const EMPTY_PARSED_QUERY: ParsedLogQuery = { filters: [], pipeline: '' };
const DEFAULT_LOKI_DATASOURCE: DatasourceSelector = { kind: LOKI_DATASOURCE_KIND };
const ROOT_DIRECTION_SX = { width: '100%' };
const CARD_SX = { padding: '10px', width: '100%', minWidth: 0 };
const QUERY_TYPE_SX = { minWidth: 220, mr: 'auto' };
const RUN_ICON = <Refresh />;
// The Loki query editor renders its own order toggle as its last row. The order toggle is shown next to the Run Query
// button instead, so that row is hidden.
const LOKI_EDITOR_SX = { '& > .MuiStack-root > div:nth-of-type(3)': { display: 'none' } };

/**
 * Explorer for logs of any log query plugin. For Loki, the label explorer and the query editor are kept in sync:
 * selecting label values updates the query, and editing the query updates the selected label values when they can
 * represent it. Other log sources get an empty side panel for now.
 */
export function LogsExplorer(): ReactElement {
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const { data, setData } = useExplorerManagerContext<unknown>();

  const committedQuery = useMemo(() => getLogQuery(data), [data]);
  const [draft, setDraft] = useState(() => toEditorValue(committedQuery));
  const {
    onSelectionChange,
    onSpecChange,
    pendingSelection,
    isLoading: isChangingKind,
  } = usePluginEditor({ pluginTypes: LOG_PLUGIN_TYPES, value: draft, onChange: setDraft });
  const {
    data: queryPlugin,
    isLoading: isLoadingPlugin,
    error: pluginError,
  } = usePlugin('LogQuery', draft.selection.kind);

  const isLoki = draft.selection.kind === LOKI_LOG_QUERY_KIND;
  const lokiSpec = useMemo(() => toLokiSpec(draft.spec), [draft.spec]);
  const parsed = useMemo(() => (isLoki ? parseLogQuery(lokiSpec.query) : undefined), [isLoki, lokiSpec.query]);
  // Set when Mod+Enter is pressed in the editor, so the change it emits also runs the query.
  const runOnNextChange = useRef(false);

  const runSpec = useCallback(
    (spec: UnknownSpec) => {
      const next = { ...draft, spec };
      setDraft(next);
      setData({ queries: [toQueryDefinition(next)] });
    },
    [draft, setData],
  );

  const updateFilters = useCallback(
    (update: (current: ParsedLogQuery) => ParsedLogQuery) => {
      // A custom query is replaced by the label filters.
      runSpec({ ...lokiSpec, query: formatLogQuery(update(parsed ?? EMPTY_PARSED_QUERY)) });
    },
    [lokiSpec, parsed, runSpec],
  );

  const handleToggleValue = useCallback(
    (label: string, value: string, operator: LabelOperator) =>
      updateFilters((current) => ({ ...current, filters: toggleLabelValue(current.filters, label, value, operator) })),
    [updateFilters],
  );

  const handleOperatorChange = useCallback(
    (label: string, value: string, operator: LabelOperator) =>
      updateFilters((current) => ({ ...current, filters: setValueOperator(current.filters, label, value, operator) })),
    [updateFilters],
  );

  const handleDirectionChange = useCallback(
    (_: MouseEvent<HTMLElement>, direction: unknown) => {
      if (isLogsDirection(direction)) runSpec({ ...lokiSpec, direction });
    },
    [lokiSpec, runSpec],
  );

  const handleRunQuery = useCallback(() => runSpec(draft.spec), [draft.spec, runSpec]);

  const handleEditorChange = useCallback(
    (spec: UnknownSpec) => {
      if (runOnNextChange.current) {
        runOnNextChange.current = false;
        runSpec(spec);
      } else {
        onSpecChange(spec);
      }
    },
    [onSpecChange, runSpec],
  );

  const handleEditorKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      runOnNextChange.current = true;
    }
  }, []);

  const Editor = queryPlugin?.OptionsEditorComponent;

  return (
    <Stack direction={isSmallScreen ? 'column' : 'row'} gap={2} sx={ROOT_DIRECTION_SX}>
      <ExploreSidePanel label="label explorer">
        {/* Other log sources have no label explorer yet, so the side panel stays empty for them. */}
        {isLoki && (
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <LabelExplorer
              datasource={lokiSpec.datasource ?? DEFAULT_LOKI_DATASOURCE}
              filters={parsed?.filters}
              onToggleValue={handleToggleValue}
              onOperatorChange={handleOperatorChange}
            />
          </ErrorBoundary>
        )}
      </ExploreSidePanel>
      <Card sx={CARD_SX}>
        <Stack gap={2}>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <PluginKindSelect
              label="Query Type"
              size="small"
              pluginTypes={LOG_PLUGIN_TYPES}
              value={pendingSelection ?? draft.selection}
              onChange={onSelectionChange}
              disabled={isChangingKind}
              sx={QUERY_TYPE_SX}
            />
            {isLoki && (
              <ToggleButtonGroup
                exclusive
                size="small"
                value={lokiSpec.direction ?? 'backward'}
                onChange={handleDirectionChange}
                aria-label="Order"
              >
                <ToggleButton value="backward">Newest first</ToggleButton>
                <ToggleButton value="forward">Oldest first</ToggleButton>
              </ToggleButtonGroup>
            )}
            <Button variant="contained" startIcon={RUN_ICON} onClick={handleRunQuery}>
              Run Query
            </Button>
          </Stack>
          {isLoadingPlugin && <CircularProgress size={24} aria-label="Loading query editor" />}
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
