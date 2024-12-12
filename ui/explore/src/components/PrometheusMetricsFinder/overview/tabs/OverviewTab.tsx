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

import { DatasourceSelector } from '@perses-dev/core';
import { ReactElement, useMemo, useState } from 'react';
import {
  Autocomplete,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Stack,
  StackProps,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PlusIcon from 'mdi-material-ui/Plus';
import CheckIcon from 'mdi-material-ui/Check';
import CloseIcon from 'mdi-material-ui/Close';
import { LabelFilter, LabelValueCounter, Operator } from '../../types';
import { ListboxComponent } from '../../filter/FilterInputs';
import { useMetricMetadata, useSeriesStates } from '../../utils';
import { MetricChip } from '../../display/MetricChip';

export interface LabelValuesRowProps extends StackProps {
  label: string;
  valueCounters: LabelValueCounter[];
  onFilterAdd: (filter: LabelFilter) => void;
  orderBy?: 'asc' | 'amount';
}

export function LabelValuesRow({ label, valueCounters, onFilterAdd, ...props }: LabelValuesRowProps): ReactElement {
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [operator, setOperator] = useState<Operator>('=');
  const [value, setValue] = useState('');
  const [showAllValues, setShowAllValues] = useState(false);
  const isMobileSize = useMediaQuery(useTheme().breakpoints.down('md'));

  const displayedValueCounters = useMemo(() => {
    if (showAllValues) {
      return valueCounters;
    }
    return valueCounters.slice(0, 5);
  }, [showAllValues, valueCounters]);

  return (
    <Stack
      key={label}
      sx={{ width: '100%' }}
      direction={isMobileSize ? 'column' : 'row'}
      alignItems="center"
      gap={2}
      {...props}
    >
      <Stack
        sx={{ width: '100%', height: '100%' }}
        justifyContent="space-between"
        alignContent="center"
        direction={isMobileSize ? 'column' : 'row'}
      >
        <Typography sx={{ fontFamily: 'monospace' }} pl={isMobileSize ? 0 : 1}>
          {label}
        </Typography>
        <Stack direction="row" gap={1} alignItems="center">
          {isAddingFilter ? (
            <>
              <Select
                size="small"
                value={operator}
                variant="outlined"
                onChange={(event: SelectChangeEvent) => {
                  setOperator(event.target.value as Operator);
                }}
              >
                <MenuItem value="=">=</MenuItem>
                <MenuItem value="!=">!=</MenuItem>
                <MenuItem value="=~">=~</MenuItem>
                <MenuItem value="!~">!~</MenuItem>
              </Select>
              <Autocomplete
                freeSolo
                limitTags={1}
                disableClearable
                options={valueCounters.map((counters) => counters.labelValue)}
                value={value}
                ListboxComponent={ListboxComponent}
                sx={{ width: 250 }}
                renderInput={(params) => {
                  return <TextField {...params} label="Value" variant="outlined" fullWidth size="small" />;
                }}
                onInputChange={(_, newValue) => {
                  setValue(newValue);
                }}
              />
              <IconButton
                aria-label="confirm"
                onClick={() => {
                  onFilterAdd({ label, labelValues: [value], operator });
                  setIsAddingFilter(false);
                }}
              >
                <CheckIcon />
              </IconButton>
              <IconButton
                aria-label="cancel"
                onClick={() => {
                  setIsAddingFilter(false);
                }}
              >
                <CloseIcon />
              </IconButton>
            </>
          ) : (
            <Button startIcon={<PlusIcon />} aria-label="add filter" onClick={() => setIsAddingFilter(true)}>
              Add filter
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack sx={{ width: '100%' }} gap={0.5}>
        <Stack direction="row" gap={2}>
          <Typography variant="subtitle1">{valueCounters.length} values</Typography>
        </Stack>

        <Stack sx={{ overflow: isMobileSize ? 'auto' : 'unset' }}>
          {displayedValueCounters.map((labelValueCounter) => (
            <Stack key={`${label}-${labelValueCounter.labelValue}`} direction="row" gap={2}>
              <Typography
                sx={{
                  color: (theme) => theme.palette.success.main,
                  fontFamily: 'monospace',
                  ':hover': { backgroundColor: 'rgba(127,127,127,0.35)', cursor: 'pointer' },
                  textWrap: isMobileSize ? 'nowrap' : 'unset',
                }}
                onClick={() => onFilterAdd({ label, labelValues: [labelValueCounter.labelValue], operator: '=' })}
              >
                {labelValueCounter.labelValue}
              </Typography>
              <Typography sx={{ textWrap: 'nowrap' }}>({labelValueCounter.counter} series)</Typography>
            </Stack>
          ))}
        </Stack>
        <Stack width="100%" textAlign={isMobileSize ? 'center' : 'unset'}>
          {showAllValues ? (
            <Button variant="text" sx={{ width: 'fit-content' }} onClick={() => setShowAllValues(false)}>
              Hide full values
            </Button>
          ) : (
            <>
              {valueCounters.length > 5 && (
                <Button variant="text" sx={{ width: 'fit-content' }} onClick={() => setShowAllValues(true)}>
                  Show {valueCounters.length - 5} more values
                </Button>
              )}
            </>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

export interface LabelValuesTableProps extends StackProps {
  labelValueCounters: Map<string, LabelValueCounter[]>;
  isLoading?: boolean;
  onFilterAdd: (filter: LabelFilter) => void;
}

export function LabelValuesTable({
  labelValueCounters,
  isLoading,
  onFilterAdd,
  ...props
}: LabelValuesTableProps): ReactElement {
  const labels: string[] = useMemo(() => {
    return [...labelValueCounters.keys()].sort();
  }, [labelValueCounters]);

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack sx={{ width: '100%' }} divider={<Divider flexItem orientation="horizontal" />} gap={2} {...props}>
      <Stack gap={2} direction="row" sx={{ width: '100%' }}>
        <Stack sx={{ width: '100%' }}>
          <Typography variant="h3">Label</Typography>
        </Stack>
        <Stack sx={{ width: '100%' }}>
          <Typography variant="h3">Values</Typography>
        </Stack>
      </Stack>
      {labels.map((label) => (
        <LabelValuesRow
          key={label}
          label={label}
          valueCounters={labelValueCounters.get(label) ?? []}
          onFilterAdd={onFilterAdd}
        />
      ))}
    </Stack>
  );
}

export interface OverviewTabProps extends StackProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  onFilterAdd: (filter: LabelFilter) => void;
}

export function OverviewTab({
  metricName,
  datasource,
  filters,
  onFilterAdd,
  ...props
}: OverviewTabProps): ReactElement {
  const { metadata, isLoading: isMetadataLoading } = useMetricMetadata(metricName, datasource);
  const { series, labelValueCounters, isLoading } = useSeriesStates(metricName, filters, datasource);

  return (
    <Stack gap={2} {...props}>
      <Stack direction="row" gap={3} mt={1} justifyContent="space-between">
        <Stack gap={1}>
          <Typography variant="h1" sx={{ fontFamily: 'monospace' }}>
            {metricName}
          </Typography>
          <Typography>Description:</Typography>
          {isMetadataLoading ? (
            <Skeleton variant="text" width={180} />
          ) : (
            <Typography style={{ fontStyle: metadata?.help ? 'initial' : 'italic' }}>
              {metadata ? metadata.help : 'unknown'}
            </Typography>
          )}
        </Stack>
        <Stack gap={1} justifyContent="center">
          {isLoading ? <Skeleton variant="rounded" width={75} /> : <MetricChip label={metadata?.type ?? 'unknown'} />}
          <Typography>
            Result:{' '}
            {isLoading ? (
              <Skeleton variant="text" width={20} sx={{ display: 'inline-block' }} />
            ) : (
              <strong>{series?.length ?? 0} series</strong>
            )}
          </Typography>
        </Stack>
      </Stack>

      {series?.length === 0 ? (
        <Stack {...props}>
          <Typography sx={{ color: (theme) => theme.palette.warning.main }}>
            No series found with current filters.
          </Typography>
        </Stack>
      ) : (
        <LabelValuesTable labelValueCounters={labelValueCounters} onFilterAdd={onFilterAdd} isLoading={isLoading} />
      )}
    </Stack>
  );
}
