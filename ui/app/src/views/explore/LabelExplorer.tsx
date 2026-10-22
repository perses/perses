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

import { Alert, CircularProgress, InputAdornment, List, Stack, TextField, Typography } from '@mui/material';
import { useDatasourceClient } from '@perses-dev/plugin-system';
import type { DatasourceSelector } from '@perses-dev/spec';
import Magnify from 'mdi-material-ui/Magnify';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';

import type { LabelClient, LabelRequestParams } from './label-client';
import { useLabelNames, useLabelRequestParams } from './label-client';
import { LabelItem } from './LabelItem';
import type { LabelFilter, LabelOperator } from './log-selector';

const NO_FILTERS: LabelFilter[] = [];
const ROOT_SX = { minHeight: 0 };
const LOADING_SX = { alignSelf: 'center', my: 2 };
const LIST_SX = { overflowY: 'auto' };
const SEARCH_SLOT_PROPS = {
  input: {
    startAdornment: (
      <InputAdornment position="start">
        <Magnify fontSize="small" />
      </InputAdornment>
    ),
  },
  htmlInput: { 'aria-label': 'Filter labels' },
};

export interface LabelExplorerProps {
  /** Datasource of the query, which the labels are read from. */
  datasource: DatasourceSelector;
  /** Filters of the current query, or undefined when the query is a custom query the filters cannot represent. */
  filters?: LabelFilter[];
  onToggleValue: (label: string, value: string, operator: LabelOperator) => void;
  onOperatorChange: (label: string, value: string, operator: LabelOperator) => void;
}

/** Lists the labels of a datasource and their values, which can be selected as query filters. */
export function LabelExplorer(props: LabelExplorerProps): ReactElement {
  const { datasource, filters, onToggleValue, onOperatorChange } = props;
  const [search, setSearch] = useState('');
  const [expandedLabel, setExpandedLabel] = useState<string>();

  const params = useLabelRequestParams();
  const { data: client, error: clientError } = useDatasourceClient<LabelClient>(datasource);
  const { data: labelNames, isLoading, error: labelsError } = useLabelNames(datasource, client, params);

  const filteredLabels = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (labelNames ?? []).filter((name) => name.toLowerCase().includes(term));
  }, [labelNames, search]);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value), []);

  return (
    <Stack gap={1} sx={ROOT_SX}>
      <Typography variant="h4" component="h2">
        Labels
      </Typography>
      <TextField
        size="small"
        placeholder="Filter labels"
        value={search}
        onChange={handleSearchChange}
        slotProps={SEARCH_SLOT_PROPS}
      />
      {filters === undefined && (
        <Typography variant="caption" color="text.secondary">
          Custom query: it can&apos;t be shown as label filters. Selecting a value replaces it.
        </Typography>
      )}
      <LabelList
        error={clientError ?? labelsError}
        isLoading={isLoading}
        labels={filteredLabels}
        client={client}
        params={params}
        datasource={datasource}
        filters={filters ?? NO_FILTERS}
        expandedLabel={expandedLabel}
        onExpandedLabelChange={setExpandedLabel}
        onToggleValue={onToggleValue}
        onOperatorChange={onOperatorChange}
      />
    </Stack>
  );
}

interface LabelListProps {
  error: unknown;
  isLoading: boolean;
  labels: string[];
  client?: LabelClient;
  params: LabelRequestParams;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  expandedLabel?: string;
  onExpandedLabelChange: (label: string | undefined) => void;
  onToggleValue: (label: string, value: string, operator: LabelOperator) => void;
  onOperatorChange: (label: string, value: string, operator: LabelOperator) => void;
}

function LabelList(props: LabelListProps): ReactElement {
  const {
    error,
    isLoading,
    labels,
    client,
    params,
    datasource,
    filters,
    expandedLabel,
    onExpandedLabelChange,
    onToggleValue,
    onOperatorChange,
  } = props;
  if (error) {
    return <Alert severity="error">{error instanceof Error ? error.message : String(error)}</Alert>;
  }
  if (isLoading || !client) {
    return <CircularProgress size={24} sx={LOADING_SX} aria-label="Loading labels" />;
  }
  if (labels.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No labels found for this time range.
      </Typography>
    );
  }
  return (
    <List dense disablePadding sx={LIST_SX} aria-label="Labels">
      {labels.map((label) => (
        <LabelItem
          key={label}
          label={label}
          client={client}
          params={params}
          datasource={datasource}
          filters={filters}
          expanded={expandedLabel === label}
          onExpandedChange={onExpandedLabelChange}
          onToggleValue={onToggleValue}
          onOperatorChange={onOperatorChange}
        />
      ))}
    </List>
  );
}
