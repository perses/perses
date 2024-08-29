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

import {
  Autocomplete,
  Box,
  Button,
  Card,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Stack,
  StackProps,
  TextField,
} from '@mui/material';
import {
  DataQueriesProvider,
  DatasourceSelect,
  useDatasourceClient,
  useSuggestedStepMs,
} from '@perses-dev/plugin-system';
import { DatasourceSelector } from '@perses-dev/core';
import { useQuery } from '@tanstack/react-query';
import useResizeObserver from 'use-resize-observer';
import { Panel } from '@perses-dev/dashboards';
import {
  LabelValuesResponse,
  PrometheusClient,
  DEFAULT_PROM,
  PROM_DATASOURCE_KIND,
  LabelValuesRequestParameters,
} from '@perses-dev/prometheus-plugin';
import { useMemo, useState } from 'react';
import EyeOutlineIcon from 'mdi-material-ui/EyeOutline';
import CheckIcon from 'mdi-material-ui/Check';
import DeleteIcon from 'mdi-material-ui/Delete';
import PlusIcon from 'mdi-material-ui/Plus';
import * as React from 'react';
import { useInView } from 'react-intersection-observer';
import { Virtuoso } from 'react-virtuoso';

export interface LabelFilter {
  label: string;
  labelValues: string[];
}

export interface FilterInputsProps {
  value: LabelFilter;
  onChange: (next: LabelFilter) => void;
  onDelete: () => void;
}

export function FilterInputs({ value, onChange, onDelete }: FilterInputsProps) {
  const [isEditingLabelName, setIsEditingLabelName] = useState(true);

  function handleKeyPress(event: { key: string }) {
    if (isEditingLabelName && event.key === 'Enter') {
      setIsEditingLabelName(false);
      onChange({ label: value.label, labelValues: [] });
    }
  }

  return (
    <>
      <Autocomplete
        freeSolo
        disableClearable
        options={[]}
        value={value.label}
        // forcePopupIcon={false}
        // getOptionLabel={(option) => option.title}
        sx={{ width: 250, display: isEditingLabelName ? 'block' : 'none' }}
        renderInput={(params) => {
          return (
            <TextField
              {...params}
              label="Label Name"
              variant="outlined"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="validate label name"
                      onClick={() => setIsEditingLabelName(false)}
                      edge="end"
                    >
                      <CheckIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          );
        }}
        onKeyDown={handleKeyPress}
        onInputChange={(event: React.SyntheticEvent, newValue: string | null) => {
          onChange({ label: newValue ?? '', labelValues: value.labelValues });
        }}
      />
      <Autocomplete
        freeSolo
        multiple
        limitTags={1}
        disableClearable
        options={['test']}
        value={value.labelValues} // TODO: fix
        // forcePopupIcon={false}
        // getOptionLabel={(option) => option.title}
        sx={{ width: 250, display: isEditingLabelName ? 'none' : 'block' }}
        renderInput={(params) => {
          return (
            <TextField
              {...params}
              label={value.label}
              variant="outlined"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="delete label filter" onClick={() => onDelete()} edge="end">
                      <DeleteIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          );
        }}
        onChange={(event: React.SyntheticEvent, newValue: string[] | null) => {
          if (Array.isArray(newValue)) {
            onChange({ label: value.label, labelValues: newValue });
          }
        }}
      />
    </>
  );
}

export interface ExplorerFiltersProps extends StackProps {
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  onDatasourceChange: (next: DatasourceSelector) => void;
  onFiltersChange: (next: LabelFilter[]) => void;
}

export function FinderFilters({
  datasource,
  filters,
  onDatasourceChange,
  onFiltersChange,
  ...props
}: ExplorerFiltersProps) {
  function handleDatasourceChange(next: DatasourceSelector) {
    onDatasourceChange(next);
  }

  return (
    <Stack {...props} direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ width: '100%' }}>
      <FormControl>
        <InputLabel>Prometheus Datasource</InputLabel>
        <DatasourceSelect
          datasourcePluginKind={PROM_DATASOURCE_KIND}
          value={datasource}
          onChange={handleDatasourceChange}
          label="Prometheus Datasource"
        />
      </FormControl>
      {filters.map((filter, index) => (
        <FilterInputs
          key={index}
          value={filter}
          onChange={(next) => {
            const nextFilters = [...filters];
            nextFilters[index] = next;
            onFiltersChange(nextFilters);
          }}
          onDelete={() => {
            const nextFilters = [...filters];
            nextFilters.splice(index, 1);
            onFiltersChange(nextFilters);
          }}
        />
      ))}
      <IconButton
        aria-label="add filter"
        onClick={() => {
          onFiltersChange([...filters, { label: '', labelValues: [] }]);
        }}
      >
        <PlusIcon />
      </IconButton>
    </Stack>
  );
}

