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

import { Box, BoxProps } from '@mui/material';
import {
  TimeRangeProviderWithQueryParams,
  useInitialRefreshInterval,
  useInitialTimeRange,
} from '@perses-dev/plugin-system';
import {
  DatasourceGroupingMetadata,
  DEFAULT_DASHBOARD_DURATION,
  DEFAULT_REFRESH_INTERVAL,
  GenericDatasource,
} from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary, combineSx } from '@perses-dev/components';
import { VariableProviderProps, VariableProvider, DatasourceStoreProvider } from '@perses-dev/dashboards';
import React, { ReactElement } from 'react';
import { ViewExploreApp } from './ViewExploreApp';

export interface ViewExploreProps extends Omit<BoxProps, 'children'> {
  datasource: GenericDatasource[];
  externalVariableDefinitions?: VariableProviderProps['externalVariableDefinitions'];
  exploreTitleComponent?: React.ReactNode;
  datasourceGroupingMetadata: DatasourceGroupingMetadata;
}

export function ViewExplore(props: ViewExploreProps): ReactElement {
  const { externalVariableDefinitions, sx, datasource, datasourceGroupingMetadata, exploreTitleComponent, ...others } =
    props;
  const initialTimeRange = useInitialTimeRange(DEFAULT_DASHBOARD_DURATION);
  const initialRefreshInterval = useInitialRefreshInterval(DEFAULT_REFRESH_INTERVAL);

  return (
    <DatasourceStoreProvider
      datasourceGroupingMetadata={datasourceGroupingMetadata}
      dataSource={datasource}
      persesInternal
    >
      <TimeRangeProviderWithQueryParams
        initialTimeRange={initialTimeRange}
        initialRefreshInterval={initialRefreshInterval}
      >
        <VariableProvider externalVariableDefinitions={externalVariableDefinitions}>
          <Box
            sx={combineSx(
              {
                display: 'flex',
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
              },
              sx
            )}
            {...others}
          >
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              <ViewExploreApp exploreTitleComponent={exploreTitleComponent} />
            </ErrorBoundary>
          </Box>
        </VariableProvider>
      </TimeRangeProviderWithQueryParams>
    </DatasourceStoreProvider>
  );
}
