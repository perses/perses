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
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DatasourceSelect, isVariableDatasource, useDatasourceClient, useTimeRange } from '@perses-dev/plugin-system';
import type { DatasourceSelector } from '@perses-dev/spec';
import { useQuery } from '@tanstack/react-query';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import Magnify from 'mdi-material-ui/Magnify';
import MinusCircleOutline from 'mdi-material-ui/MinusCircleOutline';
import type { ReactElement, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import type { LabelSource } from './explore-signals';
import type { MatchOperator } from './label-matchers';

const MAX_DISPLAYED_VALUES = 200;
const LOADING_SX = { alignSelf: 'center', my: 2 };
const LIST_SX = { overflowY: 'auto' };

interface LabelRequestParams {
  start: string;
  end: string;
}

interface LabelResponse {
  data?: string[];
}

/** The label endpoints shared by the Prometheus and Loki datasource clients. */
interface LabelClient {
  labelNames?: (params: LabelRequestParams) => Promise<LabelResponse>;
  labels?: (params: LabelRequestParams) => Promise<LabelResponse>;
  labelValues: (params: LabelRequestParams & { labelName: string }) => Promise<LabelResponse>;
}

function fetchLabelNames(client: LabelClient, params: LabelRequestParams): Promise<LabelResponse> {
  if (client.labelNames) return client.labelNames(params);
  if (client.labels) return client.labels(params);
  return Promise.reject(new Error('This datasource does not support listing labels'));
}

function useLabelRequestParams(): LabelRequestParams {
  const { absoluteTimeRange } = useTimeRange();
  return useMemo(
    () => ({ start: absoluteTimeRange.start.toISOString(), end: absoluteTimeRange.end.toISOString() }),
    [absoluteTimeRange],
  );
}

export interface LabelExplorerProps {
  labelSource: LabelSource;
  projectName?: string;
  onAddMatcher: (label: string, value: string, operator: MatchOperator, datasource: DatasourceSelector) => void;
}

export function LabelExplorer(props: LabelExplorerProps): ReactElement {
  const { labelSource, projectName, onAddMatcher } = props;
  const [datasource, setDatasource] = useState<DatasourceSelector>({ kind: labelSource.datasourceKind });
  const [filter, setFilter] = useState('');
  const [expandedLabel, setExpandedLabel] = useState<string>();

  const params = useLabelRequestParams();
  const { data: client, error: clientError } = useDatasourceClient<LabelClient>(datasource);
  const {
    data: labelNames,
    isLoading,
    error: labelsError,
  } = useQuery<LabelResponse, Error, string[]>({
    queryKey: ['explore-label-names', datasource, params],
    queryFn: () =>
      client ? fetchLabelNames(client, params) : Promise.reject(new Error('Datasource client is not ready')),
    enabled: client !== undefined,
    select: (response) => response.data ?? [],
  });

  const filteredLabels = useMemo(() => {
    const search = filter.trim().toLowerCase();
    return (labelNames ?? []).filter((name) => name.toLowerCase().includes(search));
  }, [labelNames, filter]);

  return (
    <Stack gap={1} sx={{ minHeight: 0 }} data-testid="label-explorer">
      <Typography variant="h4">Labels</Typography>
      <DatasourceSelect
        datasourcePluginKind={labelSource.datasourceKind}
        project={projectName}
        value={datasource}
        onChange={(next) => {
          if (isVariableDatasource(next)) return;
          setDatasource(next);
          setExpandedLabel(undefined);
        }}
        label="Datasource"
        size="small"
      />
      <TextField
        size="small"
        placeholder="Filter labels"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Magnify fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      <LabelList
        error={clientError ?? labelsError}
        isLoading={isLoading}
        labels={filteredLabels}
        renderLabel={(label) =>
          client && (
            <LabelItem
              key={label}
              label={label}
              client={client}
              params={params}
              datasource={datasource}
              expanded={expandedLabel === label}
              onToggle={() => setExpandedLabel(expandedLabel === label ? undefined : label)}
              onAddMatcher={(value, operator) => onAddMatcher(label, value, operator, datasource)}
            />
          )
        }
      />
    </Stack>
  );
}

interface LabelListProps {
  error: unknown;
  isLoading: boolean;
  labels: string[];
  renderLabel: (label: string) => ReactNode;
}

function LabelList(props: LabelListProps): ReactElement {
  const { error, isLoading, labels, renderLabel } = props;
  if (error) {
    return <Alert severity="error">{error instanceof Error ? error.message : String(error)}</Alert>;
  }
  if (isLoading) {
    return <CircularProgress size={24} sx={LOADING_SX} />;
  }
  if (labels.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No labels found for this time range.
      </Typography>
    );
  }
  return (
    <List dense disablePadding sx={LIST_SX}>
      {labels.map(renderLabel)}
    </List>
  );
}

interface LabelItemProps {
  label: string;
  client: LabelClient;
  params: LabelRequestParams;
  datasource: DatasourceSelector;
  expanded: boolean;
  onToggle: () => void;
  onAddMatcher: (value: string, operator: MatchOperator) => void;
}

function LabelItem(props: LabelItemProps): ReactElement {
  const { label, client, params, datasource, expanded, onToggle, onAddMatcher } = props;
  const {
    data: values,
    isLoading,
    error,
  } = useQuery<LabelResponse, Error, string[]>({
    queryKey: ['explore-label-values', datasource, label, params],
    queryFn: () => client.labelValues({ ...params, labelName: label }),
    enabled: expanded,
    select: (response) => response.data ?? [],
  });

  return (
    <>
      <ListItemButton onClick={onToggle} sx={{ px: 0.5 }} aria-expanded={expanded}>
        {expanded ? <ChevronDown fontSize="small" /> : <ChevronRight fontSize="small" />}
        <ListItemText
          primary={label}
          slotProps={{ primary: { sx: { fontFamily: 'monospace', wordBreak: 'break-all' } } }}
        />
        {expanded && values && (
          <Typography variant="caption" color="text.secondary">
            {values.length}
          </Typography>
        )}
      </ListItemButton>
      {expanded && (
        <List dense disablePadding sx={{ pl: 3 }}>
          {isLoading && <CircularProgress size={16} sx={{ m: 1 }} />}
          {error && <Alert severity="error">{error.message}</Alert>}
          {values?.slice(0, MAX_DISPLAYED_VALUES).map((value) => (
            <ListItemButton
              key={value}
              title={`Add ${label}="${value}" to the query`}
              onClick={() => onAddMatcher(value, '=')}
              sx={{ px: 0.5, py: 0 }}
            >
              <ListItemText
                primary={value === '' ? '(empty)' : value}
                slotProps={{ primary: { variant: 'body2', sx: { wordBreak: 'break-all' } } }}
              />
              <IconButton
                size="small"
                title={`Add ${label}!="${value}" to the query`}
                aria-label={`Exclude ${value}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onAddMatcher(value, '!=');
                }}
              >
                <MinusCircleOutline fontSize="inherit" />
              </IconButton>
            </ListItemButton>
          ))}
          {values && values.length > MAX_DISPLAYED_VALUES && (
            <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
              Showing the first {MAX_DISPLAYED_VALUES} of {values.length} values.
            </Typography>
          )}
        </List>
      )}
    </>
  );
}