export interface MetricCardPanelProps extends StackProps {
  metricName: string;
  datasource: DatasourceSelector;
}

export function MetricCardPanel({ metricName, datasource, ...props }: MetricCardPanelProps) {
  const { width, ref: firstBoxRef } = useResizeObserver();

  const { ref: secondBoxRef, inView } = useInView({
    threshold: 0.2, // we have the flexibility to adjust this threshold to trigger queries slightly earlier or later based on performance
    initialInView: false,
    triggerOnce: true,
  });

  const queries = [
    {
      kind: 'TimeSeriesQuery',
      spec: {
        plugin: {
          kind: 'PrometheusTimeSeriesQuery',
          spec: {
            datasource: datasource,
            query: `{__name__="${metricName}"}`, // TODO: filters
          },
        },
      },
    },
  ];

  const definitions = queries.length
    ? queries.map((query) => {
        return {
          kind: query.spec.plugin.kind,
          spec: query.spec.plugin.spec,
        };
      })
    : [];

  const suggestedStepMs = useSuggestedStepMs(width);

  return (
    <Box ref={firstBoxRef} sx={{ width: '100%', height: '100%' }} {...props}>
      <Box ref={secondBoxRef} sx={{ width: '100%', height: '100%' }}>
        <DataQueriesProvider
          definitions={definitions}
          options={{ suggestedStepMs, mode: 'range' }}
          queryOptions={{ enabled: inView }}
        >
          {inView && (
            <Panel
              panelOptions={{
                hideHeader: true,
              }}
              definition={{
                kind: 'Panel',
                spec: {
                  queries: [
                    {
                      kind: 'TimeSeriesQuery',
                      spec: {
                        plugin: {
                          kind: 'PrometheusTimeSeriesQuery',
                          spec: {
                            datasource: datasource,
                            query: `{__name__="${metricName}"}`, // TODO: filters
                          },
                        },
                      },
                    },
                  ],
                  display: { name: '' },
                  plugin: { kind: 'TimeSeriesChart', spec: {} },
                },
              }}
            />
          )}
        </DataQueriesProvider>
      </Box>
    </Box>
  );
}

export interface MetricCardProps extends StackProps {
  metricName: string;
  datasource: DatasourceSelector;
  showPanel?: boolean;
}

export function MetricCard({ metricName, datasource, showPanel, ...props }: MetricCardProps) {
  const [isPanelEnabled, setIsPanelEnabled] = useState(showPanel ?? true);

  return (
    <Stack {...props}>
      <p>{metricName}</p>
      {isPanelEnabled ? (
        <MetricCardPanel datasource={datasource} metricName={metricName} />
      ) : (
        <Card
          variant="outlined"
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            flexDirection: 'row',
          }}
        >
          <Button
            aria-label="show panel"
            variant="contained"
            size="large"
            startIcon={<EyeOutlineIcon />}
            onClick={() => setIsPanelEnabled(true)}
          >
            Show panel
          </Button>
          <Button
            aria-label={`explore metric ${metricName}`}
            variant="contained"
            size="large"
            startIcon={<EyeOutlineIcon />}
            onClick={() => setIsPanelEnabled(true)}
          >
            Explore metric
          </Button>
        </Card>
      )}
    </Stack>
  );
}

export interface MetricNameExplorerProps extends StackProps {
  datasource: DatasourceSelector;
  filters: LabelFilter[];
}

