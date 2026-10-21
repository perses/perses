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
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
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
import type { ReactElement, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import type { LabelFilter, LabelOperator } from './log-selector';
import { LABEL_OPERATORS } from './log-selector';

const MAX_DISPLAYED_VALUES = 200;
const LOADING_SX = { alignSelf: 'center', my: 2 };
const LIST_SX = { overflowY: 'auto' };
const MONOSPACE_SX = { fontFamily: 'monospace', wordBreak: 'break-all' } as const;
// Compact operator select, sized to the label text next to it.
const OPERATOR_SELECT_SX = {
  flexShrink: 0,
  width: 46,
  height: 24,
  fontFamily: 'monospace',
  fontSize: '0.8125rem',
  '& .MuiSelect-select': { py: 0, pl: 0.75, pr: '18px !important' },
  '& .MuiSelect-icon': { right: 0, fontSize: '1.1rem' },
};

interface LabelRequestParams {
  start: string;
  end: string;
}

interface LabelResponse {
  data?: string[];
}

/** The label endpoints of the Loki datasource client. */
interface LabelClient {
  labels: (params: LabelRequestParams) => Promise<LabelResponse>;
  labelValues: (params: LabelRequestParams & { labelName: string }) => Promise<LabelResponse>;
}

function useLabelRequestParams(): LabelRequestParams {
  const { absoluteTimeRange } = useTimeRange();
  return useMemo(
    () => ({ start: absoluteTimeRange.start.toISOString(), end: absoluteTimeRange.end.toISOString() }),
    [absoluteTimeRange],
  );
}

export interface LabelExplorerProps {
  datasourceKind: string;
  datasource: DatasourceSelector;
  onDatasourceChange: (datasource: DatasourceSelector) => void;
  projectName?: string;
  /** Filters of the current query, or undefined when the query is a custom query the filters cannot represent. */
  filters?: LabelFilter[];
  onToggleValue: (label: string, value: string, operator: LabelOperator) => void;
  onOperatorChange: (label: string, operator: LabelOperator) => void;
}

export function LabelExplorer(props: LabelExplorerProps): ReactElement {
  const { datasourceKind, datasource, onDatasourceChange, projectName, filters, onToggleValue, onOperatorChange } =
    props;
  const [search, setSearch] = useState('');
  const [expandedLabel, setExpandedLabel] = useState<string>();

  const params = useLabelRequestParams();
  const { data: client, error: clientError } = useDatasourceClient<LabelClient>(datasource);
  const {
    data: labelNames,
    isLoading,
    error: labelsError,
  } = useQuery<LabelResponse, Error, string[]>({
    queryKey: ['explore-label-names', datasource, params],
    queryFn: () => (client ? client.labels(params) : Promise.reject(new Error('Datasource client is not ready'))),
    enabled: client !== undefined,
    select: (response) => response.data ?? [],
  });

  const filteredLabels = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (labelNames ?? []).filter((name) => name.toLowerCase().includes(term));
  }, [labelNames, search]);

  return (
    <Stack gap={1} sx={{ minHeight: 0 }} data-testid="label-explorer">
      <Typography variant="h4">Labels</Typography>
      <DatasourceSelect
        datasourcePluginKind={datasourceKind}
        project={projectName}
        value={datasource}
        onChange={(next) => {
          if (isVariableDatasource(next)) return;
          onDatasourceChange(next);
          setExpandedLabel(undefined);
        }}
        label="Datasource"
        size="small"
      />
      <TextField
        size="small"
        placeholder="Filter labels"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
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
      {filters === undefined && (
        <Typography variant="caption" color="text.secondary" data-testid="label-explorer-custom-query">
          Custom query: it can&apos;t be shown as label filters. Selecting a value replaces it.
        </Typography>
      )}
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
              filter={filters?.find((f) => f.label === label)}
              expanded={expandedLabel === label}
              onToggle={() => setExpandedLabel(expandedLabel === label ? undefined : label)}
              onToggleValue={(value, operator) => onToggleValue(label, value, operator)}
              onOperatorChange={(operator) => onOperatorChange(label, operator)}
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
  filter?: LabelFilter;
  expanded: boolean;
  onToggle: () => void;
  onToggleValue: (value: string, operator: LabelOperator) => void;
  onOperatorChange: (operator: LabelOperator) => void;
}

function LabelItem(props: LabelItemProps): ReactElement {
  const { label, client, params, datasource, filter, expanded, onToggle, onToggleValue, onOperatorChange } = props;
  // Operator used for the next selected value while the label has no filter.
  const [pendingOperator, setPendingOperator] = useState<LabelOperator>('=');
  const operator = filter?.operator ?? pendingOperator;
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
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Select
          size="small"
          value={operator}
          onChange={(event) => {
            const next = event.target.value as LabelOperator;
            setPendingOperator(next);
            if (filter) onOperatorChange(next);
          }}
          inputProps={{ 'aria-label': `Operator for ${label}` }}
          sx={OPERATOR_SELECT_SX}
        >
          {LABEL_OPERATORS.map((op) => (
            <MenuItem key={op} value={op} dense sx={MONOSPACE_SX}>
              {op}
            </MenuItem>
          ))}
        </Select>
        <ListItemButton onClick={onToggle} sx={{ px: 0.5, minWidth: 0 }} aria-expanded={expanded}>
          {expanded ? <ChevronDown fontSize="small" /> : <ChevronRight fontSize="small" />}
          <ListItemText
            primary={label}
            slotProps={{
              primary: {
                sx: { ...MONOSPACE_SX, color: filter ? 'primary.main' : undefined, fontWeight: filter ? 600 : 400 },
              },
            }}
          />
          {filter && (
            <Typography variant="caption" color="primary">
              ({filter.values.length})
            </Typography>
          )}
        </ListItemButton>
      </Stack>
      {expanded && (
        <Stack sx={{ pl: 7 }} gap={0.5}>
          <List dense disablePadding>
            {isLoading && <CircularProgress size={16} sx={{ m: 1 }} />}
            {error && <Alert severity="error">{error.message}</Alert>}
            {values?.slice(0, MAX_DISPLAYED_VALUES).map((value) => {
              const selected = filter?.values.includes(value) ?? false;
              return (
                <ListItemButton
                  key={value}
                  selected={selected}
                  title={selected ? 'Remove this filter' : `Filter ${label}${operator}"${value}"`}
                  onClick={() => onToggleValue(value, operator)}
                  sx={{ px: 0.5, py: 0, borderRadius: 1 }}
                >
                  <ListItemText
                    primary={value === '' ? '(empty)' : value}
                    slotProps={{
                      primary: { variant: 'body2', sx: { wordBreak: 'break-all', fontWeight: selected ? 600 : 400 } },
                    }}
                  />
                </ListItemButton>
              );
            })}
            {values && values.length > MAX_DISPLAYED_VALUES && (
              <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                Showing the first {MAX_DISPLAYED_VALUES} of {values.length} values.
              </Typography>
            )}
          </List>
        </Stack>
      )}
    </>
  );
}
