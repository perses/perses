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

import { PanelProps, useDataQueries } from '@perses-dev/plugin-system';
import { LoadingOverlay, NoDataOverlay, TextOverlay, useChartsTheme } from '@perses-dev/components';
import { Box } from '@mui/material';
import { GanttChartOptions } from './gantt-chart-model';
import { GanttChart } from './GanttChart/GanttChart';

export type GanttChartPanelProps = PanelProps<GanttChartOptions>;

export function GanttChartPanel() {
  const chartsTheme = useChartsTheme();
  const contentPadding = chartsTheme.container.padding.default;
  const { isFetching, isLoading, queryResults } = useDataQueries('TraceQuery');

  if (queryResults.length > 1) {
    return <TextOverlay message="This panel does not support more than one query." />;
  }

  if (isLoading || isFetching) {
    return <LoadingOverlay />;
  }

  const queryError = queryResults.find(d => d.error);
  if (queryError) {
    throw queryError.error;
  }

  const trace = queryResults[0]?.data?.trace;
  if (!trace) {
    return <NoDataOverlay resource="trace" />;
  }

  return (
    <Box sx={{ height: '100%', padding: `${contentPadding}px` }}>
      <GanttChart rootSpan={trace.rootSpan} />
    </Box>
  );
}
