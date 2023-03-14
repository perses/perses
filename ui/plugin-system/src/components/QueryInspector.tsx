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
import { useActiveTimeSeriesQueries, useTimeRange } from '../runtime';

export interface WarningDisplay {
  query: string;
  header: string;
  summary: string;
}

interface QueryInspectorProps {
  showTotalQueries?: boolean;
}

export function QueryInspector(props: QueryInspectorProps) {
  const { showTotalQueries } = props;
  const queryClient = useQueryClient();
  const queries = queryClient.getQueryCache().findAll();
  const activeQueries = queries.filter((query) => query.state.status === 'loading');
  const completedQueries = queries.filter((query) => query.state.status === 'success');

  const { absoluteTimeRange } = useTimeRange();

  const querySummary = useActiveTimeSeriesQueries();

  const warnings: WarningDisplay[] = [];
  querySummary.forEach((query) => {
    const queryData = query.state.data;
    if (queryData && queryData.metadata?.notices) {
      const queryKey = query.queryKey as [TimeSeriesQueryDefinition<UnknownSpec>];
      const warningMessage = queryData.metadata.notices[0]?.message;
      if (warningMessage) {
        warnings.push({
          query: String(queryKey[0].spec.plugin.spec.query),
          header: warningMessage,
          summary: getResponseHeadersSummary(warningMessage),
        });
      }
    }
  });

  return (
    <Stack spacing={2} mb={2}>
      <Box>
        <Typography variant="h2" mb={1}>
          Query Summary
        </Typography>
        <TableContainer component={Paper}>
          <Table
            sx={{
              maxWidth: 800,
            }}
            size="small"
            aria-label="query inspector table"
          >
            <TableHead>
              <TableRow>
                <TableCell>Active Queries</TableCell>
                <TableCell>Time Series Queries</TableCell>
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
        <Box>
          <Typography variant="h3" mb={1}>
            Warnings
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table
              sx={{
                maxWidth: 800,
              }}
              size="small"
              aria-label="query warnings table"
            >
              <TableHead>
                <TableRow>
                  <TableCell>Query</TableCell>
                  <TableCell>Header</TableCell>
                  <TableCell>Summary</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warnings.map((details, idx) => {
                  return (
                    <TableRow key={idx}>
                      <TableCell>{details.query}</TableCell>
                      <TableCell>{details.header}</TableCell>
                      <TableCell>{details.summary}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            disabled
            variant="outlined"
            onClick={() => {
              // TODO: clear query limit HTTP headers
            }}
          >
            Disable Query Truncation
          </Button>
        </Box>
      )}
    </Stack>
  );
}

/**
 * Get response headers for query inspection summary
 */
export function getResponseHeadersSummary(header: string) {
  // TODO: configurable formatting
  try {
    const summary = JSON.parse(header);
    if (summary.Limited) {
      return 'At least one set of query results was too large and had to be truncated.';
    }
  } catch {
    // No-op
  }
  if (typeof header === 'string') {
    return header;
  }
  return '';
}