export function MetricNameExplorer({ datasource, filters, ...props }: MetricNameExplorerProps) {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  const { data } = useQuery<LabelValuesResponse>({
    enabled: !!client,
    queryKey: ['labelValues', '__name__', 'datasource', datasource.name, 'filters', filters],
    queryFn: async () => {
      const params: LabelValuesRequestParameters = { labelName: '__name__' };
      if (filters.length) {
        params['match[]'] = [`{${filters.map((filter) => `${filter.label}=~"${filter.labelValues.join('|')}"`)}}`]; // TODO: match or regex
      }

      return await client!.labelValues(params);
    },
  });

  // Formatting data to be displayed in a row of a table with 4 cells
  const formattedData: Array<{ col1?: string; col2?: string; col3?: string; col4?: string }> = useMemo(() => {
    if (!data || !data.data) {
      return [];
    }

    const result = [];

    for (let i = 0; i < (data.data.length ?? 0); i += 4) {
      result.push({
        col1: data.data[i],
        col2: data.data[i + 1] ? data.data[i + 1] : undefined,
        col3: data.data[i + 2] ? data.data[i + 2] : undefined,
        col4: data.data[i + 3] ? data.data[i + 3] : undefined,
      });
    }

    return result;
  }, [data]);

  if (!data || !data.data) {
    // TODO: error + loading
    return <p>Loading...</p>;
  }

  return (
    <Virtuoso
      style={{ height: '70vh', width: '100%', tableLayout: 'fixed' }}
      data={formattedData}
      itemContent={(_, row) => (
        <Stack direction="row" gap={2} {...props}>
          {row.col1 && (
            <MetricCard
              metricName={row.col1}
              datasource={datasource}
              height="250px"
              showPanel={false}
              sx={{ width: '100%' }}
            >
              {row.col1}
            </MetricCard>
          )}
          {row.col2 && (
            <MetricCard
              metricName={row.col2}
              datasource={datasource}
              height="250px"
              showPanel={false}
              sx={{ width: '100%' }}
            >
              {row.col2}
            </MetricCard>
          )}
          {row.col3 && (
            <MetricCard
              metricName={row.col3}
              datasource={datasource}
              height="250px"
              showPanel={false}
              sx={{ width: '100%' }}
            >
              {row.col3}
            </MetricCard>
          )}
          {row.col4 && (
            <MetricCard
              metricName={row.col4}
              datasource={datasource}
              height="250px"
              showPanel={false}
              sx={{ width: '100%' }}
            >
              {row.col4}
            </MetricCard>
          )}
        </Stack>
      )}
    />
  );
}

export interface PrometheusMetricsFinderProps extends StackProps {}

export function PrometheusMetricsFinder({ ...props }: PrometheusMetricsFinderProps) {
  const [datasource, setDatasource] = useState<DatasourceSelector>(DEFAULT_PROM); // TODO: retrieve from context
  const [filters, setFilters] = useState<LabelFilter[]>([]);

  // const filteredFilters: LabelFilter[] = useMemo(() => {
  //   const usableFilters = filters.filter((filter) => filter.label && filter.labelValues.length);
  //   const result: Map<string, Set<string>> = new Map();
  //
  //   for (const filter of usableFilters) {
  //     if (!result.has(filter.label)) {
  //       result.set(filter.label, new Set());
  //     }
  //     for (const labelValue of filter.labelValues) {
  //       result.get(filter.label)!.add(labelValue);
  //     }
  //   }
  //
  //   return Object.entries(result).map(([label, labelValues]) => {
  //     return { label, labelValues: Array.from(labelValues) };
  //   });
  // }, [filters]);

  // Remove duplicated filters and filters without label or labelValues
  const filteredFilters: LabelFilter[] = useMemo(() => {
    const usableFilters: Map<string, Set<string>> = new Map();

    for (const filter of filters) {
      // Ignore filters without a label or labelValues
      if (!filter.label || filter.labelValues.length === 0) {
        continue;
      }

      // Remove duplicated labelValues
      let labelValues = usableFilters.get(filter.label);
      if (!labelValues) {
        labelValues = new Set<string>();
        usableFilters.set(filter.label, labelValues);
      }
      for (const labelValue of filter.labelValues) {
        labelValues.add(labelValue);
      }
    }

    // Format the result
    const result: LabelFilter[] = [];
    for (const [label, labelValues] of usableFilters.entries()) {
      result.push({ label, labelValues: Array.from(labelValues) });
    }

    return result;
  }, [filters]);

  return (
    <Stack {...props}>
      <FinderFilters
        datasource={datasource}
        filters={filters}
        onDatasourceChange={setDatasource}
        onFiltersChange={setFilters}
      />
      <MetricNameExplorer datasource={datasource} filters={filteredFilters} />
    </Stack>
  );
}
