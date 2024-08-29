import { Stack, StackProps } from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import { useDatasourceClient } from '@perses-dev/plugin-system';
import { LabelValuesRequestParameters, LabelValuesResponse, PrometheusClient } from '@perses-dev/prometheus-plugin';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import * as React from 'react';
import { LabelFilter } from '../../types';
import { MetricCard } from './MetricCard';

export interface MetricGridProps extends StackProps {
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  showPanelByDefault?: boolean;
}

export function MetricGrid({ datasource, filters, showPanelByDefault, ...props }: MetricGridProps) {
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
              filters={filters}
              height="250px"
              showPanel={showPanelByDefault}
              sx={{ width: '100%' }}
            >
              {row.col1}
            </MetricCard>
          )}
          {row.col2 && (
            <MetricCard
              metricName={row.col2}
              datasource={datasource}
              filters={filters}
              height="250px"
              showPanel={showPanelByDefault}
              sx={{ width: '100%' }}
            >
              {row.col2}
            </MetricCard>
          )}
          {row.col3 && (
            <MetricCard
              metricName={row.col3}
              datasource={datasource}
              filters={filters}
              height="250px"
              showPanel={showPanelByDefault}
              sx={{ width: '100%' }}
            >
              {row.col3}
            </MetricCard>
          )}
          {row.col4 && (
            <MetricCard
              metricName={row.col4}
              datasource={datasource}
              filters={filters}
              height="250px"
              showPanel={showPanelByDefault}
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
