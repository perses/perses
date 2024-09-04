import { Box, Button, Card, Stack, StackProps } from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import useResizeObserver from 'use-resize-observer';
import { useInView } from 'react-intersection-observer';
import { DataQueriesProvider, useSuggestedStepMs } from '@perses-dev/plugin-system';
import { Panel } from '@perses-dev/dashboards';
import { useState } from 'react';
import EyeOutlineIcon from 'mdi-material-ui/EyeOutline';
import * as React from 'react';
import { computeFilterExpr, LabelFilter } from '../../types';

export interface MetricCardPanelProps extends StackProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
}

export function MetricCardPanel({ metricName, datasource, filters, ...props }: MetricCardPanelProps) {
  const { width, ref: firstBoxRef } = useResizeObserver();
  const suggestedStepMs = useSuggestedStepMs(width);

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
            query: `{__name__="${metricName}", ${computeFilterExpr(filters)}}`,
          },
        },
      },
    },
  ];

  const definitions = queries.map((query) => {
    return {
      kind: query.spec.plugin.kind,
      spec: query.spec.plugin.spec,
    };
  });

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
                  queries: queries,
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
  filters: LabelFilter[];
  showPanel?: boolean;
  onExplore: (metricName: string) => void;
}

export function MetricCard({ metricName, datasource, filters, showPanel, onExplore, ...props }: MetricCardProps) {
  const [isPanelEnabled, setIsPanelEnabled] = useState(showPanel ?? true);

  return (
    <Stack {...props}>
      <p>{metricName}</p>
      {isPanelEnabled ? (
        <MetricCardPanel metricName={metricName} datasource={datasource} filters={filters} />
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
            onClick={() => onExplore(metricName)}
          >
            Explore metric
          </Button>
        </Card>
      )}
    </Stack>
  );
}
