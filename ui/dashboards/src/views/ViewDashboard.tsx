// Copyright 2021 The Perses Authors
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

import { useCallback, useMemo } from 'react';
import { Box, BoxProps } from '@mui/material';
import { combineSx } from '@perses-dev/components';
import { DashboardResource } from '@perses-dev/core';
import { DatasourcesContext, Datasources, useDatasources } from '@perses-dev/plugin-system';
import { TimeRangeStateProvider, TemplateVariablesProvider } from '../context';
import { Dashboard, VariableOptionsDrawer } from '../components';

export interface ViewDashboardProps extends BoxProps {
  dashboardResource: DashboardResource;
}

/**
 * The View for displaying a Dashboard, along with the UI for selecting variable values.
 */
export function ViewDashboard(props: ViewDashboardProps) {
  const { dashboardResource, sx, children, ...others } = props;

  // Provide a more specific context inside the Dashboard that uses the dashboard's specified default datasource rather
  // than the overall system-wide default
  const { getDatasource } = useDatasources();
  const getDatasourceForDashboard: Datasources['getDatasource'] = useCallback(
    (selector) => {
      selector ??= dashboardResource.spec.datasource;
      return getDatasource(selector);
    },
    [getDatasource, dashboardResource.spec.datasource]
  );
  const datasourcesContext = useMemo(() => ({ getDatasource: getDatasourceForDashboard }), [getDatasourceForDashboard]);

  return (
    <TimeRangeStateProvider initialValue={{ pastDuration: dashboardResource.spec.duration }}>
      <TemplateVariablesProvider variableDefinitions={dashboardResource.spec.variables}>
        <DatasourcesContext.Provider value={datasourcesContext}>
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
            <Box
              sx={{
                padding: (theme) => theme.spacing(1, 2),
                flexGrow: 1,
                overflowX: 'hidden',
                overflowY: 'auto',
              }}
            >
              <Dashboard spec={dashboardResource.spec} />
              {children}
            </Box>

            <VariableOptionsDrawer variables={dashboardResource.spec.variables} />
          </Box>
        </DatasourcesContext.Provider>
      </TemplateVariablesProvider>
    </TimeRangeStateProvider>
  );
}
