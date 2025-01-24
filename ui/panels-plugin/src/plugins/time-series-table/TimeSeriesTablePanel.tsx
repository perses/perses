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

import { useDataQueries } from '@perses-dev/plugin-system';
import { Box } from '@mui/material';
import { LoadingOverlay, useChartsTheme } from '@perses-dev/components';
import { ReactElement } from 'react';
import { TimeSeriesTableProps } from './TimeSeriesTable';
import DataTable from './DataTable';

export function TimeSeriesTablePanel(props: TimeSeriesTableProps): ReactElement {
  const { contentDimensions } = props;
  const chartsTheme = useChartsTheme();
  const { isFetching, isLoading, queryResults } = useDataQueries('TimeSeriesQuery');
  const contentPadding = chartsTheme.container.padding.default;

  if (isLoading || isFetching) {
    return <LoadingOverlay />;
  }

  return (
    <Box sx={{ height: contentDimensions?.height || 0, padding: `${contentPadding}px`, overflowY: 'scroll' }}>
      <DataTable result={queryResults} />
    </Box>
  );
}
