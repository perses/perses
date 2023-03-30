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

import { useState } from 'react';
import { produce } from 'immer';
import { Box, BoxProps, Button, IconButton, Stack, Typography } from '@mui/material';
import AddIcon from 'mdi-material-ui/Plus';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import { TimeSeriesQueryDefinition, QueryDefinition } from '@perses-dev/core';
import { usePlugin, usePluginRegistry } from '../runtime';
import { PluginEditor, PluginEditorProps } from './PluginEditor';

const DEFAULT_QUERY_PLUGIN_TYPE = 'TimeSeriesQuery';

export interface TimeSeriesQueryEditorProps {
  queries: TimeSeriesQueryDefinition[];
  onChange: (queries: QueryDefinition[]) => void;
}

export function TimeSeriesQueryEditor(props: TimeSeriesQueryEditorProps) {
  const { onChange, queries } = props;
  const hasMoreThanOneQuery = queries.length > 1;
  const { defaultPluginKinds } = usePluginRegistry();
  const defaultTimeSeriesQueryKind = defaultPluginKinds?.[DEFAULT_QUERY_PLUGIN_TYPE] ?? '';

  const { data: defaultQueryPlugin } = usePlugin(DEFAULT_QUERY_PLUGIN_TYPE, defaultTimeSeriesQueryKind, {
    useErrorBoundary: true,
    enabled: true,
  });

  // State for which queries are collapsed
  // TODO: Would be easier if we had IDs for queries.
  const [queriesCollapsed, setQueriesCollapsed] = useState(queries.map(() => false));

  // Query handlers
  const handleQueryChange = (index: number, queryDef: TimeSeriesQueryDefinition) => {
    onChange(
      produce(queries, (draft) => {
        if (draft) {
          draft[index] = queryDef;
        } else {
          draft = [queryDef];
        }
      })
    );
  };

  const handleQueryAdd = () => {
    if (!defaultQueryPlugin) return;
    onChange(
      produce(queries, (draft) => {
        const queryDef: TimeSeriesQueryDefinition = {
          kind: DEFAULT_QUERY_PLUGIN_TYPE,
          spec: {
            plugin: { kind: defaultTimeSeriesQueryKind, spec: defaultQueryPlugin.createInitialOptions() },
          },
        };
        if (draft) {
          draft.push(queryDef);
        } else {
          draft = [...queries, queryDef];
        }
      })
    );
    setQueriesCollapsed((queriesCollapsed) => {
      queriesCollapsed.push(false);
      return [...queriesCollapsed];
    });
  };

  const handleQueryDelete = (index: number) => {
    onChange(
      produce(queries, (draft) => {
        draft.splice(index, 1);
      })
    );
    setQueriesCollapsed((queriesCollapsed) => {
      queriesCollapsed.splice(index, 1);
      return [...queriesCollapsed];
    });
  };

  const handleQueryCollapseExpand = (index: number) => {
    setQueriesCollapsed((queriesCollapsed) => {
      queriesCollapsed[index] = !queriesCollapsed[index];
      return [...queriesCollapsed];
    });
  };

  return (
    <Stack spacing={1}>
      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginLeft: 'auto' }} onClick={handleQueryAdd}>
        Add Query
      </Button>
      {queries.map((query: TimeSeriesQueryDefinition, i: number) => (
        <Stack key={i} spacing={1}>
          <Stack direction="row" alignItems="center" borderBottom={1} borderColor={(theme) => theme.palette.divider}>
            <IconButton size="small" onClick={() => handleQueryCollapseExpand(i)}>
              {queriesCollapsed[i] ? <ChevronRight /> : <ChevronDown />}
            </IconButton>
            <Typography variant="overline" component="h4">
              Query {i + 1}
            </Typography>
            <IconButton
              size="small"
              // Use `visibility` to ensure that the row has the same height when delete button is visible or not visible
              sx={{ marginLeft: 'auto', visibility: `${hasMoreThanOneQuery ? 'visible' : 'hidden'}` }}
              onClick={() => handleQueryDelete(i)}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
          {!queriesCollapsed[i] && <QueryEditor value={query} onChange={(next) => handleQueryChange(i, next)} />}
        </Stack>
      ))}
    </Stack>
  );
}

// Props on MUI Box that we don't want people to pass because we're either redefining them or providing them in
// this component
type OmittedMuiProps = 'children' | 'value' | 'onChange';

interface QueryEditorProps extends Omit<BoxProps, OmittedMuiProps> {
  value: TimeSeriesQueryDefinition;
  onChange: (next: TimeSeriesQueryDefinition) => void;
}

/**
 * Displays an editor for TimeSeriesQueryDefinition objects.
 */
export function QueryEditor(props: QueryEditorProps) {
  const { value, onChange, ...others } = props;
  const {
    spec: { plugin },
  } = value;

  const handlePluginChange: PluginEditorProps['onChange'] = (next) => {
    onChange(
      produce(value, (draft) => {
        draft.spec.plugin = next;
      })
    );
  };

  return (
    <Box {...others}>
      {/* If TimeSeriesQuery plugins ever have common props on the definition, the inputs could go here */}
      <PluginEditor
        pluginType="TimeSeriesQuery"
        pluginKindLabel="Query Type"
        value={plugin}
        onChange={handlePluginChange}
      />
    </Box>
  );
}
