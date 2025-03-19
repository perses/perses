import { screen, waitFor } from '@testing-library/dom';
import { getMockPluginName, ValidationProvider } from '@perses-dev/plugin-system';
import { renderHook } from '@testing-library/react';
import { act, useRef } from 'react';
import { StoreApi } from 'zustand';
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
    const dashboardStoreApiRef = renderHook(() => useRef<StoreApi<DashboardStoreState>>(null)).result.current;

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
      dashboardStoreApiRef.current?.getState().openAddPanel(undefined, panelDefinitionMock);
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
