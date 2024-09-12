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
  Avatar,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  styled,
  useTheme,
} from '@mui/material';
import {
  QueryDefinition,
  ServiceStats,
  TraceData,
  TraceSearchResult,
  formatDuration,
  msToPrometheusDuration,
} from '@perses-dev/core';
import { QueryData } from '@perses-dev/plugin-system';
import { ReactNode, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import InformationIcon from 'mdi-material-ui/Information';
import { useChartsTheme } from '@perses-dev/components';
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

export function DataTable(props: DataTableProps) {
  const { options, result, traceLink } = props;
  const muiTheme = useTheme();
  const chartsTheme = useChartsTheme();

  const paletteMode = options.visual?.palette?.mode;
  const serviceColorGenerator = useCallback(
    (serviceName: string) => getServiceColor(muiTheme, chartsTheme, paletteMode, serviceName),
    [muiTheme, chartsTheme, paletteMode]
  );

  if (!result) {
    return null;
  }

  const rows: ReactNode[] = [];
  for (const query of result) {
    const traceLinkWithQuery = traceLink
      ? (traceId: string) => traceLink({ query: JSON.parse(JSON.stringify(query.definition)), traceId })
      : undefined;
    for (const trace of query.data?.searchResult || []) {
      rows.push(buildRow(trace, serviceColorGenerator, traceLinkWithQuery));
    }
  }

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <StyledTableCell>
              <Typography>Trace name</Typography>
            </StyledTableCell>
            <StyledTableCell>
              <Typography>Spans</Typography>
            </StyledTableCell>
            <StyledTableCell>
              <Typography>Duration</Typography>
            </StyledTableCell>
            <StyledTableCell>
              <Typography>Start time</Typography>
            </StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </>
  );
}

function buildRow(
  trace: TraceSearchResult,
  serviceColorGenerator: (serviceName: string) => string,
  traceLink?: (traceId: string) => string
): ReactNode {
  let totalSpanCount = 0;
  let totalErrorCount = 0;
  for (const stats of Object.values(trace.serviceStats)) {
    totalSpanCount += stats.spanCount;
    totalErrorCount += stats.errorCount ?? 0;
  }

  return (
    <StyledTableRow key={trace.traceId}>
      <StyledTableCell>
        {buildTraceName(trace, traceLink)}
        {buildServiceStatsChips(trace.serviceStats, serviceColorGenerator)}
      </StyledTableCell>
      <StyledTableCell>
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
      </StyledTableCell>
      <StyledTableCell>
        <Typography>
          {trace.durationMs < 1 ? '<1ms' : formatDuration(msToPrometheusDuration(trace.durationMs))}
        </Typography>
      </StyledTableCell>
      <StyledTableCell>
        <Tooltip title={UTC_DATE_FORMATTER(new Date(trace.startTimeUnixMs))} placement="top" arrow>
          <Typography display="inline">{DATE_FORMATTER(new Date(trace.startTimeUnixMs))}</Typography>
        </Tooltip>
      </StyledTableCell>
    </StyledTableRow>
  );
}

function buildTraceName(trace: TraceSearchResult, traceLink?: (traceId: string) => string) {
  if (traceLink) {
    return (
      <>
        <Link variant="body1" color="inherit" underline="hover" component={RouterLink} to={traceLink(trace.traceId)}>
          <strong>{trace.rootServiceName}:</strong> {trace.rootTraceName}
        </Link>
        <br />
      </>
    );
  }

  return (
    <Typography>
      <strong>{trace.rootServiceName}:</strong> {trace.rootTraceName}
    </Typography>
  );
}

function buildServiceStatsChips(
  serviceStats: Record<string, ServiceStats>,
  serviceColorGenerator: (serviceName: string) => string
) {
  return Object.entries(serviceStats).map(([serviceName, stats]) => (
    <Chip
      key={serviceName}
      label={serviceName}
      sx={{ marginTop: '5px', marginRight: '5px' }}
      variant="outlined"
      size="small"
      style={{ borderColor: serviceColorGenerator(serviceName) }}
      avatar={
        <Avatar
          sx={{ fontSize: '0.65rem', fontWeight: 'bold', textShadow: '0 0 5px #fff' }}
          style={{ backgroundColor: serviceColorGenerator(serviceName) }}
        >
          {stats.spanCount}
        </Avatar>
      }
    />
  ));
}

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}));
