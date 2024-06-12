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

import { Avatar, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography, styled } from '@mui/material';
import { PersesChartsTheme, useChartsTheme } from '@perses-dev/components';
import {
  ServiceStats,
  TraceData,
  TraceValue,
  formatDuration,
  msToPrometheusDuration,
  traceServiceColor,
} from '@perses-dev/core';
import { QueryData } from '@perses-dev/plugin-system';
import { ReactNode } from 'react';
import InformationIcon from 'mdi-material-ui/Information';

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: 'long',
  timeStyle: 'medium',
};
const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, DATE_FORMAT_OPTIONS).format;

export interface DataTableProps {
  result: Array<QueryData<TraceData>>;
}

export function DataTable({ result }: DataTableProps) {
  const theme = useChartsTheme();

  if (!result) {
    return null;
  }

  const traces = result.flatMap((d) => d.data).flatMap((d) => d?.traces || []);
  const rows = traces.map(buildRow.bind(null, theme));

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography>Trace Name</Typography>
            </TableCell>
            <TableCell>
              <Typography>Spans</Typography>
            </TableCell>
            <TableCell>
              <Typography>Duration</Typography>
            </TableCell>
            <TableCell>
              <Typography>Start time</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </>
  );
}

function buildRow(theme: PersesChartsTheme, trace: TraceValue): ReactNode {
  let totalSpanCount = 0;
  let totalErrorCount = 0;
  for (const stats of Object.values(trace.serviceStats)) {
    totalSpanCount += stats.spanCount;
    totalErrorCount += stats.errorCount ?? 0;
  }

  return (
    <StyledTableRow key={trace.traceId}>
      <TableCell>
        <Typography>
          <strong>{trace.rootServiceName}:</strong> {trace.rootTraceName}
        </Typography>
        {buildServiceStatsChips(theme, trace.serviceStats)}
      </TableCell>
      <TableCell>
        <Typography display="inline">{totalSpanCount} spans</Typography>
        {totalErrorCount > 0 && (
          <Chip
            label={`${totalErrorCount} errors`}
            sx={{ marginLeft: '5px' }}
            icon={<InformationIcon />}
            variant="outlined"
            size="small"
            color="error"
          />
        )}
      </TableCell>
      <TableCell>
        <Typography>
          {trace.durationMs < 1 ? '<1ms' : formatDuration(msToPrometheusDuration(trace.durationMs))}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography>{DATE_FORMATTER(new Date(trace.startTimeUnixMs))}</Typography>
      </TableCell>
    </StyledTableRow>
  );
}

function buildServiceStatsChips(theme: PersesChartsTheme, serviceStats: Record<string, ServiceStats>) {
  return Object.entries(serviceStats).map(([serviceName, stats]) => (
    <Chip
      key={serviceName}
      label={serviceName}
      sx={{ marginTop: '5px', marginRight: '5px' }}
      variant="outlined"
      size="small"
      avatar={
        <Avatar sx={{ backgroundColor: traceServiceColor(serviceName, theme.echartsTheme.color as string[]) }}>
          {stats.spanCount}
        </Avatar>
      }
    />
  ));
}

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.grey.A100,
  },
}));
