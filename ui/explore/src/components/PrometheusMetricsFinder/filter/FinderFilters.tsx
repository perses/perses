import { FormControl, IconButton, InputLabel, Stack, StackProps } from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import { DatasourceSelect } from '@perses-dev/plugin-system';
import { PROM_DATASOURCE_KIND } from '@perses-dev/prometheus-plugin';
import PlusIcon from 'mdi-material-ui/Plus';
import * as React from 'react';
import { LabelFilter } from '../types';
import { LabelFilterInput } from './FilterInputs';

export interface ExplorerFiltersProps extends StackProps {
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  filteredFilters: LabelFilter[];
  onDatasourceChange: (next: DatasourceSelector) => void;
  onFiltersChange: (next: LabelFilter[]) => void;
}

export function FinderFilters({
  datasource,
  filters,
  filteredFilters,
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
        <LabelFilterInput
          key={index}
          datasource={datasource}
          filters={filteredFilters}
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
