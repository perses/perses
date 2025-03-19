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

import { screen, waitFor } from '@testing-library/dom';
import { getMockPluginName, ValidationProvider } from '@perses-dev/plugin-system';
import { renderHook } from '@testing-library/react';
import { act, useRef } from 'react';
import { PanelDefinition } from '@perses-dev/core';
import { defaultDatasourceProps, getTestDashboard, renderWithContext } from '../../../test';
import { ViewDashboard, ViewDashboardProps } from '../ViewDashboard';
import { DashboardStoreState } from '../../../context';

describe('View Dashboard', () => {
  const dashboardResource = getTestDashboard();
  const renderDashboard = (props?: Partial<ViewDashboardProps>): void => {
    renderWithContext(
      <ValidationProvider>
        <ViewDashboard
          dashboardResource={dashboardResource}
          datasourceApi={defaultDatasourceProps.datasourceApi}
          isReadonly={false}
          isVariableEnabled={true}
          isDatasourceEnabled={true}
          {...props}
        />
      </ValidationProvider>
    );
  };

  it('should render component', () => {
    renderDashboard();
    const dashboardName = dashboardResource.metadata.name;

    expect(screen.getByText(dashboardName)).toBeInTheDocument();
  });

  it('should allow external access to the dashboardStoreState and trigger panel editor actions', async () => {
    const dashboardStoreApiRef = renderHook(() => useRef<DashboardStoreState>(null)).result.current;

    renderDashboard({ dashboardStoreApiRef });

    // Ensure the store is initialized
    await waitFor(() => expect(dashboardStoreApiRef.current).toBeDefined());

    const CUSTOM_DISPLAY_NAME = 'Custom Display Name';

    const panelDefinitionMock: PanelDefinition = {
      ...dashboardResource.spec.panels.memory!,
      spec: {
        ...dashboardResource.spec.panels.memory!.spec,
        display: {
          name: CUSTOM_DISPLAY_NAME,
        },
      },
    };

    // Trigger the panel editor open action using the external store reference
    act(() => {
      dashboardStoreApiRef.current?.openAddPanel(undefined, panelDefinitionMock);
    });

    // Verify that the panel editor is open and displays the expected content
    await waitFor(() => {
      expect(screen.getByText('Add Panel')).toBeInTheDocument();
      expect(screen.getByText(panelDefinitionMock.spec.display.name)).toBeInTheDocument();
      expect(screen.getAllByText(getMockPluginName('TimeSeriesQuery', 'PrometheusTimeSeriesQuery'))).toHaveLength(
        panelDefinitionMock.spec!.queries!.length
      );
    });
  });
});
