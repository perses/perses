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

import { Button, FormControl, InputLabel, Stack, StackProps } from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import { DatasourceSelect } from '@perses-dev/plugin-system';
import { PROM_DATASOURCE_KIND } from '@perses-dev/prometheus-plugin';
import PlusIcon from 'mdi-material-ui/Plus';
import * as React from 'react';
import { ReactElement } from 'react';
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
}: ExplorerFiltersProps): ReactElement {
  function handleDatasourceChange(next: DatasourceSelector): void {
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
      <Button
        startIcon={<PlusIcon />}
        aria-label="add filter"
        onClick={() => {
          onFiltersChange([...filters, { label: '', labelValues: [], operator: '=~' }]);
        }}
      >
        Add filter
      </Button>
    </Stack>
  );
}
