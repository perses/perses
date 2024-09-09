import { DatasourceSelector } from '@perses-dev/core';
import { useDatasourceClient } from '@perses-dev/plugin-system';
import {
  Metric,
  MetricMetadata,
  MetricMetadataRequestParameters,
  MetricMetadataResponse,
  PrometheusClient,
  SeriesRequestParameters,
  SeriesResponse,
} from '@perses-dev/prometheus-plugin';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
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
} from '@mui/material';
import * as React from 'react';
import PlusIcon from 'mdi-material-ui/Plus';
import CheckIcon from 'mdi-material-ui/Check';
import CloseIcon from 'mdi-material-ui/Close';
import { MetricChip } from '../../display/list/MetricList';
import { computeFilterExpr, LabelFilter, LabelValueCounter, Operator } from '../../types';
import { ListboxComponent } from '../../filter/FilterInputs';

export function useSeriesStates(
  datasource: DatasourceSelector,
  metricName: string,
  filters: LabelFilter[]
): {
  series: Metric[] | undefined;
  labelValueCounters: Map<string, Array<{ labelValue: string; counter: number }>>;
  isLoading: boolean;
} {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  const { data: seriesData, isLoading } = useQuery<SeriesResponse>({
    enabled: !!client,
    queryKey: ['series', metricName, 'filters', ...filters],
    queryFn: async () => {
      const params: SeriesRequestParameters = { 'match[]': [`{${computeFilterExpr(filters)}}`] };

      return await client!.series(params);
    },
  });

  const labelValueCounters: Map<string, Array<{ labelValue: string; counter: number }>> = useMemo(() => {
    const result = new Map<string, LabelValueCounter[]>();
    if (seriesData?.data === undefined) {
      return result;
    }

    for (const series of seriesData.data) {
      for (const [label, value] of Object.entries(series)) {
        const labelCounters = result.get(label);
        if (labelCounters === undefined) {
          result.set(label, [{ labelValue: value, counter: 1 }]);
          continue;
        }

        const labelValueCounter = labelCounters.find((counter) => counter.labelValue === value);
        if (labelValueCounter === undefined) {
          labelCounters.push({ labelValue: value, counter: 1 });
        } else {
          labelValueCounter.counter += 1;
        }
      }
    }

    return result;
  }, [seriesData]);

  return { series: seriesData?.data, labelValueCounters, isLoading };
}

export interface LabelValuesRowProps extends StackProps {
  label: string;
  valueCounters: LabelValueCounter[];
  onFilterAdd: (filter: LabelFilter) => void;
  orderBy?: 'asc' | 'amount';
}

export function LabelValuesRow({ label, valueCounters, onFilterAdd, ...props }: LabelValuesRowProps) {
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [operator, setOperator] = useState<Operator>('=');
  const [value, setValue] = useState('');
  const [showAllValues, setShowAllValues] = useState(false); // TODO

  return (
    <Stack key={label} sx={{ width: '100%' }} direction="row" alignItems="center" gap={2} {...props}>
      <Stack
        sx={{ width: '100%', height: '100%' }}
        justifyContent="space-between"
        alignContent="center"
        direction="row"
      >
        <Typography sx={{ fontFamily: 'monospace' }} pl={1}>
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

      <Stack sx={{ width: '100%' }}>
        <Typography variant="subtitle1" sx={{ paddingBottom: 1 }}>
          {valueCounters.length} values
        </Typography>
        <Stack>
          {valueCounters.map((labelValueCounter) => (
            <Stack key={`${label}-${labelValueCounter.labelValue}`} direction="row" gap={2}>
              <Typography
                sx={{
                  fontFamily: 'monospace',
                  ':hover': { backgroundColor: 'rgba(127,127,127,0.35)', cursor: 'pointer' },
                }}
                color="rgb(89, 204, 141)"
                onClick={() => onFilterAdd({ label, labelValues: [labelValueCounter.labelValue], operator: '=' })}
              >
                {labelValueCounter.labelValue}
              </Typography>
              <Typography>({labelValueCounter.counter} series)</Typography>
            </Stack>
          ))}
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

export function LabelValuesTable({ labelValueCounters, isLoading, onFilterAdd, ...props }: LabelValuesTableProps) {
  const labels: string[] = useMemo(() => {
    return [...labelValueCounters.keys()];
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

export function OverviewTab({ metricName, datasource, filters, onFilterAdd, ...props }: OverviewTabProps) {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  const { data: metricData, isLoading: isMetricLoading } = useQuery<MetricMetadataResponse>({
    enabled: !!client,
    queryKey: ['metricMetadata', metricName],
    queryFn: async () => {
      const params: MetricMetadataRequestParameters = { metric: metricName };

      return await client!.metricMetadata(params);
    },
  });

  const metadata: MetricMetadata | undefined = useMemo(() => {
    return metricData?.data?.[metricName]?.[0];
  }, [metricData, metricName]);

  const { series, labelValueCounters, isLoading } = useSeriesStates(datasource, metricName, filters);

  return (
    <Stack gap={2} {...props}>
      <Stack direction="row" alignItems="center" gap={3} mt={1} justifyContent="space-between">
        <Stack gap={1}>
          <Typography variant="h1" sx={{ fontFamily: 'monospace' }}>
            {metricName}
          </Typography>
          <Typography>
            Description:
            {isMetricLoading ? (
              <Skeleton variant="text" width={180} />
            ) : (
              <Typography sx={{ fontStyle: metadata?.help ? 'initial' : 'italic' }}>
                {metadata ? metadata.help : 'unknown'}
              </Typography>
            )}
          </Typography>
        </Stack>
        <Stack gap={1}>
          {isLoading ? <Skeleton variant="rounded" width={75} /> : <MetricChip label={metadata?.type ?? 'unknown'} />}
          <Typography>
            Result:{' '}
            {isLoading ? (
              <Skeleton variant="text" width={20} sx={{ display: 'inline-block' }} />
            ) : (
              <Typography sx={{ fontWeight: 'bold' }}>{series?.length ?? 0} series</Typography>
            )}
          </Typography>
        </Stack>
      </Stack>

      <LabelValuesTable labelValueCounters={labelValueCounters} onFilterAdd={onFilterAdd} isLoading={isLoading} />
    </Stack>
  );
}
