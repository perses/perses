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

import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { PanelProps, QueryData, useDataQueries } from '@perses-dev/plugin-system';
import { useChartsTheme } from '@perses-dev/components';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { TimeSeriesData } from '@perses-dev/core';
import { TableOptions } from './model';

export type TablePanelOptions = PanelProps<TableOptions>;

export function TablePanel(props: TablePanelOptions) {
  const { contentDimensions } = props;
  const chartsTheme = useChartsTheme();
  const { isFetching, isLoading, queryResults } = useDataQueries('TimeSeriesQuery');

  // TODO: consider refactoring how the layout/spacing/alignment are calculated
  // the next time significant changes are made to the time series panel (e.g.
  // when making improvements to the legend to more closely match designs).
  // This may also want to include moving some of this logic down to the shared,
  // embeddable components.
  const contentPadding = chartsTheme.container.padding.default;
  const adjustedContentDimensions: typeof contentDimensions = contentDimensions
    ? {
        width: contentDimensions.width - contentPadding * 2,
        height: contentDimensions.height - contentPadding * 2,
      }
    : undefined;

  if (adjustedContentDimensions === undefined) {
    return null;
  }

  if (isLoading || isFetching) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        width={adjustedContentDimensions.width}
        height={adjustedContentDimensions.height}
      >
        <Skeleton
          variant="text"
          width={adjustedContentDimensions.width - 20}
          height={adjustedContentDimensions.height / 2}
          aria-label="Loading..."
        />
      </Box>
    );
  }
  return (
    <Box sx={{ height: contentDimensions?.height || 0, padding: `${contentPadding}px` }}>
      <DataGrid rows={buildRows(queryResults)} columns={buildCols(queryResults)}></DataGrid>
    </Box>
  );
}

function buildRows(queryResults: Array<QueryData<TimeSeriesData>>) {
  return queryResults
    .flatMap((result) => result.data?.series ?? [])
    .map((serie, rowID) => {
      return { id: rowID, ...serie.labels, value: serie.values[0] };
    });
}

function buildCols(queryResults: Array<QueryData<TimeSeriesData>>) {
  const uniqueLabels = new Set<string>();
  queryResults
    .flatMap((result) => result.data?.series ?? [])
    .flatMap((serie) => {
      return Object.keys(serie.labels ?? {});
    })
    .forEach((label) => {
      uniqueLabels.add(label);
    });
  uniqueLabels.add('value');

  return Array.from(uniqueLabels).map((label): GridColDef => {
    return { field: label, headerName: label, flex: 1 };
  });
}
