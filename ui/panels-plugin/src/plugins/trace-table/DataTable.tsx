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

import { Avatar, Box, Chip, Link, Tooltip, Typography, useTheme } from '@mui/material';
import {
  QueryDefinition,
  ServiceStats,
  TraceData,
  TraceSearchResult,
  formatDuration,
  msToPrometheusDuration,
} from '@perses-dev/core';
import { QueryData } from '@perses-dev/plugin-system';
import { Link as RouterLink } from 'react-router-dom';
import InformationIcon from 'mdi-material-ui/Information';
import { useChartsTheme } from '@perses-dev/components';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import { getServiceColor } from '../tracing-gantt-chart/TracingGanttChart/utils';
import { TraceTableOptions } from './trace-table-model';

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'long',
  timeStyle: 'medium',
}).format;
const UTC_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'long',
  timeStyle: 'long',
  timeZone: 'UTC',
}).format;

export type TraceLink = (params: { query: QueryDefinition; traceId: string }) => string;

export interface DataTableProps {
  options: TraceTableOptions;
  result: Array<QueryData<TraceData>>;
  traceLink?: TraceLink;
}

interface Row extends TraceSearchResult {
  id: string;
  traceLink?: string;
}

export function DataTable(props: DataTableProps) {
  const { options, result, traceLink } = props;
  const muiTheme = useTheme();
  const chartsTheme = useChartsTheme();

  const paletteMode = options.visual?.palette?.mode;
  const serviceColorGenerator = useCallback(
    (serviceName: string) => getServiceColor(muiTheme, chartsTheme, paletteMode, serviceName),
    [muiTheme, chartsTheme, paletteMode]
  );

  const rows: Row[] = [];
  for (const query of result) {
    for (const trace of query.data?.searchResult || []) {
      rows.push({
        ...trace,
        id: trace.traceId,
        traceLink: traceLink?.({ query: query.definition, traceId: trace.traceId }),
      });
    }
  }

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      {
        field: 'name',
        headerName: 'Trace name',
        type: 'string',
        flex: 4,
        display: 'flex',
        valueGetter: (_, trace) => `${trace.rootServiceName}: ${trace.rootTraceName}`,
        renderCell: ({ row }) => (
          <Box sx={{ my: 1 }}>
            <TraceName row={row} />
            <br />
            {Object.entries(row.serviceStats).map(([serviceName, stats]) => (
              <ServiceChip
                key={serviceName}
                serviceName={serviceName}
                stats={stats}
                serviceColor={serviceColorGenerator(serviceName)}
              />
            ))}
          </Box>
        ),
      },
      {
        field: 'spanCount',
        headerName: 'Spans',
        type: 'number',
        headerAlign: 'left',
        align: 'left',
        flex: 2,
        minWidth: 145,
        display: 'flex',
        valueGetter: (_, trace) => Object.values(trace.serviceStats).reduce((acc, val) => acc + val.spanCount, 0),
        renderCell: ({ row }) => {
          let totalSpanCount = 0;
          let totalErrorCount = 0;
          for (const stats of Object.values(row.serviceStats)) {
            totalSpanCount += stats.spanCount;
            totalErrorCount += stats.errorCount ?? 0;
          }
          return (
            <>
              <Typography display="inline">{totalSpanCount} spans</Typography>
              {totalErrorCount > 0 && (
                <Chip
                  label={`${totalErrorCount} error${totalErrorCount === 1 ? '' : 's'}`}
                  sx={{ marginLeft: '5px' }}
                  icon={<InformationIcon />}
                  variant="outlined"
                  size="small"
                  color="error"
                />
              )}
            </>
          );
        },
      },
      {
        field: 'durationMs',
        headerName: 'Duration',
        type: 'number',
        headerAlign: 'left',
        align: 'left',
        flex: 1,
        minWidth: 70,
        display: 'flex',
        renderCell: ({ row }) => (
          <Typography display="inline">
            {row.durationMs < 1 ? '<1ms' : formatDuration(msToPrometheusDuration(row.durationMs))}
          </Typography>
        ),
      },
      {
        field: 'startTimeUnixMs',
        headerName: 'Start time',
        type: 'number',
        headerAlign: 'left',
        align: 'left',
        flex: 3,
        minWidth: 240,
        display: 'flex',
        renderCell: ({ row }) => (
          <Tooltip title={UTC_DATE_FORMATTER(new Date(row.startTimeUnixMs))} placement="top" arrow>
            <Typography display="inline">{DATE_FORMATTER(new Date(row.startTimeUnixMs))}</Typography>
          </Tooltip>
        ),
      },
    ],
    [serviceColorGenerator]
  );

  return (
    <DataGrid
      sx={{ borderWidth: 0 }}
      columns={columns}
      rows={rows}
      getRowHeight={() => 'auto'}
      getEstimatedRowHeight={() => 66}
      autoHeight={true}
      disableRowSelectionOnClick={true}
      pageSizeOptions={[10, 20, 50, 100]}
      initialState={{
        pagination: { paginationModel: { pageSize: 20 } },
      }}
    />
  );
}

interface TraceNameProps {
  row: Row;
}

function TraceName({ row: trace }: TraceNameProps) {
  if (trace.traceLink) {
    return (
      <Link variant="body1" color="inherit" underline="hover" component={RouterLink} to={trace.traceLink}>
        <strong>{trace.rootServiceName}:</strong> {trace.rootTraceName}
      </Link>
    );
  }

  return (
    <Typography display="inline">
      <strong>{trace.rootServiceName}:</strong> {trace.rootTraceName}
    </Typography>
  );
}

interface ServiceChipProps {
  serviceName: string;
  stats: ServiceStats;
  serviceColor: string;
}

function ServiceChip({ serviceName, stats, serviceColor }: ServiceChipProps) {
  return (
    <Chip
      label={serviceName}
      variant="outlined"
      size="small"
      style={{ ['--service-color' as string]: serviceColor }}
      sx={{ marginTop: '5px', marginRight: '5px', borderColor: 'var(--service-color)' }}
      avatar={
        <Avatar
          sx={{
            backgroundColor: 'var(--service-color)',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            textShadow: '0 0 5px #fff',
          }}
        >
          {stats.spanCount}
        </Avatar>
      }
    />
  );
}
