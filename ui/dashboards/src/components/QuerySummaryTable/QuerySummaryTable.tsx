// Copyright 2023 The Perses Authors
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
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { TimeSeriesQueryDefinition, UnknownSpec } from '@perses-dev/core';
import { useActiveTimeSeriesQueries, useDatasourceClient, useTimeRange } from '@perses-dev/plugin-system';

export interface WarningDisplay {
  query: string;
  summary: string;
}

const TABLE_MAX_WIDTH = 1000;

interface QuerySummaryTableProps {
  showTotalQueries?: boolean;
}

export function QuerySummaryTable(props: QuerySummaryTableProps) {
  const { showTotalQueries = true } = props;
  const datasourcClient = useDatasourceClient({ kind: 'PrometheusDatasource' });
  const { absoluteTimeRange } = useTimeRange();

  // for displaying a summary of recent query results
  const queryClient = useQueryClient();
  const queries = queryClient.getQueryCache().findAll();
  const activeQueries = queries.filter((query) => query.state.status === 'loading');
  const completedQueries = queries.filter((query) => query.state.status === 'success');
  const querySummary = useActiveTimeSeriesQueries();

  if (datasourcClient.isLoading === true) {
    return null;
  }

  const warnings: WarningDisplay[] = [];
  querySummary.forEach((query) => {
    const queryData = query.state.data;
    if (queryData && queryData.metadata?.notices) {
      const queryKey = query.queryKey as [TimeSeriesQueryDefinition<UnknownSpec>];
      const warningMessage = queryData.metadata.notices[0]?.message;
      if (warningMessage) {
        warnings.push({
          query: String(queryKey[0].spec.plugin.spec.query),
          summary: warningMessage,
        });
      }
    }
  });

  return (
    <Stack
      spacing={1}
      mb={2}
      sx={{
        maxWidth: TABLE_MAX_WIDTH,
      }}
    >
      <Box sx={{ p: 1 }}>
        <Typography variant="h2" mb={1}>
          Query Summary
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small" aria-label="query summary table">
            <TableHead>
              <TableRow>
                <TableCell>Queries Loading</TableCell>
                <TableCell>Recent Time Series Queries</TableCell>
                {showTotalQueries && <TableCell>Total Queries</TableCell>}
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{activeQueries.length}</TableCell>
                <TableCell>{querySummary.length}</TableCell>
                {showTotalQueries && <TableCell>{completedQueries.length}</TableCell>}
                <TableCell>{absoluteTimeRange.start.toString()}</TableCell>
                <TableCell>{absoluteTimeRange.end.toString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {warnings.length > 0 && (
        <Box sx={{ p: 1, m: 0 }}>
          <Typography variant="h3" mb={1}>
            Warnings
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small" aria-label="query warnings table">
              <TableHead>
                <TableRow>
                  <TableCell>Query</TableCell>
                  <TableCell>Summary</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warnings.map((details, idx) => {
                  return (
                    <TableRow key={idx}>
                      <TableCell>{details.query}</TableCell>
                      <TableCell>{details.summary}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Button disabled variant="outlined">
            TODO: Action Button
          </Button>
        </Box>
      )}
    </Stack>
  );
}
