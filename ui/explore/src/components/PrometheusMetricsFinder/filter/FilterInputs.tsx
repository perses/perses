import { cloneElement, forwardRef, HTMLAttributes, ReactElement, useMemo, useRef, useState } from 'react';
import { Autocomplete, IconButton, InputAdornment, TextField } from '@mui/material';
import CheckIcon from 'mdi-material-ui/Check';
import * as React from 'react';
import DeleteIcon from 'mdi-material-ui/Delete';
import { DatasourceSelector } from '@perses-dev/core';
import { useDatasourceClient } from '@perses-dev/plugin-system';
import {
  LabelNamesRequestParameters,
  LabelValuesRequestParameters,
  LabelValuesResponse,
  PrometheusClient,
} from '@perses-dev/prometheus-plugin';
import { useQuery } from '@tanstack/react-query';
import { Virtuoso } from 'react-virtuoso';
import { computeFilterExpr, LabelFilter } from '../types';

export interface LabelFilterInputProps {
  datasource: DatasourceSelector;
  value: LabelFilter;
  filters: LabelFilter[];
  onChange: (next: LabelFilter) => void;
  onDelete: () => void;
}

// TODO: fix when a filter is deleted => refresh data
export function LabelFilterInput({ datasource, value, filters, onChange, onDelete }: LabelFilterInputProps) {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  const filtersWithoutCurrent = useMemo(
    () => filters.filter((filter) => filter.label !== value.label),
    [filters, value.label]
  );

  const { data: labelOptions, isLoading: isLabelOptionsLoading } = useQuery<LabelValuesResponse>({
    enabled: !!client,
    queryKey: ['labels', 'datasource', datasource.name, 'filters', filtersWithoutCurrent],
    queryFn: async () => {
      const params: LabelNamesRequestParameters = {};
      if (filters.length) {
        params['match[]'] = [`{${computeFilterExpr(filters)}}`];
      }

      return await client!.labelNames(params);
    },
  });

  const { data: labelValuesOptions, isLoading: isLabelValuesOptionsLoading } = useQuery<LabelValuesResponse>({
    enabled: !!client,
    queryKey: ['labelValues', value.label, 'datasource', datasource.name, 'filters', filtersWithoutCurrent],
    queryFn: async () => {
      const params: LabelValuesRequestParameters = { labelName: value.label };
      if (filters.length) {
        params['match[]'] = [`{${computeFilterExpr(filters)}}`];
      }

      return await client!.labelValues(params);
    },
  });

  return (
    <RawFilterInput
      value={value}
      labelOptions={labelOptions?.data ?? []}
      labelValuesOptions={labelValuesOptions?.data ?? []}
      isLabelOptionsLoading={isLabelOptionsLoading}
      isLabelValuesOptionsLoading={isLabelValuesOptionsLoading}
      onChange={onChange}
      onDelete={onDelete}
    />
  );
}

// https://stackoverflow.com/questions/69060738/material-ui-autocomplete-virtualization-w-react-virtuoso
const ListboxComponent = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(
  ({ children, ...rest }, ref) => {
    const data = children as ReactElement[];
    const localRef = useRef<string>('500px');

    const [height, setHeight] = useState(0);

    return (
      <ul
        style={{ overflow: 'hidden', padding: '0', height: height ? `min(40vh, ${height}px)` : '40vh' }}
        ref={(reference) => {
          const maxHeight = reference ? getComputedStyle(reference).maxHeight : null;
          if (maxHeight && maxHeight !== localRef.current) {
            localRef.current = maxHeight;
          }

          if (typeof ref === 'function') {
            ref(reference);
          }
        }}
        {...rest}
      >
        <Virtuoso
          style={{ height: localRef.current, padding: '10px 0' }}
          data={data}
          totalListHeightChanged={setHeight}
          itemContent={(index, child) => {
            return cloneElement(child, { index });
          }}
        />
      </ul>
    );
  }
);
ListboxComponent.displayName = 'ListboxComponent';

export interface RawFilterInputProps {
  value: LabelFilter;
  labelOptions?: string[];
  labelValuesOptions?: string[];
  isLabelOptionsLoading?: boolean;
  isLabelValuesOptionsLoading?: boolean;
  onChange: (next: LabelFilter) => void;
  onDelete: () => void;
}

export function RawFilterInput({ value, labelOptions, labelValuesOptions, onChange, onDelete }: RawFilterInputProps) {
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
        options={labelOptions ?? []}
        value={value.label}
        sx={{ width: 250, display: isEditingLabelName ? 'block' : 'none' }}
        ListboxComponent={ListboxComponent}
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
        onInputChange={(_: React.SyntheticEvent, newValue: string | null) => {
          onChange({ label: newValue ?? '', labelValues: value.labelValues });
        }}
      />
      <Autocomplete
        freeSolo
        multiple
        limitTags={1}
        disableClearable
        options={labelValuesOptions ?? []}
        value={value.labelValues}
        ListboxComponent={ListboxComponent}
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
        onChange={(_: React.SyntheticEvent, newValue: string[] | null) => {
          if (Array.isArray(newValue)) {
            onChange({ label: value.label, labelValues: newValue });
          }
        }}
      />
    </>
  );
}
